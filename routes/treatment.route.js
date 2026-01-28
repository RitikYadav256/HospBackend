import express from "express";
import { FetchAllDoctors, bookappointment, fetchappointment } from "../controller/treatment.controller.js";
import { valid } from "../controller/auth.controller.js";
import { sendAppointmentStatus1, sendAppointmentStatus2, sendAppointmentStatus3 } from "../controller/Scheduling.controller.js";
import getTime from "../Algorithm/getTime.js";
const router = express.Router();


router.get("/doctors", FetchAllDoctors);
router.post("/bookappointment", bookappointment);
router.get("/doctors/appointment", fetchappointment);
router.get("/doctors/appointment/getTime", getTime);
router.post("/doctors/appointment/Status/1", sendAppointmentStatus1);
router.post("/doctors/appointment/Status/2", sendAppointmentStatus2);
router.post("/doctors/appointment/Status/3", sendAppointmentStatus3);

export default router; 