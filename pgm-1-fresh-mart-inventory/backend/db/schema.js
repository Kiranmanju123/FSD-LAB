const mongoose = require("mongoose");

const MONGO_URL = "mongodb://127.0.0.1:27017/freshmart";

async function connectDB() {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB ->", MONGO_URL);
}

const storeSchema = new mongoose.Schema(
  {
    storeName: { type: String, required: true },
    categories: { type: [String], default: [] },
    products: [
      {
        name: String,
        category: String,
        price: Number,
        stock: Number
      }
    ]
  },
  { timestamps: true }
);

const Store = mongoose.model("Store", storeSchema);

module.exports = { connectDB, Store };
