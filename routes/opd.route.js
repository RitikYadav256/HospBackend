import express from "express";
import { bookToken, cancelTokenHandler, slotStatus } from "../controller/opd.controller.js";

const router = express.Router();

router.post("/book", bookToken);
router.post("/cancel", cancelTokenHandler);
router.get("/status", slotStatus);

export default router;
