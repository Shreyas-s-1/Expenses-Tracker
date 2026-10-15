const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();


async function connectDB() {
   const connectionString = process.env.MONGODB_URI || process.env.connectDB;
   if (!connectionString) {
      throw new Error('Set MONGODB_URI in tracker-backend/.env to connect MongoDB.');
   }
   await mongoose.connect(connectionString);
   console.log('MongoDB connected...');
} 

module.exports = connectDB;