import React, { Component } from 'react';
//import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import escapeRegExp from 'escape-string-regexp';


class App extends Component {

  constructor(props){
    super(props);
    this.state = {
      venues: [],
      markers: [],
      map: [],
    }

    //this.initMap = this.initMap.bind(this);
  }

  componentDidMount(){
    this.getVenues();
    window.initMap = this.initMap;
    console.log("Component did mount");
  }
  
  //Load the map script
  Map = () => {
    loadMapUrl();
  }

  //Fetching places inforamtion using Foursquare API
  getVenues = () => {
    const endPoint = "https://api.foursquare.com/v2/venues/explore?"
    const credentials = {
      client_id: "ZAM2ZVYH1W4E5KRSTWM140LP5UWX20J5XHK4NAUJLO5CJUNH",
      client_secret: "CZTDHFFXI4SXYOXAN41MCUG2PPDEDIAATTCVRC1FUMGOSI1C",
      query: "Food",
      near: "New York", 
      v: "20181107",
      limit:10,
    }
    
    //Promise based HTTP client for the browser
    axios.get(endPoint + new URLSearchParams(credentials))
    .then(response => {
      this.setState({
        venues: response.data.response.groups[0].items
      }, this.Map() )//callback function
    })
    .catch(error =>{
      alert('Error Occured While Fetching Foursquare API' + error);
    });
  }  

  initMap = () => {
    // Constructor creates a new map - only center and zoom are required.
    this.map = new window.google.maps.Map(document.getElementById('map'), {
      center: {lat: 40.730610, lng: -73.935242},
      zoom: 14,
      mapTypeControl: true
    });

    //Creating InfoWindow and Latitude and Longitudes Bounds
    const bounds = new window.google.maps.LatLngBounds();
    this.InfoWindow = new window.google.maps.InfoWindow();

    //Plotting marker and content on the map
    this.markers = [];
    this.venuesInfo = [];

    //Mapping all the venues using map function to add content to all markers
    //on the map
    this.state.venues.map(myVenue => {
    //Content String Reference https://developers.google.com/maps/documentation/javascript/infowindows
    const contentString = `<div><h3>${myVenue.venue.name.toUpperCase()}</h3>
                          <h5>Address: ${myVenue.venue.location.address}</h5>
                          <h5>Location: ${myVenue.venue.location.city}, ${myVenue.venue.location.state} </h5>
                          <h5>Pincode: ${myVenue.venue.location.postalCode}</h5>
                          <p><strong> ${'<a href="https://foursquare.com/v/' + myVenue.venue.id + '" target="_blank">Click Here For More Info</a>'} </strong> </p></div>`

    const marker = new window.google.maps.Marker({
      map: this.map,
      position: {lat: myVenue.venue.location.lat, lng: myVenue.venue.location.lng},
      animation: window.google.maps.Animation.DROP,
      name: myVenue.venue.name,
      id: myVenue.venue.id,
      });

      marker.addListener('click', () => {
        if(marker.getAnimation() !== null){marker.setAnimation(null);}
        else{marker.setAnimation(window.google.maps.Animation.BOUNCE);}
        setTimeout(function(){ marker.setAnimation(null) }, 1000)
      });

      window.google.maps.event.addListener(marker, 'click', () => {
        // Putting all the content on the map
        this.InfoWindow.setContent(contentString)
        //Centering the position of the map according to the marker
        this.map.setCenter(marker.position);

        this.InfoWindow.open(this.map, marker);
      });

      //Pushing markers to marker variable and pushing venues in the 
      //venuesInfo variable 
      this.state.markers.push(marker);
      this.venuesInfo.push({id: myVenue.venue.id, name:myVenue.venue.name, contents: contentString})

      bounds.extend(marker.getPosition());
      //Adding listener to the marker
      this.map.fitBounds(bounds);
      //Setting state of map, InfoWindow and Venues, So that can be used later
      this.setState ({
        map: this.map,
        InfoWindow: this.InfoWindow,
        venues: this.venuesInfo,
        allVenues: this.venuesInfo,// create venues copy to restore it after when user clear the input search
        });

    return myVenue.marker;
    });

  }

  //Handling user clicks, Whenever user clicks on the sidebar li item, InfoWindow get opened
  clickHandler = (venues) => {
    this.state.markers.map(marker => {
      // Comparing the marker id and venues id, If they are same, then only it will trigger the marker to open 
      // whenever user clicks on the name of the venue in the sidebar
      if (marker.id === venues.id) {
        window.google.maps.event.trigger(marker, 'click');
      }
      return venues;
    });
  }

  // Handling search, Whenever user type in the search box, the list according to the search input will be changed
//and only the search venue and marker will be shown
handlingSearchQuery = (query) => {
  this.setState({ query });
  let filterVenues;
  let hideMarkers;
  this.state.markers.map(marker => marker.setVisible(true));
  if (query) {
    const match = new RegExp(escapeRegExp(query), 'i');
    filterVenues = this.state.venues.filter(venue => match.test(venue.name));
    console.log(filterVenues)
    this.setState({ venues: filterVenues });
    hideMarkers = this.state.markers.filter(marker => filterVenues.every(myVenues => myVenues.name !== marker.name));
    this.setState({ hideMarkers });
    this.state.markers.map(marker => {
      hideMarkers.map(hidden =>{
        if (hidden.id === marker.id ) {
          marker.setVisible(false);
        }
      })
    });
  } else {
    this.setState({ venues: this.state.allVenues });
  }
}
  

  render() {
    return (
      <main id="App">
      <div id="sideBar">
      <div className="heading">
      <h2>Food Places</h2>
      <div className="search">
      <input type="text" placeholder="Search.." aria-labelledby="filter" value={this.state.query} onChange={(e) => {this.handlingSearchQuery(e.target.value)}}></input>
      </div>
      </div>
      {this.state.venues  && this.state.venues.map((venue, id) => ( 
      <div key={id} id="venueList" >
      <ul id="listItem" onClick={() => {this.clickHandler(venue)}}>
      <li>
      {venue.name}
      </li>
      </ul>
      </div>
      ))}
      </div>
      <div id="map" aria-label="Map" role="application" tabIndex="-1">
      </div>
      </main>
    );
  }
}


// This function will generate script tag and will insert the google map API URL Dynamically.
function loadMapUrl(){
  const scriptTag = window.document.createElement('script');
  const apiKey = 'AIzaSyASFSGSrxEXyjwZSqMyzRJBbfq_eFutui8';
  scriptTag.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
  scriptTag.async = true;
  scriptTag.defer = true;
  document.body.appendChild(scriptTag);
}

export default App;
