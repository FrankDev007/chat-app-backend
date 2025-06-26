import mongoose from "mongoose";

export const bankDetailsSchema = new mongoose.Schema({
  bankName: { type: String, required: true, trim: true },
  accountNo: { type: String, required: true, trim: true },
  ifscCode: { type: String, required: true, trim: true },
  branch: { type: String, required: true, trim: true },
  billRef: {
    type: String,
    ref: "Bill",
    required: true
  }
}, {
  collection: "bankDetails",
  timestamps: true,
  versionKey: false,
});

export const BankDetail = mongoose.model("BankDetail", bankDetailsSchema);
