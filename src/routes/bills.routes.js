import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { addBill, deleteBill, getBillById, getBills, updateBill } from "../controllers/bills.controllers.js";

const router = express.Router();

router.post("/addbill", isAuthenticated, addBill);
router.put("/updatebill/:id", isAuthenticated, updateBill);
router.get("/getbill/:id", isAuthenticated, getBillById);
router.get("/getallbills", isAuthenticated, getBills);
router.delete("/deletebill/:id", isAuthenticated, deleteBill);

export default router;
    