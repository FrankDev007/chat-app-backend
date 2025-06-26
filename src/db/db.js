import mongoose from "mongoose";
import { config } from "../config/config.js";

export const connectDb = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 5000, // Prevents long delays if MongoDB is unreachable
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        process.exit(1); // Exit if MongoDB fails to connect
    }
};