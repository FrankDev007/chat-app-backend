import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import Bill from "../schemas/biils.models.js";
import { Challan } from "../schemas/challan.models.js";
import { BankDetail } from "../schemas/bank.models.js";

export const addBill = catchAsyncErrors(async (req, res, next) => {
    const {
        billNo,
        name,
        billingDate,
        lotNo,
        receivedDate,
        contactNo,
        panId,
        bankDetails,
        challans,
    } = req.body;

    if (
        !billNo ||
        !name ||
        !billingDate ||
        !lotNo ||
        !receivedDate ||
        !contactNo ||
        !panId ||
        !Array.isArray(bankDetails) ||
        bankDetails.length === 0 ||
        !Array.isArray(challans) ||
        challans.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Please fill all fields and provide at least one challan and bank detail",
        });
    }

    const existingBill = await Bill.findOne({ billNo });
    if (existingBill) {
        return res.status(400).json({
            success: false,
            message: "Bill with this number already exists",
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bill = await new Bill({
            billNo,
            name,
            billingDate,
            lotNo,
            receivedDate,
            contactNo,
            panId,
            user: req.user._id,
        }).save({ session });

        const savedChallans = await Challan.insertMany(
            challans.map((c) => ({ ...c, billRef: bill.billNo })),
            { session }
        );
        const savedBankDetails = await BankDetail.insertMany(
            bankDetails.map((d) => ({ ...d, billRef: bill.billNo })),
            { session }
        );

        bill.challans = savedChallans;
        bill.bankDetails = savedBankDetails;
        await bill.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: "Bill and related documents added successfully",
            bill,
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
});

export const updateBill = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const {
        billNo,
        name,
        billingDate,
        lotNo,
        receivedDate,
        contactNo,
        panId,
        bankDetails = [],
        challans = [],
    } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bill = await Bill.findById({ _id: id, user: req.user.id }).session(session);
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }

        // Update bill fields
        bill.billNo = billNo || bill.billNo;
        bill.name = name || bill.name;
        bill.billingDate = billingDate || bill.billingDate;
        bill.lotNo = lotNo || bill.lotNo;
        bill.receivedDate = receivedDate || bill.receivedDate;
        bill.contactNo = contactNo || bill.contactNo;
        bill.panId = panId || bill.panId;

        // Replace challans if provided
        if (challans.length > 0) {
            await Challan.deleteMany({ billRef: bill.billNo }, { session });

            const savedChallans = await Challan.insertMany(
                challans.map(c => ({ ...c, billRef: bill.billNo })),
                { session }
            );

            bill.challans = savedChallans;
        }

        if (bankDetails.length > 0) {
            await BankDetail.deleteMany({ billRef: bill.billNo }, { session });

            const savedBankDetails = await BankDetail.insertMany(
                bankDetails.map(b => ({ ...b, billRef: bill.billNo })),
                { session }
            );

            bill.bankDetails = savedBankDetails;
        }

        await bill.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Bill updated successfully",
            bill,
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
});


export const getBills = catchAsyncErrors(async (req, res, next) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const totalBills = await Bill.countDocuments({ user: req.user._id });
    if (totalBills === 0) {
        return res.status(404).json({
            success: false,
            message: "No bills found for this user",
        });
    }
    const totalPages = Math.ceil(totalBills / limit);
    const bills = await Bill.find({ user: req.user._id }).populate("challans").populate("bankDetails").sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (!bills || bills.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No bills found for this user",
        });
    }
    res.status(200).json({
        success: true,
        message: "Bills fetched successfully",
        data: {
            bills,
            limit,
            totalBills,
            totalPages,
            currentPage: page,
        }
    });
});

export const getBillById = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const bill = await Bill.findById({ _id: id, user: req.user._id }).populate("challans").populate("bankDetails");
    if (!bill) {
        return res.status(404).json({
            success: false,
            message: "Bill not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "Bill fetched successfully",
        bill,
    });
});

export const deleteBill = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    try {
        const bill = await Bill.findById({ _id: id, user: req.user._id });
        if (!bill) {
            return res.status(404).json({
                success: false,
                message: "Bill not found",
            });
        }
        await Challan.deleteMany({ billRef: bill.billNo });
        await BankDetail.deleteMany({ billRef: bill.billNo });
        await bill.deleteOne();
        res.status(200).json({
            success: true,
            message: "Bill deleted successfully",
        });
    } catch (error) {
        next(error);
    }

})

