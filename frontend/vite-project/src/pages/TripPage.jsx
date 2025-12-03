import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FiStar,
  FiUsers,
  FiCheckCircle,
  FiMapPin,
  FiSearch,
  FiClock,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext"; // Importing Auth Context
import { useNavigate } from "react-router-dom";
const TripPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const renderRating = (rating) => {
    return (
      <div className="flex items-center">
        <FiStar className="text-yellow-400" />
        <span className="ml-1">{rating}</span>
      </div>
    );
  };

  const { id } = useParams();
  const [tripName, setTripName] = useState("");
  const [invitedParticipants, setInvitedParticipants] = useState([]);
  const [acceptedParticipants, setAcceptedParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [radius, setRadius] = useState(5); // in kilometers
  const [rating, setRating] = useState(false); // minimum rating
  const [restaurants, setRestaurants] = useState([]);
  const [isSelectingVenue, setIsSelectingVenue] = useState(false);
  const [venueDetails, setVenueDetails] = useState(null);
  const [venues, setVenues] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const YOUR_GOOGLE_API_KEY = "AlzaSyzKVM1XPPbUmUHMc3lN9wxu3cVuRBiqB1g";
  console.log(venueDetails);
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        if (!id) return;
        setIsLoading(true);

        const response = await fetch(
          `http://localhost:3001/trip/${id}/participants`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();
        setTripName(data.tripName);

        const invited = data.participants.filter((p) => !p.acceptedTripInvite);
        const accepted = data.participants.filter((p) => p.acceptedTripInvite);

        setInvitedParticipants(invited);
        setAcceptedParticipants(accepted);
        setError("");
      } catch (error) {
        console.error("Error fetching participants:", error);
        setError("Failed to load trip details. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipants();
  }, [id]);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        console.log("123");
        const response = await fetch(
          `http://localhost:3001/trip/getVenueDetails/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        if (data.placeDetails) {
          setVenueDetails(data.placeDetails);
          console.log(venueDetails);
        }
      } catch (error) {
        console.error("Error fetching venue details:", error);
      }
    };

    if (id) fetchVenueDetails();
  }, [id]);

  useEffect(() => {
    if (acceptedParticipants.length > 0 && currentUser) {
      setIsAdmin(acceptedParticipants[0].userId === currentUser._id);
    }
  }, [acceptedParticipants, currentUser]);

  const fetchRestaurants = async () => {
    try {
      console.log("78");
      const response = await fetch(`http://localhost:3001/trip/decideVenue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          tripId: id,
          keywords: searchTerm,
          radius: radius * 1000, // Convert km to meters
          filterByRating: rating,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch restaurants: ${response.status}`);
      }

      const data = await response.json();
      setVenues(data.venues);
      setError("");
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      setError("Failed to load restaurants. Please try again later.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRestaurants();
  };

  const handleVenueSelect = async (selectedPlace) => {
    try {
      const response = await fetch("http://localhost:3001/trip/selectVenue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Include admin token
        },
        body: JSON.stringify({
          place_id: selectedPlace.place_id, // From Google Places data
          tripId: id, // Current trip ID
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Refresh venue details after selection
        console.log("123");
        const venueResponse = await fetch(
          `http://localhost:3001/trip/getVenueDetails/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const venueData = await venueResponse.json();
        if (venueData.placeDetails) setVenueDetails(venueData.placeDetails);
        setIsSelectingVenue(false);
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
  };

  const handleMemberClick = (participant) => {
    if (
      !venueDetails ||
      !venueDetails.result ||
      !venueDetails.result.geometry
    ) {
      console.error("Venue details are not available");
      return;
    }

    console.log(participant);

    // Note the correction: use "longitude" instead of "logitude"
    if (
      !participant.startLocation ||
      !participant.startLocation.latitude ||
      !participant.startLocation.longitude
    ) {
      console.error("Participant location is not available");
      return;
    }

    const destinationLat = venueDetails.result.geometry.location.lat;
    const destinationLng = venueDetails.result.geometry.location.lng;
    const participantLat = participant.startLocation.latitude;
    const participantLng = participant.startLocation.longitude;

    // Construct query params
    const queryParams = new URLSearchParams({
      destinationLat,
      destinationLng,
      participantLat,
      participantLng,
    }).toString();

    // Open the map page in a new window
    window.open(
      `/trip/${id}/map/${participant.username}?${queryParams}`,
      "_blank"
    );
  };

  // End trip handler
  const handleEndTrip = async () => {
    if (!window.confirm("Are you sure you want to end this trip?")) return;
    setIsEnding(true);
    try {
      const res = await fetch(`http://localhost:3001/trip/${id}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert(error || "Failed to end trip.");
      } else {
        alert("Trip ended successfully.");
        navigate("/home");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md bg-red-50 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tripName}</h1>
            <div className="mt-2 flex items-center space-x-2">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 px-2 py-1 rounded-md text-sm flex items-center">
                <FiMapPin className="mr-1" />
                Admin: Ishansh Khare
              </span>
            </div>
          </div>

          {/* End Trip button */}
          {isAdmin && venueDetails && (
            <button
              onClick={handleEndTrip}
              disabled={isEnding}
              className={`
    ml-4 px-6 py-2 rounded-full text-sm font-semibold shadow-md transition duration-300 ease-in-out 
    ${
      isEnding
        ? "bg-red-400 cursor-not-allowed text-white"
        : "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white hover:scale-105"
    }
  `}
            >
              {isEnding ? "Ending Trip..." : "End Trip"}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!venueDetails ? (
          // Original participants grid
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Invited Participants */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiUsers className="mr-2 text-indigo-600" />
                  Invited Participants
                  <span className="ml-2 bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded-full">
                    {invitedParticipants.length}
                  </span>
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {invitedParticipants.length > 0 ? (
                  invitedParticipants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-large text-gray-900">
                          {participant.username}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <span className="truncate">{participant.email}</span>
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">Pending</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No invited participants</p>
                  </div>
                )}
              </div>
            </section>

            {/* Accepted Participants */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiCheckCircle className="mr-2 text-green-600" />
                  Accepted Participants
                  <span className="ml-2 bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                    {acceptedParticipants.length}
                  </span>
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {acceptedParticipants.length > 0 ? (
                  acceptedParticipants.map((participant) => (
                    <div
                      key={participant.userId}
                      className="flex items-center justify-between p-4 bg-green-50/30 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {participant.username}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <span className="truncate">{participant.email}</span>
                        </p>
                      </div>
                      <span className="text-sm text-green-600">Confirmed</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No accepted participants</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          // Venue details and merged members
          <div className="space-y-8">
            {/* Venue Details Section */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Selected Venue</h2>
              <div className="flex items-start gap-6">
                {venueDetails?.result?.photos?.length > 0 && (
                  <img
                    src={`https://maps.gomaps.pro/maps/api/place/photo?maxwidth=400&photoreference=${venueDetails.result.photos[0].photo_reference}&key=${YOUR_GOOGLE_API_KEY}`}
                    alt={venueDetails.result.name}
                    className="w-48 h-48 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    {venueDetails?.result?.name}
                  </h3>
                  {venueDetails?.result?.rating && (
                    <div className="flex items-center gap-2 mb-2">
                      <FiStar className="text-yellow-400" />
                      <span>{venueDetails.result.rating}</span>
                      <span>
                        ({venueDetails.result.user_ratings_total} reviews)
                      </span>
                    </div>
                  )}
                  {venueDetails?.result?.formatted_address && (
                    <div className="flex items-center gap-2 mb-2">
                      <FiMapPin />
                      <span>{venueDetails.result.formatted_address}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Merged Members Section */}

            <section className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiUsers className="mr-2 text-indigo-600" />
                  Members
                  <span className="ml-2 bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded-full">
                    {acceptedParticipants.length}
                  </span>
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {acceptedParticipants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="flex items-center justify-between p-4 bg-green-50/30 rounded-lg hover:bg-green-50 transition-colors"
                    onClick={() => handleMemberClick(participant)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {participant.username}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center mt-1">
                        <span className="truncate">{participant.email}</span>
                      </p>
                    </div>
                    <span className="text-sm text-green-600">Confirmed</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {isAdmin && !venueDetails && (
          <div className="mt-8">
            {/* Black stripe message (visible only on hover) */}
            {invitedParticipants.length > 0 && (
              <div className="absolute -top-10 left-0 bg-black text-white text-sm px-4 py-2 rounded-lg w-full text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                To enable this, there should be no one in the invited list.
              </div>
            )}

            {/* Button */}
            <button
              onClick={() => setIsSelectingVenue(!isSelectingVenue)}
              disabled={invitedParticipants.length > 0}
              className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl shadow-md transition-all flex items-center transform hover:scale-105 ${
                invitedParticipants.length > 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <FiMapPin className="mr-2" />
              {isSelectingVenue ? "Cancel Venue Selection" : "Select Venue"}
            </button>
            {isSelectingVenue && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form
                  onSubmit={handleSearch}
                  className="flex items-center space-x-4"
                >
                  <input
                    type="text"
                    placeholder="Search for restaurants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={15}>15 km</option>
                  </select>
                  <select
                    value={rating ? "true" : "false"}
                    onChange={(e) => setRating(e.target.value === "true")}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">4+ stars</option>
                    <option value="false">All Venues</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                  >
                    <FiSearch className="mr-2" />
                    Search
                  </button>
                </form>

                <div className="mt-6 space-y-4">
                  {venues.length > 0 ? (
                    venues.map((venue) => (
                      <div
                        key={venue.place_id}
                        className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        {venue.photos?.length > 0 && (
                          <img
                            src={`https://maps.gomaps.pro/maps/api/place/photo?maxwidth=400&photoreference=${venue.photos[0].photo_reference}&key=${YOUR_GOOGLE_API_KEY}`}
                            alt={venue.name}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        )}

                        <div className="ml-4 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">
                                {venue.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {venue.vicinity}
                              </p>
                            </div>
                            <button
                              onClick={() => handleVenueSelect(venue)}
                              className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                            >
                              Select
                            </button>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              {renderRating(venue.rating)}
                              <span className="ml-2">
                                ({venue.user_ratings_total} reviews)
                              </span>
                            </div>

                            {venue.opening_hours && (
                              <div className="flex items-center">
                                <FiClock className="mr-1" />
                                <span
                                  className={
                                    venue.opening_hours.open_now
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {venue.opening_hours.open_now
                                    ? "Open Now"
                                    : "Closed"}
                                </span>
                              </div>
                            )}
                          </div>

                          {venue.price_level && (
                            <div className="mt-2 text-sm text-gray-600">
                              Price Level: {"$".repeat(venue.price_level)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No venues found</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TripPage;
