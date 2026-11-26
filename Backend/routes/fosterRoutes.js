
const express = require("express");
const router = express.Router();

const {
  applyToFoster,
  getMyFosterApplications,
  getShelterFosterApplications,
  updateFosterApplicationStatus,
  requestFosterInformation,
  respondToFosterInformation,
} = require("../controllers/fosterController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const requireObjectBody = require("../middleware/requireObjectBody");

// Foster submits an application.
router.post("/apply", protect, allowRoles("foster"), requireObjectBody, applyToFoster);

// Foster views their own applications.
router.get("/my-applications", protect, allowRoles("foster"), getMyFosterApplications);

// Shelter views foster applications.
router.get(
  "/shelter-applications",
  protect,
  allowRoles("shelter"),
  getShelterFosterApplications
);

// Shelter approves or rejects a foster application.
router.patch(
  "/applications/:id/status",
  protect,
  allowRoles("shelter"),
  requireObjectBody,
  updateFosterApplicationStatus
);

// Shelter requests additional information.
router.post(
  "/applications/:id/information-requests",
  protect,
  allowRoles("shelter"),
  requireObjectBody,
  requestFosterInformation
);

// Foster responds to a question on their own application.
router.post(
  "/my-applications/:id/information-requests/:requestId/respond",
  protect,
  allowRoles("foster"),
  requireObjectBody,
  respondToFosterInformation
);

module.exports = router;
