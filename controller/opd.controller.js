import { ObjectId } from "mongodb";
import connectDB from "../utils/lib.js";
import { allocateToken, cancelToken, getSlotStatus } from "../Algorithm/TokenAllocator.js";

/*
API controllers for OPD token allocation.

Endpoints implemented in routes/opd.route.js
*/

const createSlotIfMissing = async (db, doctorEmail, slotStart, slotEnd, capacity = 6) => {
  const Slots = db.collection("Slots");
  const existing = await Slots.findOne({ doctorEmail, slotStart, slotEnd });
  if (!existing) {
    await Slots.insertOne({ doctorEmail, slotStart, slotEnd, capacity });
  }
};

const bookToken = async (req, res) => {
  try {
    const { doctorEmail, slotStart, slotEnd, source } = req.body;
    if (!doctorEmail || !slotStart || !slotEnd || !source) return res.status(400).json({ message: "Missing parameters" });
    const db = await connectDB();
    await createSlotIfMissing(db, doctorEmail, slotStart, slotEnd);
    const result = await allocateToken({ doctorEmail, slotStart, slotEnd, source });
    res.json(result);
  } catch (err) {
    console.error("bookToken error", err);
    res.status(500).json({ error: err.message });
  }
};

const cancelTokenHandler = async (req, res) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ message: "Missing tokenId" });
    const db = await connectDB();
    const result = await cancelToken(new ObjectId(tokenId));
    res.json(result);
  } catch (err) {
    console.error("cancelTokenHandler error", err);
    res.status(500).json({ error: err.message });
  }
};

const slotStatus = async (req, res) => {
  try {
    const { doctorEmail, slotStart, slotEnd } = req.query;
    if (!doctorEmail || !slotStart || !slotEnd) return res.status(400).json({ message: "Missing query params" });
    const status = await getSlotStatus({ doctorEmail, slotStart, slotEnd });
    res.json(status);
  } catch (err) {
    console.error("slotStatus error", err);
    res.status(500).json({ error: err.message });
  }
};

export { bookToken, cancelTokenHandler, slotStatus };
