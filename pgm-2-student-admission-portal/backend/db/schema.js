const mongoose = require("mongoose");

const MONGO_URL = "mongodb://127.0.0.1:27017/university";

async function connectDB() {
  await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
  console.log("Connected to MongoDB ->", MONGO_URL);
}

const admissionSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    nameLength: Number,
    departmentCode: String,
    isPalindrome: Boolean
  },
  { timestamps: true }
);

const Admission = mongoose.model("Admission", admissionSchema);

module.exports = { connectDB, Admission };
