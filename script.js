// --- CONFIGURATION ---
// !! VIKTIGT: Ändra detta lösenord till något hemligt!
const CORRECT_PASSWORD = 'Novalisa83';


// --- PASSWORD PROTECTION ---
const passwordContainer = document.getElementById('password-container');
const appContainer = document.getElementById('app-container');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const errorMessage = document.getElementById('error-message');

function checkPassword() {
    if (passwordInput.value === CORRECT_PASSWORD) {
        passwordContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        loadMapScript(); // Load the map only after login
    } else {
        errorMessage.textContent = 'Fel lösenord. Försök igen.';
        passwordInput.value = '';
    }
}

function loadMapScript() {
    if (GOOGLE_MAPS_API_KEY === 'DIN_API_NYCKEL_HÄR' || !GOOGLE_MAPS_API_KEY) {
        alert('Fel: Google Maps API-nyckel är inte ifylld i script.js.');
        return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
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
let stopsListElement, calculateBtn, totalDurationElement, addressInputEl, addAddressBtn;

/**
 * Initializes the map and services. This function is called by the dynamically loaded Google Maps API script.
 */
function initMap() {
    // Get DOM elements now that the app is visible
    stopsListElement = document.getElementById('stops-list');
    calculateBtn = document.getElementById('calculate-btn');
    totalDurationElement = document.getElementById('total-duration');
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

    if (stops.length >= 2) {
        calculateBtn.disabled = false;
    }
}

function calculateAndDisplayRoute() {
    if (stops.length < 2) return;

    const waypoints = stops.slice(1, stops.length - 1).map(stop => ({
        location: stop.location,
        stopover: true,
    }));

    const request = {
        origin: stops[0].location,
        destination: stops[stops.length - 1].location,
        waypoints: waypoints,
        travelMode: 'DRIVING',
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            let totalDuration = 0;
            result.routes[0].legs.forEach(leg => {
                totalDuration += leg.duration.value;
            });

            const hours = Math.floor(totalDuration / 3600);
            const minutes = Math.floor((totalDuration % 3600) / 60);
            let durationText = "Total körtid: ";
            if (hours > 0) durationText += `${hours} timmar `;
            durationText += `${minutes} minuter`;
            totalDurationElement.textContent = durationText;
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}
