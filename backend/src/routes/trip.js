const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth");
const { calculateMidpoint } = require("../middlewares/trip");
const {
  createTrip,
  acceptTrip,
  fetchNearbyVenues,
  saveDestination,
  searchUsers,
  searchusers,
  sendTripRequest,
  getNotifications,
  denyTrip,
  saveUserLocation,
  fetchTripParticipants,
  getVenueDetails,
  endTrip,
} = require("../controllers/trip");
router.post("/createTrip", verifyToken, createTrip);
router.post("/decideVenue", verifyToken, calculateMidpoint, fetchNearbyVenues);
router.post("/selectVenue", verifyToken, saveDestination);
router.get("/getVenueDetails/:tripId", verifyToken, getVenueDetails);
router.get("/search-users", verifyToken, searchUsers);
router.get("/searchusers", verifyToken, searchusers);
router.post("/sendTripRequest", verifyToken, sendTripRequest);
router.get("/getNotifications", verifyToken, getNotifications);
router.post("/acceptTrip/:id/", verifyToken, acceptTrip);
router.post("/denyTrip/:id/", verifyToken, denyTrip);
router.post("/saveUserLocation", verifyToken, saveUserLocation);
router.get("/:id/participants", verifyToken, fetchTripParticipants);
router.post("/:tripId/end", verifyToken, endTrip);
// router.delete("/clear-data", clearTripAndUserData);


module.exports = router;
