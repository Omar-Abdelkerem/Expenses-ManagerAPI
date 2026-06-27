const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
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
app.use("/expenses", authMiddleware, expensesRoutes);
app.use("/auth", authRoutes);
app.use("/profile", authMiddleware, ProfileRoutes);
app.use("/category", authMiddleware, CategoryRoutes);
// Connect to MongoDB
const DbConnect = require("./DB/connect");

app.use(notFoundMiddleware);
app.use(ErrorHandlerMiddleware);
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await DbConnect();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log("http://localhost:" + PORT);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
