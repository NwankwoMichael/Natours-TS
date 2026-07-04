// EXTEND THE GLOBAL WINDOW INTERFACE TO INFORM TYPESCRIPT ABOUT THE MAPBOX CDN LIBRARY
interface Window {
  mapboxgl: any;
}

// DEFINE THE STRUCTURAL INTERFACE FOR YOUR TOUR LOCATION DATA PARAMETERS
interface ILocation {
  _id: string;
  type: string;
  coordinates: [number, number]; // Strictly typed tupple [longitude, latitude]
  address: string;
  description: string;
  day: number;
}

/**
 * Initializes and displays the interactive Mapbox routing grid on the tour detail page
 * @param locations Array of populated Tour location data points
 * @param token The backend-provided Mapbox application access token string
 */

export const displayMap = (locations: ILocation[], token: string): void => {
  // Add mapping line (access declared global CDN library Object)
  const mapboxgl = (window as any).mapboxgl;

  // Guard clause
  if (!mapboxgl) {
    console.log("Mapbox GL JS library failed to load from CDN!");
    return;
  }

  mapboxgl.accessToken = token;

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/nwankwo-michael/cmp39ccy7002601sc6arm5g9u",
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create custm marker DOM element
    const el = document.createElement("div");
    el.className = "marker";

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add a pop up
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  // Ensure that map fits the bound
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
