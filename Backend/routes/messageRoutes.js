const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const Pet = require("../models/Pet");
const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const { canMessageRoles } = require("../middleware/messageAuthorization");
const requireObjectBody = require("../middleware/requireObjectBody");

const router = express.Router();

router.get(
  "/contacts",
  protect,
  allowRoles("adopter", "shelter", "foster"),
  async (req, res) => {
    try {
      if (req.user.role !== "shelter") {
        const contacts = await User.find({ role: "shelter" })
          .select("name email role")
          .sort({ name: 1 });
        return res.status(200).json({ contacts });
      }

      const messages = await Message.find({
        $or: [
          { senderId: req.user.id },
          { recipientId: req.user.id },
        ],
      }).select("senderId recipientId");

      const contactIds = new Set();
      for (const message of messages) {
        const otherUserId =
          String(message.senderId) === String(req.user.id)
            ? message.recipientId
            : message.senderId;
        contactIds.add(String(otherUserId));
      }

      const contacts = await User.find({
        _id: { $in: Array.from(contactIds) },
        role: { $in: ["adopter", "foster"] },
      })
        .select("name email role")
        .sort({ name: 1 });

      return res.status(200).json({ contacts });
    } catch (error) {
      console.error("Get message contacts error:", error);
      return res.status(500).json({ message: "Failed to fetch message contacts." });
    }
  }
);

router.post(
  "/",
  protect,
  allowRoles("adopter", "shelter", "foster"),
  requireObjectBody,
  async (req, res) => {
  try {
    const { recipientId, petId, subject, body } = req.body;

    if (!mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ message: "Valid recipientId is required." });
    }

    if (petId && !mongoose.isValidObjectId(petId)) {
      return res.status(400).json({ message: "Invalid petId." });
    }

    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ message: "Message body is required." });
    }

    if (body.trim().length > 2000) {
      return res.status(400).json({ message: "Messages must be 2000 characters or fewer." });
    }

    if (
      subject !== undefined &&
      (typeof subject !== "string" || subject.trim().length > 120)
    ) {
      return res.status(400).json({ message: "Subject must be 120 characters or fewer." });
    }

    if (String(req.user.id) === String(recipientId)) {
      return res.status(400).json({ message: "You cannot message yourself." });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(req.user.id).select("role"),
      User.findById(recipientId).select("role"),
    ]);

    if (!sender || !recipient) {
      return res.status(404).json({ message: "Sender or recipient was not found." });
    }

    if (!canMessageRoles(sender.role, recipient.role)) {
      return res.status(403).json({
        message: "Messaging is limited to adopter/foster and shelter conversations.",
      });
    }

    if (petId) {
      const pet = await Pet.findById(petId).select("shelterId");

      if (!pet) {
        return res.status(404).json({ message: "Pet not found." });
      }

      if (String(pet.shelterId) !== String(recipientId)) {
        return res.status(403).json({
          message: "Pet enquiries must be sent to that pet's shelter.",
        });
      }
    }

    const message = await Message.create({
      senderId: req.user.id,
      recipientId,
      petId: petId || null,
      subject: subject?.trim() || "Pet enquiry",
      body: body.trim(),
    });

    await message.populate("senderId", "name email");
    await message.populate("recipientId", "name email");

    return res.status(201).json({ message: "Message sent.", data: message });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ message: "Failed to send message." });
  }
});

router.get("/", protect, allowRoles("adopter", "shelter", "foster"), async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id },
        { recipientId: req.user.id },
      ],
    })
      .populate("senderId", "name email role")
      .populate("recipientId", "name email role")
      .populate("petId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ message: "Failed to fetch messages." });
  }
});

module.exports = router;
