import mongoose from "mongoose";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Errorhandler } from "../middlewares/Error.js";
import { BankDetail } from "../schemas/bank.models.js";
import Bill from "../schemas/biils.models.js";
import { Challan } from "../schemas/challan.models.js";

export const getTotalBillStats = catchAsyncErrors(async (req, res) => {
    const currentMonth = new Date().getMonth();
    const lastmonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), currentMonth, 1);
    const startOfLastMOnth = new Date(now.getFullYear(), lastmonth, 1);
    const endOfLasMonth = new Date(now.getFullYear(), lastmonth + 1, 0)

    const totalBills = await Bill.countDocuments({ user: req.user._id });

    const currentMonthTotal = await Bill.countDocuments({
        createdAt: {
            $gte: startOfCurrentMonth
        },
        user: req.user._id
    })
    const lastMonthTotal = await Bill.countDocuments({
        createdAt: {
            $gte: startOfLastMOnth,
            $lt: endOfLasMonth
        },
        user: req.user._id
    })

    const diff = currentMonthTotal - lastMonthTotal;
    const percentage = lastMonthTotal === 0 ? 100 : (diff / lastMonthTotal) * 100;
    const trend = diff >= 0 ? 'up' : 'down';

    res.status(200).json({
        success: true,
        data: {
            totalBills,
            currentMonthTotal,
            lastMonthTotal,
            percentage,
            trend
        }
    })
});


export const getTotalChallanStats = catchAsyncErrors(async (req, res, next) => {
    const userBills = await Bill.find({ user: req.user._id }).select("_id");

    if (!userBills || userBills.length === 0) {
        return next(new Errorhandler("No bills found for this user", 404));
    }

    const billIds = userBills.map(bill => bill._id);

    const challans = await Challan.find({ billRef: { $in: billIds } }).sort({ createdAt: -1 });

    if (!challans || challans.length === 0) {
        return next(new Errorhandler("No challans found", 404));
    }

    const totalChallans = challans.length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthDate = new Date(currentYear, currentMonth, 1);
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);

    const currentMonthTotal = challans.filter(c =>
        c.createdAt >= currentMonthDate && c.createdAt < nextMonthDate
    ).length;

    const lastMonthTotal = challans.filter(c =>
        c.createdAt >= lastMonthDate && c.createdAt < currentMonthDate
    ).length;

    let percentage = 0;
    let trend = "up";

    if (lastMonthTotal === 0) {
        percentage = 100;
        trend = "up";
    } else {
        const change = currentMonthTotal - lastMonthTotal;
        percentage = (change / lastMonthTotal) * 100;
        trend = change >= 0 ? "up" : "down";
    }

    res.status(200).json({
        success: true,
        message: "Challans fetched successfully",
        data: {
            totalChallans,
            currentMonthTotal,
            lastMonthTotal,
            percentage: Math.abs(percentage.toFixed(2)),
            trend
        }
    });
});


export const getNewBillsState = catchAsyncErrors(async (req, res, next) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(
        currentMonth === 0 ? currentYear - 1 : currentYear,
        currentMonth === 0 ? 11 : currentMonth - 1,
        1
    );

    const userFilter = { user: req.user._id };

    try {
        // ✅ Get counts, not documents
        const thisMonthTotal = await Bill.countDocuments({
            ...userFilter,
            createdAt: { $gte: startOfCurrentMonth }
        });

        const lastMonthTotal = await Bill.countDocuments({
            ...userFilter,
            createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth }
        });

        const change = thisMonthTotal - lastMonthTotal;
        const percentage = lastMonthTotal === 0 ? 100 : (change / lastMonthTotal) * 100;
        const trend = change >= 0 ? 'up' : 'down';

        res.status(200).json({
            success: true,
            data: {
                thisMonthTotal,
                lastMonthTotal,
                change,
                percentage: percentage.toFixed(2),
                trend
            }
        });
    } catch (err) {
        next(new Errorhandler("Failed to fetch new bills", 500));
    }
});

export const getBillGrowthRate = catchAsyncErrors(async (req, res) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    const startOfCurrentMonth = new Date(now.getFullYear(), currentMonth, 1);
    const startOfLastMonth = new Date(now.getFullYear(), lastMonth, 1);
    const endOfLastMonth = new Date(now.getFullYear(), currentMonth, 0);

    const userFilter = { user: req.user._id }; // Assuming you want to filter by user

    try {
        const currentMonthBills = await Bill.countDocuments({
            ...userFilter,
            createdAt: { $gte: startOfCurrentMonth }
        });

        const lastMonthBills = await Bill.countDocuments({
            ...userFilter,
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        });

        const growthRate = lastMonthBills === 0 ? 100 : ((currentMonthBills - lastMonthBills) / lastMonthBills) * 100;
        const trend = currentMonthBills >= lastMonthBills ? "up" : "down";

        res.status(200).json({
            success: true,
            data: {
                currentMonthBills,
                lastMonthBills,
                growthRate,
                trend
            }
        });
    } catch (error) {
        next(error);
    }
});

export const getBillChartData = catchAsyncErrors(async (req, res, next) => {
    try {
        const { range = '90d' } = req.query;
        const user = req.user?._id;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        const daymap = {
            "7d": 7,
            "30d": 30,
            "90d": 90
        };
        const days = daymap[range] || 90;
        const referenceDate = new Date();
        const startDate = new Date(referenceDate);
        startDate.setDate(referenceDate.getDate() - days);

        const data = await Bill.aggregate([
            {
                $match: {
                    billingDate: { $gte: startDate, $lte: referenceDate },
                    user: new mongoose.Types.ObjectId(user) // <-- Changed from createdBy
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$billingDate"
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const chartData = data.map(item => ({
            date: item._id,
            bill: item.count
        }));

        return res.status(200).json({
            success: true,
            message: "Bill chart data fetched successfully",
            data: chartData
        });

    } catch (error) {
        next(error);
    }
});

export const getPieChartData = catchAsyncErrors(async (req, res, next) => {
    try {
        const bills = await Bill.find({ user: req.user._id }).populate("challans").populate("bankDetails").sort({ createdAt: -1 });
        const totalBills = bills.length;
        const userBills = await Bill.find({ user: req.user._id }).select("billNo");
        if (!userBills || userBills.length === 0) {
            return next(new Errorhandler("No bills found for this user", 404));
        }
        const billnos = userBills.map(bill => bill.billNo);
        const challans = await Challan.find({ billRef: { $in: billnos } }).sort({ createdAt: -1 });
        if (!challans || challans.length === 0) {
            return next(new Errorhandler("No challans found", 404));
        }
        const totalChallans = challans.length;

        const bankDetails = await BankDetail.find({ billRef: { $in: billnos } }).sort({ createdAt: -1 });
        if (!bankDetails || bankDetails.length === 0) {
            return next(new Errorhandler("No bank details found", 404));
        }
        const totalBankDetails = bankDetails.length;

        res.status(200).json({
            success: true,
            message: "Pie chart data fetched successfully",
            data: [
                { name: "bills", length: totalBills, fill: "var(--color-bills)" },
                { name: "challans", length: totalChallans, fill: "var(--color-challans)" },
                { name: "bank", length: totalBankDetails, fill: "var(--color-bank)" },
            ]
        })
    } catch (error) {
        next(error);
    }
})

export const getRecentBills = catchAsyncErrors(async (req, res, next) => {
    try {
        const bills = await Bill.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5).populate("challans").populate("bankDetails");
        if (!bills || bills.length === 0) {
            return next(new Errorhandler("No bills found", 404));
        }
        res.status(200).json({
            success: true,
            message: "Recent bills fetched successfully",
            data: bills
        })
    } catch (error) {
        next(error);
    }
})



