import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import connectDB from "../utils/lib.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { SetTime } from "../Algorithm/TimeSchedular.js";

dotenv.config();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store files in 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

// File filter (only allow images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images are allowed!"), false);
  }
};

// Initialize multer
const upload = multer({ storage, fileFilter });

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "3h",
  });
};

// Signup Controller with Image Upload
const signup = async (req, res) => {
  console.log("Asking for signup");
  try {
    const { firstName, lastName, email, mobile, dob, address, category, password, specialization, organization, organizations } = req.body;

    // Validate if `specialization` and `organization` are required for doctors
    if (category === "doctor" && (!specialization || specialization.trim() === "")) {
      return res.status(400).json({ message: "Doctor must provide a specialization" });
    }
    if (category === "doctor" && (!organization || organization.trim() === "")) {
      return res.status(400).json({ message: "Doctor must provide an organization name" });
    }

    // Validate if `organizations` is required for medical professionals
    if (category === "medical" && (!organizations || !Array.isArray(organizations) || organizations.length === 0)) {
      return res.status(400).json({ message: "Medical users must add at least one organization" });
    }

    // Get uploaded file
    const profilePic = req.file ? req.file.filename : null;

    // Connect to Database
    const db = await connectDB();
    const collection = db.collection(category); // Store users in category-specific collections

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Encrypt the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user object
    const newUser = {
      firstName,
      lastName,
      email,
      mobile,
      profilePic, // Store filename only
      dob,
      address,
      category,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Attach `specialization` and `organization` only for doctors
    if (category === "doctor") {
      newUser.specialization = specialization;
      newUser.organization = organization;
    }

    // Attach `organizations` only for medical professionals
    if (category === "medical") {
      newUser.organizations = organizations;
    }

    console.log(newUser);

    // Insert user into the database
    const result = await collection.insertOne(newUser);
    if (!result.acknowledged) {
      return res.status(500).json({ message: "Signup unsuccessful, please retry" });
    }

    // Generate JWT Token
    const token = generateToken({ _id: result.insertedId, email });

    res.status(201).json({ message: "User registered successfully", token, user: newUser });

  } catch (error) {
    console.error("Error while signup:", error.message);
    res.status(500).json({ message: "Error in signup", error: error.message });
  }
};




// Login Controller
// Login Controller
const login = async (req, res) => {
  try {
    const { email, password, category } = req.body;
    console.log(category);

    // Connect to Database
    const db = await connectDB();

    let collection; // <-- define once here
    if (category === "patient") {
      collection = db.collection("patient");
    } else if (category === "doctor") {
      collection = db.collection("doctor");
    } else {
      return res.status(400).json({ message: "Invalid category" });
    }

    // Check if user exists
    const user = await collection.findOne({ email });
    if (user && category=="doctor") {
      await SetTime(email);
    }
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare passwords
    const IsMatch = await bcrypt.compare(password, user.password);
    if (!IsMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT Token
   
    const token = generateToken(user);
    res.status(200).json({ message: "Login successful", token, user });

    if (category === "doctor") {
      await SetTime(email);
    }
  } catch (error) {
    console.log("Error in login:", error.message);
    res.status(500).json({ message: "Error in login", error: error.message });
  }
};


// Token Validation Controller
const valid = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ message: "You have been logged out" });
  }
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified) {
      return res.status(200).json({ message: "Valid user", user: verified });
    }
  } catch (error) {
    return res.status(400).json({ message: "User not logged in", error: error.message });
  }
};

export { signup, login, valid, upload };
