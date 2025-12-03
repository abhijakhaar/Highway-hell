import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("userId"); // or however you store the user id
        const token = localStorage.getItem("token");

        const response = await fetch(`http://localhost:3001/users/${userId}/get`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Button click handler based on user.tripJoined
  const handleButtonClick = () => {
    console.log(user);
    if (user && user.tripJoined) {
      // Navigate directly to the existing trip page
      navigate(`/trip/${user.tripJoined}`);
    } else {
      // Navigate to createTrip page if not part of a trip
      navigate("/createTrip");
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        {/* Uncomment and update the image source if needed
        <img
          src="/images/mapdeco.jpg"
          alt="Travel collage"
          className="w-full h-full object-cover opacity-50"
        /> */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
      </div>

      {/* Foreground Content */}
      <div className="relative flex flex-col items-center justify-center h-full z-10 px-4">
        <div className="max-w-4xl text-center space-y-8 animate-fade-in-up">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Smarter Trips,
              </span>
              <br />
              <span className="text-white">Seamless Journeys</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed">
              Your all-in-one travel companion that organizes, tracks, and
              optimizes every aspect of your journey. Never miss a beat while
              exploring the world.
            </p>
          </div>

          <button
            onClick={handleButtonClick}
            className="group relative inline-flex items-center justify-center px-8 py-4 md:px-12 md:py-5 overflow-hidden text-lg md:text-xl font-semibold text-white transition-all duration-300 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 hover:scale-105 hover:shadow-2xl"
          >
            {user && user.tripJoined ? "Go to Trip" : "Start Planning Now"}
            <svg
              className="ml-3 w-5 h-5 transition-all group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="absolute bottom-8 md:bottom-12 flex flex-wrap justify-center gap-6 text-gray-300">
          <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
            <span>Smart Itineraries</span>
          </div>
          <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span>Real-time Alerts</span>
          </div>
          <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
            <svg
              className="w-5 h-5 text-cyan-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                clipRule="evenodd"
              />
            </svg>
            <span>Collaboration Tools</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
