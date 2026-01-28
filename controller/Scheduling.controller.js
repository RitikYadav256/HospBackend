
import connectDB from "../utils/lib.js";
import { UpdateTotalPatient } from "../Algorithm/TimeSchedular.js";

const updateBatchStatus = async (req, res, batchNumber) => {
  try {
    const { userEmail, number1, number2 } = req.query;
    const start = parseInt(number1, 10);
    const end = parseInt(number2, 10);
    
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ message: "Invalid number1 or number2" });
    }
    const db = await connectDB();
    // Fetch all doctor appointments
    const allAppointments = await db
      .collection("Appointment")
      .find({ doctorEmail: userEmail })
      .toArray();

    // Slice the range
    const batchAppointments = allAppointments.slice(start, end+1);

    if (batchAppointments.length === 0) {
      return res.status(404).json({ message: "No appointments found for this range" });
    }

    // Get IDs of the appointments in this slice
    const ids = batchAppointments.map((a) => a._id);

    // Update only those appointments
    const result = await db.collection("Appointment").updateMany(
      { _id: { $in: ids } },
      { $set: { status:batchNumber } }
    );

    // Run algorithms
    

    res.status(200).json({
      message: `Batch ${batchNumber} appointments updated`,
      modified: result.modifiedCount,
      range: { start, end },
    });
  } catch (error) {
    console.error(`Error in sendAppointmentStatus${batchNumber}:`, error);
    res.status(500).json({ message: "Server error" });
  }
};

const sendAppointmentStatus1 = (req, res) => updateBatchStatus(req, res, 1);
const sendAppointmentStatus2 = (req, res) => updateBatchStatus(req, res, 2);
const sendAppointmentStatus3 = (req, res) => updateBatchStatus(req, res, 3);

export { sendAppointmentStatus1, sendAppointmentStatus2, sendAppointmentStatus3 };
