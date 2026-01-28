// backend/controller/Medical.controller.js
import connectDB from "../utils/lib.js";

export const getMedicineList = async (req, res) => {
  try {
    const db = await connectDB(); 
    const medicines = await db.collection("Medicine").find({}).toArray();
    res.status(200).json(medicines);
  } catch (error) {
    console.error("Error fetching medicine list:", error);
    res.status(500).json({ message: "Server error while fetching medicines." });
  }
};