import mongoose from "mongoose";

export const challanSchema = new mongoose.Schema({
  challanDate: { type: Date, required: true, default: Date.now },
  vehicleNo: { type: String, required: true, trim: true },
  challanNo: { type: String, required: true, trim: true },
  lotQuantity: {
    type: Number,
    required: true,
    validate: { validator: v => v > 0, message: "Lot quantity must be positive" }
  },
  rateAmount: {
    type: Number,
    required: true,
    validate: { validator: v => v >= 0, message: "Rate must be 0 or more" }
  },
  freightAmount: {
    type: Number,
    required: true,
    validate: { validator: v => v >= 0, message: "Freight must be 0 or more" }
  },
  cashAdvance: {
    type: Number,
    required: true,
    validate: { validator: v => v >= 0, message: "Cash advance must be 0 or more" }
  },
  bankAdvance: {
    type: Number,
    required: true,
    validate: { validator: v => v >= 0, message: "Bank advance must be 0 or more" }
  },
  fuelAdvance: {
    type: Number,
    required: true,
    validate: { validator: v => v >= 0, message: "Fuel advance must be 0 or more" }
  },
  tcAmount: {
    type: Number,
    required: true,
    validate: { validator: v => v >= 0, message: "TC amount must be 0 or more" }
  },
  lotPoint: { type: String, required: true, trim: true },
  ulPoint: { type: String, required: true, trim: true },
  billRef: {
    type: String,
    ref: "Bill",
    required: true
  },

}, {
  collection: "challans",
  timestamps: true,
  versionKey: false,
});

export const Challan = mongoose.model("Challan", challanSchema);
