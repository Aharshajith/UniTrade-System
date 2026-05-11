import Item from "../models/Item.js";

export const createItem = async (req, res) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllItems = async (req, res) => {
  const items = await Item.find();
  res.json(items);
};

export const getItemById = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Item not found" });
  res.json(item);
};

export const updateItem = async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });
  res.json(item);
};

export const deleteItem = async (req, res) => {
  await Item.findByIdAndDelete(req.params.id);
  res.json({ message: "Item deleted" });
};