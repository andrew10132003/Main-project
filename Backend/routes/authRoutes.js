const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  updateFavorites,
  getFavorites,
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const requireObjectBody = require("../middleware/requireObjectBody");

router.post("/register", requireObjectBody, registerUser);

router.post("/login", requireObjectBody, loginUser);
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, requireObjectBody, updateProfile);
router.get("/favorites", protect, allowRoles("adopter"), getFavorites);
router.post("/favorites", protect, allowRoles("adopter"), requireObjectBody, updateFavorites);

module.exports = router;