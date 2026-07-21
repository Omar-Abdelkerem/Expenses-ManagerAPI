const jwt = require("jsonwebtoken");
require("dotenv").config();
const { UnauthenticatedError } = require("../Error/index");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("Authorization header missing or malformed");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to the request object
    next();
  } catch (error) {
    throw new UnauthenticatedError("Invalid or expired token");
  }
};

module.exports = authMiddleware;
