const app = require("./app");
const DbConnect = require("./DB/connect");
const PORT = process.env.PORT || 5000;

// Connect to MongoDB

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
module.exports = { startServer };
