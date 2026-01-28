import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client;

const connectDB = async () => {
  try {
    if (!client) {
      client = new MongoClient(process.env.DB_URL);
      await client.connect();
      console.log("✅ Connected to MongoDB");
    }
    return client.db("HospCare");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    throw error;
  }
};

export default connectDB;
