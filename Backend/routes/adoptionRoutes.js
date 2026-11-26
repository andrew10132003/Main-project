
const express = require("express");

const router = express.Router();

const {
  createAdoption,
  getMyAdoptions,
  cancelAdoption,
  getShelterAdoptions,
  approveAdoption,
  rejectAdoption,
  requestAdditionalInformation,
  respondToInformationRequest,
  scheduleMeetAndGreet,
  respondToMeetAndGreet,
  respondToMeetAndGreetReschedule,
} = require("../controllers/adoptionController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const requireObjectBody = require("../middleware/requireObjectBody");

// =====================================================
// ADOPTER
// =====================================================

// Submit an adoption request
router.post("/", protect, allowRoles("adopter"), requireObjectBody, createAdoption);

// Get my adoption requests
router.get("/my", protect, allowRoles("adopter"), getMyAdoptions);

// Cancel an adoption request
router.patch("/:id/cancel", protect, allowRoles("adopter"), cancelAdoption);

// Respond to a shelter's information request
router.post(
  "/:id/information-requests/:requestId/respond",
  protect,
  allowRoles("adopter"),
  requireObjectBody,
  respondToInformationRequest
);

// Respond to a meet-and-greet proposal
router.patch(
  "/:id/meet-and-greet/respond",
  protect,
  allowRoles("adopter"),
  requireObjectBody,
  respondToMeetAndGreet
);

router.patch(
  "/:id/meet-and-greet/reschedule/respond",
  protect,
  allowRoles("shelter"),
  requireObjectBody,
  respondToMeetAndGreetReschedule
);

// =====================================================
// SHELTER
// =====================================================

// Get adoption requests for the logged-in shelter
router.get("/shelter", protect, allowRoles("shelter"), getShelterAdoptions);

// Approve an adoption request
router.patch(
  "/shelter/:id/approve",
  protect,
  allowRoles("shelter"),
  requireObjectBody,
  approveAdoption
);

// Reject an adoption request
router.patch(
  "/shelter/:id/reject",
  protect,
  allowRoles("shelter"),
  requireObjectBody,
  rejectAdoption
);

// Request additional information from an adopter
router.post(
  "/:id/information-requests",
  protect,
  allowRoles("shelter"),
  requireObjectBody,
  requestAdditionalInformation
);

// Propose or update a meet-and-greet
router.post(
  "/:id/meet-and-greet",
  protect,
  allowRoles("shelter"),
  requireObjectBody,
  scheduleMeetAndGreet
);

module.exports = router;
