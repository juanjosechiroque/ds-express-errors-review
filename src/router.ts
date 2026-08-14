import { Router } from "express";

import authRouter from "./api/auth/auth.router.js";
import productRouter from "./api/product/product.router.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/products", productRouter);

export default router;
