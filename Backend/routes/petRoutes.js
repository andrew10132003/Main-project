
const express = require("express");
const router = express.Router();

const {
  getPets,
  getPetById,
  createPet,
  updatePet,
  deletePet,
} = require("../controllers/petController");

const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const requireObjectBody = require("../middleware/requireObjectBody");

// Public pet browsing
router.get("/", getPets);
router.get("/:id", getPetById);

// Create a pet with file uploads
router.post(
  "/",
  protect,
  allowRoles("admin", "shelter"),
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "videos", maxCount: 3 },
    { name: "medicalReport", maxCount: 1 },
  ]),
  requireObjectBody,
  createPet
);

// Update a pet with file uploads
router.put(
  "/:id",
  protect,
  allowRoles("admin", "shelter"),
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "videos", maxCount: 3 },
    { name: "medicalReport", maxCount: 1 },
  ]),
  requireObjectBody,
  updatePet
);

// Delete a pet
router.delete("/:id", protect, allowRoles("admin", "shelter"), deletePet);

module.exports = router;
