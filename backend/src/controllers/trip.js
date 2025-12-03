const axios = require("axios");
const Trip = require("../models/Trip");
const User = require("../models/User");
require("dotenv").config();
const API_KEY = process.env.API_KEY;

const createTrip = async (req, res) => {
  console.log("ish");
  try {
    const { tripName, description, startLocation, participants } = req.body;
    console.log(participants.length);
    // Check if startLocation is provided and destructure safely
    if (!startLocation || !startLocation.latitude || !startLocation.longitude) {
      return res.status(400).json({
        message: "startLocation with latitude and longitude is required",
      });
    }

    const { latitude, longitude } = startLocation;
    const userId = req.user.id; // Extract user ID from the token (middleware)

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const adminName = user.username;
    // Create the participants array with the logged-in user as admin
    const tripParticipants = participants
      .filter((participant) => participant.userId !== undefined) // Ensure userId is defined
      .map((participant, index) => ({
        userId: participant.userId,
        isAdmin: index === 0, // Ensure only the first participant (admin) has isAdmin set to true
        startLocation: {
          latitude: participant.startLocation?.latitude ?? latitude,
          longitude: participant.startLocation?.longitude ?? longitude,
        },
        acceptedTripInvite: index === 0, // Admin automatically accepts the trip
      }));

    console.log(tripParticipants);

    // Create the trip with the provided details
    const newTrip = new Trip({
      tripName,
      description, // Include description
      participants: tripParticipants, // Include all participants
    });

    const savedTrip = await newTrip.save();
    const tripId = savedTrip._id; // Get the generated trip ID

    // Update the creator's tripJoined field
    user.tripJoined = tripId;
    await user.save();

    await sendTripRequest(
      adminName,
      tripName,
      tripParticipants.slice(1),
      tripId
    );
    res.status(201).json({
      message: "Trip created successfully",
      trip: newTrip,
      tripId: tripId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating trip", error: error.message });
  }
};

// const acceptTrip = async (req, res) => {
//   try {
//     const { tripId, startLocation } = req.body;
//     const userId = req.user.id;
//     const { latitude, longitude } = startLocation;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const trip = await Trip.findById(tripId);
//     if (!trip) {
//       return res.status(404).json({ message: "Trip not found" });
//     }

//     const isAlreadyParticipant = trip.participants.some(
//       (participant) => participant.userId.toString() === userId
//     );

//     if (isAlreadyParticipant) {
//       return res.status(400).json({ message: "User is already a participant in this trip" });
//     }

//     const newParticipant = {
//       userId: userId,
//       isAdmin: false,
//       startLocation: {
//         latitude: latitude,
//         longitude: longitude,
//       },
//     };

//     trip.participants.push(newParticipant); // Add the participant to the trip
//     await trip.save(); // Save the updated trip

//     res.status(200).json({ message: "Trip invite accepted successfully", trip });
//   } catch (error) {
//     res.status(500).json({ message: "Error accepting trip invite", error: error.message });
//   }
// };

const fetchNearbyVenues = async (req, res) => {
  try {
    const { latitude, longitude } = req.midpoint;
    const { keywords, radius, filterByRating } = req.body; // Extract search parameters
    const searchQuery = keywords || ""; // Default to an empty string if no keyword provided

    const url = new URL(
      "https://maps.gomaps.pro/maps/api/place/nearbysearch/json"
    );
    url.searchParams.append("location", `${latitude},${longitude}`);
    url.searchParams.append("radius", radius || 15000); // Default radius to 15000 meters
    url.searchParams.append("keyword", searchQuery);
    url.searchParams.append("key", API_KEY); // Replace with actual API key

    console.log("Request URL:", url.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    let places = data.results;

    if (filterByRating) {
      places = places.filter((place) => place.rating && place.rating >= 4);
    }

    res.status(200).json({
      message: "Nearby venues fetched successfully",
      venues: places,
    });
  } catch (error) {
    console.error("Error fetching venues:", error);
    res
      .status(500)
      .json({ message: "Error fetching venues", error: error.message });
  }
};

const getVenueDetails = async (req, res) => {
  try {
    console.log(81);
    const { tripId } = req.params;

    // 1. Get trip from DB
    const trip = await Trip.findById(tripId);
    console.log(82);
    if (!trip?.placeId) {
      return res.status(404).json({ message: "Venue not selected yet" });
    }
    console.log(83);

    // 2. Fetch Place Details using fetch
    const response = await fetch(
      `https://maps.gomaps.pro/maps/api/place/details/json?place_id=${trip.placeId}&key=${process.env.API_KEY}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );
    console.log(84434);

    // Parse JSON response
    if (!response.ok) {
      throw new Error(`Failed to fetch place details: ${response.statusText}`);
    }

    const placeDetails = await response.json();
    console.log(placeDetails);

    res.status(200).json({ placeDetails });
  } catch (error) {
    console.error("Error fetching venue details:", error);
    res.status(500).json({
      message: "Error fetching venue details",
      error: error.message,
    });
  }
};


const saveDestination = async (req, res) => {
  try {
    const { place_id, tripId } = req.body;

    // Check for required fields
    if (!place_id || !tripId) {
      return res
        .status(400)
        .json({ message: "Missing required fields: place_id or tripId." });
    }

    // Validate the trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    // Save the placeId to the trip
    trip.placeId = place_id;
    await trip.save();

    res.status(201).json({
      message: "place_id successfully saved to the trip.",
      trip,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving place_id to the trip.",
      error: error.message,
    });
  }
};

// Ensure correct path to the User model

const searchUsers = async (req, res) => {
  try {
    const { username } = req.query;

    let users;
    if (username) {
      users = await User.find({ username: new RegExp(username, "i") });
    }
    console.log(users);
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const searchusers = async (req, res) => {
  try {
    const { username } = req.query;

    // Get the current user from middleware (assuming verifyToken sets req.user)
    const currentUser = await User.findById(req.user.id).populate("friends");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let users = [];

    if (username) {
      // Case-insensitive regex match for username among the user's friends
      users = currentUser.friends.filter((friend) =>
        new RegExp(username, "i").test(friend.username)
      );
    }

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const sendTripRequest = async (adminName, tripName, participants, tripId) => {
  try {
    const notifications = participants.map((participant) => ({
      userId: participant.userId,
      title: "New Trip Request",
      message: `${adminName} has invited you to the trip "${tripName}".`,
      actionLink: `/accept-or-deny/${tripId}`, // Define route for action handling
    }));

    // Mock logic to send or store notifications
    for (const notification of notifications.slice(0)) {
      // Skip the first participant
      await User.findByIdAndUpdate(notification.userId, {
        $push: { notifications: notification },
      });
      io.to(notification.userId).emit("notificationReceived", notification);
    }
  } catch (error) {
    console.error("Error sending trip requests:", error.message);
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available from authentication middleware
    const user = await User.findById(userId).select("notifications");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const acceptTrip = async (req, res) => {
  try {
    // Find the user who is trying to accept the invite
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Retrieve the tripId from the request body
    const { tripId } = req.body;
    if (!tripId)
      return res.status(400).json({ message: "Trip ID is required" });

    // Check if the user is already part of another trip
    if (user.tripJoined && user.tripJoined.toString() !== tripId) {
      // Optionally, remove the user from the participants array of the incoming trip.
      const trip = await Trip.findById(tripId);
      if (trip) {
        // Filter out the user from the participants array
        trip.participants = trip.participants.filter(
          (p) => p.userId.toString() !== req.user.id
        );
        await trip.save();
      }

      // Remove the notification for the specific trip invite
      user.notifications = user.notifications.filter(
        (notif) => notif._id.toString() !== req.params.id
      );
      await user.save();

      return res.status(400).json({
        message: "You are already part of another trip",
      });
    }

    // Fetch the trip document using the tripId
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // Find the participant in the trip's participants list
    const participant = trip.participants.find(
      (p) => p.userId.toString() === req.user.id
    );
    if (!participant)
      return res.status(404).json({ message: "User is not part of this trip" });

    // Update the participant's status to accepted
    participant.acceptedTripInvite = true;

    // Mark that this user is now part of the trip by updating tripJoined field
    user.tripJoined = tripId;

    // Remove the notification for the trip invite
    user.notifications = user.notifications.filter(
      (notif) => notif._id.toString() !== req.params.id
    );

    // Save both user and trip documents
    await user.save();
    await trip.save();

    res.json({ message: "Notification accepted and removed" });
  } catch (error) {
    console.error("Error accepting trip:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



const denyTrip = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const notification = user.notifications.find(
      (notif) => notif._id.toString() === req.params.id
    );
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });

    const tripId = notification.actionLink.split("/").pop();
    if (tripId) {
      const trip = await Trip.findById(tripId);
      if (trip) {
        trip.participants = trip.participants.filter(
          (participant) => participant.userId.toString() !== req.user.id
        );
        await trip.save();
      }
    }

    user.notifications = user.notifications.filter(
      (notif) => notif._id.toString() !== req.params.id
    );
    await user.save();

    res.json({ message: "Notification denied and removed from trip" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const saveUserLocation = async (req, res) => {
  try {
    console.log(3286);
    const { tripId, latitude, longitude } = req.body;
    const userId = req.user.id; // Get user ID from authentication

    // Find the trip by ID
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // Find the participant in the trip and update their location
    const participant = trip.participants.find(
      (p) => p.userId.toString() === userId
    );
    if (!participant)
      return res.status(404).json({ message: "User not part of this trip" });

    // const  l1 = "69.69";
    // const  l2 = "96.96";

    // console.log(l1);
    participant.startLocation = { latitude: latitude, longitude: longitude };

    await trip.save(); // Save the updated trip

    res.status(200).json({ message: "User location updated in trip", trip });
  } catch (error) {
    console.error("Error saving location:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const fetchTripParticipants = async (req, res) => {
  try {
    console.log(69);
    const { id } = req.params;

    // Fetch trip with participants
    const trip = await Trip.findById(id).populate(
      "participants.userId",
      "name email"
    );

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Fetch usernames separately for all participants
    const participantIds = trip.participants.map((p) => p.userId._id);
    const users = await User.find({ _id: { $in: participantIds } }).select(
      "username"
    );

    // Convert users array to a map for easy lookup
    const userMap = new Map(
      users.map((user) => [user._id.toString(), user.username])
    );

    // Format participants with username
   const participants = trip.participants.map((participant) => ({
     userId: participant.userId._id,
     name: participant.userId.name,
     email: participant.userId.email,
     username: userMap.get(participant.userId._id.toString()) || "", // Get username
     acceptedTripInvite: participant.acceptedTripInvite,
     startLocation: participant.startLocation, // Added startLocation
   }));


    res.status(200).json({ tripName: trip.tripName, participants });
  } catch (error) {
    res.status(500).json({ message: "Error fetching participants", error });
  }
};


const endTrip = async (req, res) => {
  const { tripId } = req.params;

  try {
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Get all participant userIds
    const participantIds = trip.participants.map((p) => p.userId);

    // Update all participants
    await User.updateMany(
      { _id: { $in: participantIds } },
      {
        $set: { tripJoined: null },
        $push: { previousTrips: trip._id },
      }
    );

    res
      .status(200)
      .json({ message: "Trip ended successfully for all participants." });
  } catch (err) {
    console.error("Error ending trip:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// const clearTripAndUserData = async (req, res) => {
//   try {
//     // Delete all trips
//     await Trip.deleteMany({});

//     // Delete all users
//     await User.deleteMany({});

//     res
//       .status(200)
//       .json({ message: "All trip and user data has been cleared." });
//   } catch (error) {
//     console.error("Error clearing trip and user data:", error);
//     res.status(500).json({
//       message: "Error clearing trip and user data",
//       error: error.message,
//     });
//   }
// };


module.exports = {
  createTrip,
  acceptTrip,
  denyTrip,
  fetchNearbyVenues,
  saveDestination,
  searchUsers,
  searchusers,
  sendTripRequest,
  getNotifications,
  saveUserLocation,
  fetchTripParticipants,
  getVenueDetails,
  endTrip,
  // clearTripAndUserData,
};
