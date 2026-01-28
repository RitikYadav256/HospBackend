import connectDB from "../utils/lib.js";

export const SetTime = async (doctoremail) => {
  if (!doctoremail) {
    throw new Error("Doctor email is required");
  }
  try {
    const db = await connectDB();
    const collection = db.collection("Time");
    const resp = await collection.deleteMany({ doctoremail });
    console.log(resp);
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    console.log(currentTime);
    await collection.insertOne({
      doctoremail,
      time: currentTime,
      TotalPatient: 0
    });
    return { message: "Time set successfully" };

  } catch (error) {
    console.error("SetTime Error:", error);
    throw error;
  }
};

export const UpdateTotalPatient = async (doctoremail) => {
  if (!doctoremail) {
    throw new Error("Doctor email is required");
  }
  try {
    const db = await connectDB();
    const collection = db.collection("Time");

    const updateResult = await collection.updateOne(
      { doctoremail },
      { $inc: { TotalPatient: 1 } }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error("Doctor not found");
    }

    // Fetch and return the updated document
    const updatedDoc = await collection.findOne({ doctoremail });

    return {
      message: "TotalPatient incremented by 1",
      TotalPatient: updatedDoc.TotalPatient,
      time: updatedDoc.time
    };

  } catch (error) {
    console.error("UpdateTotalPatient Error:", error);
    throw error;
  }
};
