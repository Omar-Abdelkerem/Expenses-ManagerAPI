const express = require("express");
const cors = require("cors");
require("express-async-errors");
const expensesRoutes = require("./Routes/expenses");
const authRoutes = require("./Routes/auth");
const ProfileRoutes = require("./Routes/profile");
const CategoryRoutes = require("./Routes/category");
const authMiddleware = require("./MiddleWare/auth");
const helmet = require("helmet");
const xss = require("xss-clean");

const app = express();

const ErrorHandlerMiddleware = require("./MiddleWare/error-handler");
const notFoundMiddleware = require("./MiddleWare/not-found");

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(xss());
// Routes
app.get("/", (req, res) => {
  res.status(200).send("API is running");
});
app.use("/expenses", authMiddleware, expensesRoutes);
app.use("/auth", authRoutes);
app.use("/profile", authMiddleware, ProfileRoutes);
app.use("/category", authMiddleware, CategoryRoutes);

app.use(notFoundMiddleware);
app.use(ErrorHandlerMiddleware);

module.exports = app;
