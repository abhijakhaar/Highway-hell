import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Importing Auth Context

const CreateTripPage = () => {
  const { currentUser } = useAuth(); // Get current user from Context API
  const navigate = useNavigate();

  const [tripName, setTripName] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [adminLocation, setAdminLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch admin's current location
  const getAdminLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setAdminLocation({ latitude, longitude });
        },
        (error) => {
          console.error("Error fetching location:", error);
          alert("Location access is required to create a trip.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  useEffect(() => {
    getAdminLocation(); // Get location on component mount
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (searchTerm.trim() === "") {
        setSearchResults([]);
        return;
      }
      try {
        const response = await fetch(
          `http://localhost:3001/trip/searchusers?username=${searchTerm}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const delayDebounceFn = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleInvite = (user) => {
    if (!invitedMembers.some((member) => member._id === user._id)) {
      setInvitedMembers([...invitedMembers, user]);
    }
  };

  const handleRemove = (id) => {
    setInvitedMembers(invitedMembers.filter((member) => member._id !== id));
  };

  const handleCreateTrip = async () => {
    if (!tripName || !description || !adminLocation) {
      alert("Please provide all required details.");
      return;
    }

    setLoading(true);
    try {
      const participants = [
        {
          userId: currentUser?._id, // Admin's user ID from context
          isAdmin: true,
          startLocation: adminLocation, // Use fetched location
          acceptedTripInvite: true,
        },
        ...invitedMembers.map((member) => ({
          userId: member._id,
        })),
      ];
      console.log(participants);
      const response = await fetch("http://localhost:3001/trip/createTrip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          tripName,
          description,
          startLocation: adminLocation,
          participants,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Trip created successfully!");
        navigate(`/trip/${data.tripId}`);
      } else {
        console.error("Error creating trip:", await response.text());
        alert("Failed to create trip.");
      }
    } catch (error) {
      console.error("Error saving trip:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-600">
          <h2 className="text-3xl font-bold text-white text-center">
            Create New Trip
          </h2>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Trip Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Trip Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-3 px-4 
                        transition duration-150 ease-in-out"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="Enter trip name..."
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              rows="3"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                        focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-3 px-4 
                        transition duration-150 ease-in-out"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your trip..."
            />
          </div>

          {/* Location Status */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              {adminLocation ? (
                <>
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Location captured successfully!</span>
                </>
              ) : (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Fetching your location...</span>
                </>
              )}
            </div>
          </div>

          {/* Member Search */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Invite Members
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm 
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-3 px-4 
                          transition duration-150 ease-in-out"
                placeholder="Search by username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-2 border-b">
                  <p className="text-sm font-medium text-gray-600">
                    Search Results
                  </p>
                </div>
                <ul className="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                  {searchResults
                    .filter((member) => member._id !== currentUser._id)
                    .map((user) => (
                      <li
                        key={user._id}
                        className="flex items-center justify-between p-3 hover:bg-blue-50 
                                  transition duration-150 ease-in-out"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              user.profileImage ||
                              "./images/default-profile.jpg"
                            }
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />

                          <span className="text-gray-700 font-medium">
                            {user.username}
                          </span>
                        </div>
                        <button
                          onClick={() => handleInvite(user)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-md 
                                    hover:bg-blue-700 focus:outline-none focus:ring-2 
                                    focus:ring-blue-500 focus:ring-offset-2 transition 
                                    duration-150 ease-in-out text-sm"
                        >
                          Invite
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Invited Members List */}
            {invitedMembers.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-2 border-b">
                  <p className="text-sm font-medium text-gray-600">
                    Invited Members ({invitedMembers.length})
                  </p>
                </div>
                <ul className="divide-y divide-gray-200">
                  {invitedMembers.map((member) => (
                    <li
                      key={member._id}
                      className="flex items-center justify-between p-3 hover:bg-red-50 
                                transition duration-150 ease-in-out"
                    >
                      <div className="flex items-center space-x-3">
                        
                          <img
                            src={
                              member.profileImage ||
                              "./images/default-profile.jpg"
                            }
                            alt={member.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        <span className="text-gray-700 font-medium">
                          {member.username}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemove(member._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md 
                                  hover:bg-red-700 focus:outline-none focus:ring-2 
                                  focus:ring-red-500 focus:ring-offset-2 transition 
                                  duration-150 ease-in-out text-sm"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Create Trip Button */}
          <button
            onClick={handleCreateTrip}
            disabled={loading || !adminLocation}
            className={`w-full py-3 px-4 rounded-md font-medium text-white 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 transition 
                      duration-150 ease-in-out ${
                        loading || !adminLocation
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Creating Trip...</span>
              </div>
            ) : (
              "Create Trip"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTripPage;
