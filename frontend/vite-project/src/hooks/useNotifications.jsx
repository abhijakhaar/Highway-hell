import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
const navigate = useNavigate();
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`http://localhost:3001/trip/getNotifications`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch notifications");

        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const acceptTrip = async (notificationId, tripId) => {
  try {
    const response = await fetch(
      `http://localhost:3001/trip/acceptTrip/${notificationId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tripId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Show pop-up message if the user is already part of another trip
      alert(data.message);
      return;
    }
     navigate(`/trip/${tripId}`); // Only navigate if success

    // Update notifications if accepted successfully
    setNotifications((prev) =>
      prev.filter((notif) => notif._id !== notificationId)
    );
  } catch (error) {
    console.error("Error accepting trip:", error);
  }
};


  const denyTrip = async (notificationId, actionLink) => {
    try {
      const response = await fetch(
        `http://localhost:3001/trip/denyTrip/${notificationId}`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to deny trip");

      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
    } catch (error) {
      console.error("Error denying trip:", error);
    }
  };

  return { notifications, loading, acceptTrip, denyTrip };
};

export default useNotifications;
