import { Router } from "express";
import { addExpense, listExpenses, settleExpense } from "../controllers/expense.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.use(authRequired);
router.get("/", listExpenses);
router.post("/", addExpense);
router.post("/settle", settleExpense);

export default router;
