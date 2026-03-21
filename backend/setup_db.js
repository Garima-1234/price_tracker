const mongoose = require('mongoose');

async function testConnection() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buyhatke';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log("✅ Successfully connected to MongoDB at", uri);
    process.exit(0);
  } catch (err) {
    console.log("❌ Failed to connect to MongoDB at", uri);
    console.log("Error:", err.message);
    process.exit(1);
  }
}

testConnection();
