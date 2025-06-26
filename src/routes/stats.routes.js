import express from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
import { getBillChartData, getBillGrowthRate, getNewBillsState, getPieChartData, getRecentBills, getTotalBillStats, getTotalChallanStats } from '../controllers/dashboard.controllers.js';

const router = express.Router();

router.get('/totalbills', isAuthenticated, getTotalBillStats);
router.get('/totalchallans', isAuthenticated, getTotalChallanStats);
router.get('/newbills', isAuthenticated, getNewBillsState);
router.get('/growthrate', isAuthenticated, getBillGrowthRate);
router.get('/billChartData', isAuthenticated, getBillChartData);
router.get('/pieChartData', isAuthenticated, getPieChartData);
router.get('/recentbills', isAuthenticated, getRecentBills);

export default router;