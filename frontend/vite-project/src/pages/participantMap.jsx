import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ParticipantMap = () => {
  const { tripId, username } = useParams(); // Extract tripId and username from URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // Extract lat/lng from query params
  const destinationLat = parseFloat(queryParams.get("destinationLat"));
  const destinationLng = parseFloat(queryParams.get("destinationLng"));
  const participantLat = parseFloat(queryParams.get("participantLat"));
  const participantLng = parseFloat(queryParams.get("participantLng"));
console.log(destinationLat);
console.log(participantLat);
  const mapRef = useRef(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [eta, setEta] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("driving-car"); // Default mode

  useEffect(() => {
    if (!mapRef.current) return;

    const startPoint = [participantLat, participantLng];
    const endPoint = [destinationLat, destinationLng];

    // Create a new map instance
    const map = L.map(mapRef.current).setView(startPoint, 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.marker(startPoint).addTo(map).bindPopup(`${username}'s Location`);
    L.marker(endPoint).addTo(map).bindPopup("Destination");

    const fetchRoute = async () => {
      const API_KEY = "5b3ce3597851110001cf6248e2f685d20dc54b41a3b66e25db5a1f3f"; // Replace with your API key
      const url = `https://api.openrouteservice.org/v2/directions/${mode}?api_key=${API_KEY}&start=${startPoint[1]},${startPoint[0]}&end=${endPoint[1]},${endPoint[0]}`;
      
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}`);

        const data = await response.json();
        if (!data.features || data.features.length === 0) {
          setError("No route found.");
          return;
        }

        const feature = data.features[0];
        const routeInfo = feature.properties.segments?.[0] || feature.properties.summary;
        const routeDistance = (routeInfo.distance / 1000).toFixed(2);
        const routeDurationMinutes = (routeInfo.duration / 60).toFixed(2);
        setDistance(routeDistance);
        setDuration(routeDurationMinutes);

        const arrivalTime = new Date(Date.now() + routeInfo.duration * 1000);
        setEta(arrivalTime.toLocaleTimeString());

        const coordinates = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const routeLine = L.polyline(coordinates, { color: "blue", weight: 4 }).addTo(map);
        map.fitBounds(routeLine.getBounds());

      } catch (err) {
        setError("Failed to load route.");
        console.error(err);
      }
    };

    fetchRoute();
    return () => map.remove();
  }, [mode]);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: "white",
          padding: "10px",
          borderRadius: "5px",
          zIndex: 1000,
        }}
      >
        <label>
          Transport Mode:{" "}
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="driving-car">Driving</option>
            <option value="cycling-regular">Cycling</option>
            <option value="foot-walking">Walking</option>
          </select>
        </label>
      </div>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
      {error && (
        <div style={{ position: "absolute", top: 70, left: 10, background: "red", padding: "10px", borderRadius: "5px", color: "white" }}>
          <h3>{error}</h3>
        </div>
      )}
      {!error && distance && duration && eta && (
        <div style={{ position: "absolute", top: 70, left: 10, background: "white", padding: "10px", borderRadius: "5px" }}>
          <h3>Distance: {distance} km</h3>
          <h3>Duration: {duration} min</h3>
          <h3>ETA: {eta}</h3>
        </div>
      )}
    </div>
  );
};

export default ParticipantMap;
