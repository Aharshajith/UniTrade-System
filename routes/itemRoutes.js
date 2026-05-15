import express from "express";
import {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem
} from "../controllers/itemController.js";
import { verifyUser } from "../middleware/verifyUser.js";

const router = express.Router();

router.get("/", getAllItems);
router.get("/:id", getItemById);
router.post("/", verifyUser, createItem);
router.put("/:id", verifyUser, updateItem);
router.delete("/:id", verifyUser, deleteItem);

export default router;
