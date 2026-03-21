const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  console.log("Testing Atlas connection to:", uri);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log("✅ Successfully connected to MongoDB Atlas!");
    process.exit(0);
  } catch (err) {
    console.log("❌ Failed to connect to MongoDB Atlas");
    console.log("Error:", err.message);
    process.exit(1);
  }
}

testConnection();
