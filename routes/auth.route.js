import express from "express";
import { login, signup, valid } from "../controller/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/user", valid);

export default router; 
