const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./db/schema");
const { addStartingData } = require("./helper");
const apiRoutes = require("./api");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.use(apiRoutes);

async function startServer() {
  try {
    await connectDB();
    await addStartingData();
    app.listen(PORT, function () {
      console.log(`Server is running. Open http://localhost:${PORT} in your browser`);
    });
  } catch (error) {
    console.log("Could not connect to MongoDB:", error.message);
  }
}

startServer();
