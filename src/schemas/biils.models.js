import mongoose from "mongoose";
import { challanSchema } from "./challan.models.js";
import { bankDetailsSchema } from "./bank.models.js";

const billSchema = new mongoose.Schema({
  billNo: { type: String, required: true, trim: true},
  name: { type: String, required: true, trim: true },
  billingDate: { type: Date, required: true },
  lotNo: { type: String, required: true, trim: true },
  receivedDate: { type: Date, required: true },
  contactNo: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, "Please provide a valid 10-digit contact number"],
  },
  panId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Please provide a valid PAN number"],
  },
  bankDetails: {
    type: [bankDetailsSchema],
    default: [],
  },
  challans: {
    type: [challanSchema],
    default: [],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  collection: "bills",
  timestamps: true,
  versionKey: false,
});
// 👇 Make billNo unique per user
billSchema.index({ billNo: 1, user: 1 }, { unique: true });
export const Bill = mongoose.model("Bill", billSchema);
export default Bill;
