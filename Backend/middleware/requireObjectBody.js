const { isObjectBody } = require("../utils/validation");

const requireObjectBody = (req, res, next) => {
  if (!isObjectBody(req.body)) {
    return res.status(400).json({
      message: "Request body must be a JSON object.",
    });
  }

  next();
};

module.exports = requireObjectBody;
