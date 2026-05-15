import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAllUsers,
  getAllItems,
  deleteUser,
  deleteItem
} from "../controllers/adminController.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/users", verifyAdmin, getAllUsers);
router.get("/items", verifyAdmin, getAllItems);
router.delete("/users/:id", verifyAdmin, deleteUser);
router.delete("/items/:id", verifyAdmin, deleteItem);

export default router;
