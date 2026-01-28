import express from "express";
import connectDB from "../utils/lib.js";
import jwt from "jsonwebtoken";



const FetchAllDoctors = async (req, res) => {
  console.log("Asking for doctor");
  try {
    const db = await connectDB();
    const doctors = await db.collection("doctor").find({}).toArray();
    res.status(200).json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const bookappointment = async (req, res, next) => {
  try {
   
    const token = req.headers.authorization?.split(" ")[1];
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) {
      return res.status(400).json({ message: "Unauthorized User" });
    }

    
    const { doctorEmail, doctorOrganization, userEmail, userAge, userMobile, serviceType } = req.body;

    
    if (!doctorEmail || !doctorOrganization || !userEmail || !userAge || !userMobile || !serviceType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    
    const db = await connectDB();

    const duplicate = await db.collection("Appointment").findOne({ doctorEmail, userEmail });
    if (duplicate) {
      return res.status(409).json({ message: "You already have an appointment" });
    }

    
    const inserted = await db.collection("Appointment").insertOne({
      doctorEmail,
      doctorOrganization,
      userEmail,
      userAge,
      userMobile,
      serviceType,
      createdAt: new Date() 
    });

    if (!inserted.acknowledged) {
      return res.status(400).json({ message: "Booking failed" });
    }

    res.status(200).json({ message: "Appointment booked successfully" });

  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const fetchappointment = async (req, res, next) => {
  try {
    const { doctorEmail, userEmail, category, Token } = req.query; 
    
    const CurrentDate = new Date().toISOString().split("T")[0]; 
    const db = await connectDB();
    let query = {};
    if (category === "doctor") {
      console.log("Fetching doctor appointments");
      console.log(userEmail);
      const data = await db.collection("Appointment").find({ doctorEmail: userEmail }).toArray();
      if (data.length === 0) {
        return res.status(404).json({ message: "No appointments found" });
      }
      return res.status(200).json(data);
    } else if (category === "patient") {
      console.log("Fetching patient appointments");
      const data = await db.collection("Appointment").find({ userEmail: userEmail }).toArray();
      console.log(data);
      if (data.length === 0) {
        return res.status(404).json({ message: "No appointments found" });
      }
      return res.status(200).json(data);
    } else {
      return res.status(400).json({ message: "Invalid category" });
    }
  } catch (error) {
    console.error("Error while fetching appointments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export { FetchAllDoctors, bookappointment, fetchappointment };
