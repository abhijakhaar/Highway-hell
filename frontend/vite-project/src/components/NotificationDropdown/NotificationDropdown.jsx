import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import useNotifications from "../../hooks/useNotifications";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:3001"; // "https://talk-a-tive.herokuapp.com"; -> After deployment
var socket, selectedChatCompare;


const NotificationDropdown = () => {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { notifications, loading, acceptTrip, denyTrip } = useNotifications();
  const [activeTab, setActiveTab] = useState("Trip Invites");
  const [socketNotifs, setSocketNotifs] = useState([]);


  const navigate = useNavigate();

  const handleToggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);


  useEffect(()=>{
    console.log("chhaddi");
    socket = io(ENDPOINT);
    const userId = localStorage.getItem("userId");
    console.log("uski baap ka louda " , userId);

  // Emit the join event to subscribe to a room with the user's ID.
  socket.emit("join", { userId });
    socket.on("notificationReceived", (notification) => {
    console.log("Received notification:", notification);
    setSocketNotifs((prev) => [notification, ...prev]);
  });
  },[]);
  // Trip logic (unchanged)
  const handleAccept = async (notificationId, tripId) => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("User's Location:", latitude, longitude);

        // Send the location to the backend if needed
        await fetch(`http://localhost:3001/trip/saveUserLocation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            tripId,
            latitude,
            longitude,
          }),
        });

        // Accept the trip and then redirect 
        await acceptTrip(notificationId, tripId);
        // Check if the user is already part of a trip
         
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );
  };

  // Friend request logic

  // Accept a friend invite by calling the friend acceptance endpoint.
  // It sends the notificationId and friendId to the backend and then navigates to the friend's profile.
  const handleAcceptFriend = async (notificationId, friendId) => {
    try {
      const response = await fetch(`http://localhost:3001/users/accept-friend-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          notificationId,
          friendId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to accept friend request");
      }
      // Optionally update notifications state here if needed.
      navigate(`/profile/${friendId}`);
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  // Deny a friend invite by simply removing the notification.
  const handleDenyFriend = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:3001/users/deny-friend-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          notificationId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to deny friend request");
      }
      // Optionally update notifications state here if needed.
    } catch (error) {
      console.error("Error denying friend request:", error);
    }
  };

  // Render notifications differently based on the active tab.
  const renderNotifications = () => {
    const combinedNotifications = [...socketNotifs, ...notifications];
    if (activeTab === "Trip Invites") {
      const tripNotifications = combinedNotifications.filter((notif) =>
        notif.title.toLowerCase().includes("new trip request")
      );

      if (tripNotifications.length === 0) {
        return (
          <div className="bg-white p-4 rounded-md shadow-md mb-3">
            <p className="text-gray-800">No new notifications</p>
          </div>
        );
      }

      return tripNotifications.map((notification) => {
        const [tripName, adminName] = notification.message.split("|");
        const tripId = notification.actionLink.split("/").pop();
        const createdAt = notification.timestamp;
        return (
          <div
            key={notification._id}
            className="bg-white p-4 rounded-md shadow-md mb-3"
          >
            <div>
              <p className="font-semibold text-gray-800">
                Trip: {tripName}
              </p>
              <p className="text-gray-600">Admin: {adminName}</p>
              <small className="text-gray-500">
                Created on:{" "}
                {createdAt
                  ? new Date(createdAt).toLocaleString()
                  : "No Date Available"}
              </small>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="bg-green-500 text-white text-sm px-4 py-1 rounded-full hover:opacity-90"
                onClick={() => handleAccept(notification._id, tripId)}
              >
                Accept
              </button>
              <button
                className="bg-red-500 text-white text-sm px-4 py-1 rounded-full hover:opacity-90"
                onClick={() =>
                  denyTrip(notification._id, notification.actionLink)
                }
              >
                Deny
              </button>
            </div>
          </div>
        );
      });
    } else if (activeTab === "Friend Requests") {
      const friendNotifications = notifications.filter(
        (notif) =>
          !notif.title.toLowerCase().includes("new trip request")
      );

      if (friendNotifications.length === 0) {
        return (
          <div className="bg-white p-4 rounded-md shadow-md mb-3">
            <p className="text-gray-800">No new notifications</p>
          </div>
        );
      }

      return friendNotifications.map((notification) => {
        // Assume the notification.actionLink contains the friend's profile link,
        // and the friend's ID is at the end (e.g. "/profile/<friendId>")
        const friendId = notification.actionLink.split("/").pop();
        const createdAt = notification.timestamp;
        return (
          <div
            key={notification._id}
            className="bg-white p-4 rounded-md shadow-md mb-3"
          >
            <div>
              <p className="font-semibold text-gray-800">
                Friend Request
              </p>
              <p className="text-gray-600">{notification.message}</p>
              <small className="text-gray-500">
                Received on:{" "}
                {createdAt
                  ? new Date(createdAt).toLocaleString()
                  : "No Date Available"}
              </small>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="bg-green-500 text-white text-sm px-4 py-1 rounded-full hover:opacity-90"
                onClick={() =>
                  handleAcceptFriend(notification._id, friendId)
                }
              >
                Accept
              </button>
              <button
                className="bg-red-500 text-white text-sm px-4 py-1 rounded-full hover:opacity-90"
                onClick={() => handleDenyFriend(notification._id)}
              >
                Deny
              </button>
            </div>
          </div>
        );
      });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleDropdown}
        className="p-2 rounded-md hover:bg-gray-100"
      >
        <Bell size={28} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl rounded-xl z-50">
          <div className="flex items-center px-4 py-3 space-x-6">
            <button
              className={`text-sm font-medium ${
                activeTab === "Trip Invites"
                  ? "border-b-2 border-white"
                  : "text-gray-300"
              }`}
              onClick={() => setActiveTab("Trip Invites")}
            >
              Trip Invites
            </button>
            <button
              className={`text-sm font-medium ${
                activeTab === "Friend Requests"
                  ? "border-b-2 border-white"
                  : "text-gray-300"
              }`}
              onClick={() => setActiveTab("Friend Requests")}
            >
              Friend Requests
            </button>
          </div>

          <div className="bg-white p-4 rounded-b-xl text-gray-800">
            {loading ? <p>Loading...</p> : renderNotifications()}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
