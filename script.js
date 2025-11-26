// --- PASSWORD PROTECTION ---
const CORRECT_PASSWORDS = ['Novalisa83', 'AleVA']; // !! VIKTIGT: Ändra dessa lösenord till något hemligt!

const passwordContainer = document.getElementById('password-container');
const appContainer = document.getElementById('app-container');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const errorMessage = document.getElementById('error-message');

function checkPassword() {
    if (CORRECT_PASSWORDS.includes(passwordInput.value)) {
        passwordContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        loadMapScript(); // Load the map only after login
    } else {
        errorMessage.textContent = 'Fel lösenord. Försök igen.';
        passwordInput.value = '';
    }
}

async function loadMapScript() {
    try {
        // Fetch the API key from our secure serverless function
        const response = await fetch('/.netlify/functions/get-api-key');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const apiKey = data.apiKey;

        if (!apiKey) {
            alert('Fel: Mottog ingen API-nyckel från servern.');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

    } catch (error) {
        console.error('Error fetching API key:', error);
        alert('Ett allvarligt fel uppstod vid hämtning av API-nyckel. Kontrollera webbläsarens konsol.');
    }
}

loginBtn.addEventListener('click', checkPassword);
passwordInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        checkPassword();
    }
});
// --- END OF PASSWORD PROTECTION ---


// --- MAP APPLICATION LOGIC ---


// Global variables


let map;


let directionsService;


let directionsRenderer;


let geocoder;


let stops = [];


let markers = [];





// DOM elements (these are only used after initMap is called)


let stopsListElement, calculateBtn, clearBtn, totalDurationElement, totalDistanceElement, addressInputEl, addAddressBtn;





/**


 * Initializes the map and services. This function is called by the dynamically loaded Google Maps API script.


 */


function initMap() {


    // Get DOM elements now that the app is visible


    stopsListElement = document.getElementById('stops-list');


    calculateBtn = document.getElementById('calculate-btn');


    clearBtn = document.getElementById('clear-btn');


    totalDurationElement = document.getElementById('total-duration');


    totalDistanceElement = document.getElementById('total-distance');


    addressInputEl = document.getElementById('address-input');


    addAddressBtn = document.getElementById('add-address-btn');





    // Initialize the map


    map = new google.maps.Map(document.getElementById('map'), {


        center: { lat: 57.9702, lng: 12.2517 }, // Centered on Ale kommun


        zoom: 12,


    });





    // Initialize the services


    directionsService = new google.maps.DirectionsService();


    directionsRenderer = new google.maps.DirectionsRenderer({


        map: map,


        suppressMarkers: true // We will handle our own markers


    });


    geocoder = new google.maps.Geocoder();





    // Add event listeners for the app


    map.addListener('click', (event) => {


        geocoder.geocode({ 'location': event.latLng }, (results, status) => {


            if (status === 'OK' && results[0]) {


                addStop(event.latLng, results[0].formatted_address);


            } else {


                addStop(event.latLng, `(${event.latLng.lat().toFixed(4)}, ${event.latLng.lng().toFixed(4)})`);


            }


        });


    });





    calculateBtn.addEventListener('click', calculateAndDisplayRoute);


    clearBtn.addEventListener('click', clearRoute);


    addAddressBtn.addEventListener('click', geocodeAddress);


    addressInputEl.addEventListener('keypress', (e) => {


        if (e.key === 'Enter') geocodeAddress();


    });


}





function geocodeAddress() {


    const address = addressInputEl.value;


    if (!address) return;





    geocoder.geocode({ 'address': address, 'region': 'SE' }, (results, status) => {


        if (status === 'OK') {


            map.setCenter(results[0].geometry.location);


            addStop(results[0].geometry.location, results[0].formatted_address);


            addressInputEl.value = '';


        } else {


            alert('Kunde inte hitta adressen. Fel: ' + status);


        }


    });


}





function addStop(latLng, addressString) {


    const markerLabel = String.fromCharCode('A'.charCodeAt(0) + markers.length);


    const marker = new google.maps.Marker({ position: latLng, map: map, label: markerLabel });


    markers.push(marker);


    stops.push({ location: latLng, address: addressString });





    const listItem = document.createElement('li');


    listItem.textContent = addressString;


    stopsListElement.appendChild(listItem);





    clearBtn.disabled = false;


    if (stops.length >= 2) {


        calculateBtn.disabled = false;


    }


}





function clearRoute() {


    // Clear markers from the map


    for (let i = 0; i < markers.length; i++) {


        markers[i].setMap(null);


    }


    markers = [];


    


    // Clear stops array


    stops = [];





    // Clear the route from the map


    directionsRenderer.setDirections({routes: []});





    // Clear UI elements


    stopsListElement.innerHTML = '';


    totalDurationElement.textContent = '';


    totalDistanceElement.textContent = '';





    // Disable buttons


    calculateBtn.disabled = true;


    clearBtn.disabled = true;


}





function calculateAndDisplayRoute() {





    if (stops.length < 2) return;











    const waypoints = stops.slice(1, stops.length - 1).map(stop => ({





        location: stop.location,





        stopover: true,





    }));











    // Get selected travel mode





    const selectedMode = document.querySelector('input[name="travel-mode"]:checked').value;





    





    const request = {





        origin: stops[0].location,





        destination: stops[stops.length - 1].location,





        waypoints: waypoints,





        // Set travel mode and options based on selection





        travelMode: selectedMode === 'WALKING' ? 'WALKING' : 'DRIVING',





        avoidHighways: selectedMode === 'AVOID_HIGHWAYS',





    };











    directionsService.route(request, (result, status) => {





        if (status === 'OK') {





            directionsRenderer.setDirections(result);





            let totalDuration = 0;





            let totalDistance = 0;





            result.routes[0].legs.forEach(leg => {





                totalDuration += leg.duration.value;





                totalDistance += leg.distance.value;





            });











            // Format and display total duration





            const hours = Math.floor(totalDuration / 3600);





            const minutes = Math.floor((totalDuration % 3600) / 60);





            let durationText = "Total körtid: ";





            if (hours > 0) durationText += `${hours} timmar `;





            durationText += `${minutes} minuter`;





            totalDurationElement.textContent = durationText;











            // Format and display total distance





            const kilometers = (totalDistance / 1000).toFixed(1);





            totalDistanceElement.textContent = `Total sträcka: ${kilometers} km`;











        } else {





            window.alert('Directions request failed due to ' + status);





        }





    });





}
