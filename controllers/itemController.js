import Item from "../models/Item.js";

const sellerFields = "name email university faculty";

const isOwner = (item, userId) =>
  item.sellerId && item.sellerId.toString() === userId.toString();

export const createItem = async (req, res) => {
  const { title, description, price, category } = req.body;

  if (!title?.trim() || price === undefined || price === null || price === "") {
    return res.status(400).json({ message: "Title and price are required" });
  }

  const parsedPrice = Number(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: "Price must be a valid number" });
  }

  try {
    const item = await Item.create({
      title: title.trim(),
      description: description?.trim() || "",
      price: parsedPrice,
      category: category?.trim() || "",
      sellerId: req.user._id
    });

    await item.populate("sellerId", sellerFields);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate("sellerId", sellerFields)
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "sellerId",
      sellerFields
    );
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (!isOwner(item, req.user._id)) {
      return res.status(403).json({ message: "You can only update your own items" });
    }

    const { title, description, price, category } = req.body;
    if (title !== undefined) item.title = title.trim();
    if (description !== undefined) item.description = description?.trim() || "";
    if (category !== undefined) item.category = category?.trim() || "";
    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ message: "Price must be a valid number" });
      }
      item.price = parsedPrice;
    }

    await item.save();
    await item.populate("sellerId", sellerFields);
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (!isOwner(item, req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own items" });
    }

    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
