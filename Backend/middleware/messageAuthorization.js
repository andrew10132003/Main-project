const canMessageRoles = (senderRole, recipientRole) =>
  (["adopter", "foster"].includes(senderRole) && recipientRole === "shelter") ||
  (senderRole === "shelter" && ["adopter", "foster"].includes(recipientRole));

module.exports = { canMessageRoles };
