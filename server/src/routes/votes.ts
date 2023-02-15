import {Router} from "express";
import userMiddleware from "../middlewares/user";
import authMiddleware from "../middlewares/auth";

const router = Router();

router.post("/", userMiddleware, authMiddleware);
export default router;