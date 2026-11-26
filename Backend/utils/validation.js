const isObjectBody = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isText = (value, { min = 1, max = 500 } = {}) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.trim().length <= max;

const isEmail = (value) =>
  typeof value === "string" &&
  value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isPhone = (value) => {
  if (typeof value !== "string" || !/^\+?[\d\s()-]+$/.test(value.trim())) {
    return false;
  }

  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
};

module.exports = {
  isObjectBody,
  isText,
  isEmail,
  isPhone,
};
