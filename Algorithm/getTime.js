import connectDB from "../utils/lib.js";
import calculateEstimatedTime from "./TimeCalculator.js";

const getTime = async (req, res, next) => {
  try {
    const { userEmail, doctorEmail,Status } = req.query;
    console.log("Query Params:", req.query);
    if (!doctorEmail) {
      return res.status(400).json({ message: "Doctor email is required" });
    }
    const db = await connectDB();
    const collection = db.collection("Time");
    const collection2 = db.collection("Appointment");

    console.log(doctorEmail);

    const resp = await collection.findOne({ doctoremail: doctorEmail });
    const resp2 = await collection2.find({ doctorEmail: doctorEmail }).toArray();

    // Convert Status to number (if needed)
    
    let userIndex = -1;

resp2.forEach((item, index) => {
  if (item.userEmail === userEmail && item.status === Number(Status)) {
    userIndex = index;
  }
});

  console.log("Count:", userIndex);

    if (!resp) {
      console.log("Not found");
      return res
        .status(404)
        .json({ message: "No schedule found for this doctor" });
    }

    

    // You probably want to pass count into your calculation
    const estimated = calculateEstimatedTime(resp.time, resp.TotalPatient, userIndex);
    console.log("Estimated Time:", estimated);
    res.status(200).json({ ...resp, estimatedTime: estimated});
  } catch (error) {
    console.error("Error while fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export default getTime;
