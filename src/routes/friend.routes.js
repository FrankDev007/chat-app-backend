import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { acceptFriendRequest, declineFriendRequest, getAllFriendRequests, getAllFriends, getFindFriends, removeFriend, sendFriendRequest } from "../controllers/friend.controllers.js";

const router = express.Router();

router.post('/request/:id', isAuthenticated, sendFriendRequest);
router.post('/accept/:id', isAuthenticated, acceptFriendRequest);
router.delete('/remove/:id', isAuthenticated, removeFriend);
router.delete('/declinefriend/:id', isAuthenticated, declineFriendRequest);
router.get('/getallfriends', isAuthenticated, getAllFriends);
router.get('/addfriendLists', isAuthenticated, getFindFriends);
router.get('/getfriendrequests', isAuthenticated, getAllFriendRequests);

export default router;