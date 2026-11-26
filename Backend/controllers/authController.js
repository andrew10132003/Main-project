
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../service/emailService");
const { isEmail, isPhone, isText } = require("../utils/validation");

// Safely escape user-provided text before inserting into HTML
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

// ===============================
// Register User
// ===============================
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      address,
      role,
    } = req.body;

    if (
      !isText(name, { min: 2, max: 80 }) ||
      !isEmail(email) ||
      !isText(password, { min: 8, max: 72 }) ||
      Buffer.byteLength(password, "utf8") > 72 ||
      !isPhone(phone) ||
      !isText(address, { min: 5, max: 300 })
    ) {
      return res.status(400).json({
        message: "Enter a valid name, email, password, phone number, and address.",
      });
    }

    if (typeof confirmPassword !== "string" || confirmPassword !== password) {
      return res.status(400).json({
        message: "Password and confirmation must match.",
      });
    }
    if (role && !["adopter", "foster"].includes(role)) {
      return res.status(400).json({
        message: "Public registration is available only for adopters and fosters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      address,
      role: role === "foster" ? "foster" : "adopter",
    });

    // Welcome email
    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Pet Adoption Platform!",
        text: `Hello ${user.name},

Welcome to Pet Adoption Platform!

Your account has been successfully registered.

Thank you for joining us!

Pet Adoption Platform Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2e7d32;">Welcome to Pet Adoption Platform!</h2>
            <p>Hello ${escapeHtml(user.name)},</p>
            <p>Your account has been successfully registered.</p>
            <p>You can now explore available pets and begin your adoption journey.</p>
            <p>Thank you for joining us!</p>
            <p>Regards,<br /><strong>Pet Adoption Platform Team</strong></p>
          </div>
        `,
      });

      console.log("Welcome email sent successfully:", user.email);
    } catch (emailError) {
      console.error("Welcome email failed:", emailError.message);
    }

    return res.status(201).json({
      message: "Registration Successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

// ===============================
// Login User
// ===============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isEmail(email) || !isText(password, { min: 1, max: 72 })) {
      return res.status(400).json({
        message: "Enter a valid email and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid Email or Password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Login notification email
    try {
      await sendEmail({
        to: user.email,
        subject: "Successful Login - Pet Adoption Platform",
        text: `Hello ${user.name},

You have successfully logged in to your Pet Adoption Platform account.

If this wasn't you, please secure your account.

Regards,
Pet Adoption Platform Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2e7d32;">Successful Login</h2>
            <p>Hello ${escapeHtml(user.name)},</p>
            <p>You have successfully logged in to your Pet Adoption Platform account.</p>
            <p>If this wasn't you, please secure your account.</p>
            <p>Regards,<br /><strong>Pet Adoption Platform Team</strong></p>
          </div>
        `,
      });

      console.log("Login notification email sent:", user.email);
    } catch (emailError) {
      console.error("Login notification email failed:", emailError.message);
    }

    return res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Failed to load profile." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    if (
      !isText(name, { min: 2, max: 80 }) ||
      !isEmail(email) ||
      !isPhone(phone) ||
      !isText(address, { min: 5, max: 300 })
    ) {
      return res.status(400).json({
        message: "Enter a valid name, email, phone number, and address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailOwner = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.id },
    });

    if (emailOwner) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.name = name.trim();
    user.email = normalizedEmail;
    user.phone = phone.trim();
    user.address = address.trim();
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile." });
  }
};

const updateFavorites = async (req, res) => {
  try {
    const { petId } = req.body;
    const mongoose = require("mongoose");

    if (!mongoose.isValidObjectId(petId)) {
      return res.status(400).json({ message: "Valid petId is required." });
    }

    const Pet = require("../models/Pet");
    const pet = await Pet.findById(petId);

    if (!pet) {
      return res.status(404).json({ message: "Pet not found." });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const alreadyFavorite = user.favoritePets.some(
      (favoriteId) => favoriteId.toString() === petId
    );

    user.favoritePets = alreadyFavorite
      ? user.favoritePets.filter(
          (favoriteId) => favoriteId.toString() !== petId
        )
      : [...user.favoritePets, petId];

    await user.save();

    return res.status(200).json({
      favoritePets: user.favoritePets,
      isFavorite: !alreadyFavorite,
    });
  } catch (error) {
    console.error("Update favorites error:", error);
    return res.status(500).json({ message: "Failed to update favorites." });
  }
};

const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("favoritePets");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ favorites: user.favoritePets });
  } catch (error) {
    console.error("Get favorites error:", error);
    return res.status(500).json({ message: "Failed to load favorites." });
  }
};

// ===============================
// Export Controllers
// ===============================
module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  updateFavorites,
  getFavorites,
};
