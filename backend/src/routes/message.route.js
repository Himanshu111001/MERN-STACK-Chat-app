import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUserPublicKey, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.get("/publicKey/:userId", protectRoute, getUserPublicKey);

router.post("/send/:id", protectRoute, sendMessage);

export default router;
