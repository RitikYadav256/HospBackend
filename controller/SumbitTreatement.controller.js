import connectDB from "../utils/lib.js";



const SubmitTreatmentRecord = async (req, res) => {
  console.log("📥 Submitting Treatment Record");

  try {
    const db = await connectDB();

    const treatmentData = req.body;
    console.log("Received treatment data:", treatmentData.patientEmail);

    treatmentData.createdAt = new Date();

    const result = await db.collection("patientsDB").insertOne(treatmentData);

    res.status(201).json({
      message: "Treatment record created successfully",
      recordId: result.insertedId,
    });

  } catch (error) {
    console.error("❌ Error saving treatment record:", error);
    res.status(500).json({
      message: "Server error while saving treatment record",
    });
  }
};



const FindPatientRecord = async (req, res) => {
  console.log("📥 Fetching Treatment Records");

  try {
    const db = await connectDB();
    const data = await db.collection("patientsDB").find({}).toArray();

    res.status(200).json(data);

  } catch (error) {
    console.error("❌ Error fetching treatment records:", error);
    res.status(500).json({
      message: "Server error while fetching treatment records",
    });
  }
};



export { SubmitTreatmentRecord, FindPatientRecord };
