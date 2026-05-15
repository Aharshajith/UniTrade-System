import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Item from "../models/Item.js";

export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  const missingFields = [];
  if (!name?.trim()) missingFields.push("name");
  if (!email?.trim()) missingFields.push("email");
  if (!password) missingFields.push("password");

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Required fields are missing",
      fields: missingFields
    });
  }

  try {
    const adminExists = await Admin.findOne({ email: email.trim() });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      name: name.trim(),
      email: email.trim(),
      password
    });

    const { password: _, ...adminWithoutPassword } = admin.toObject();
    res.status(201).json({ message: "Admin registered", admin: adminWithoutPassword });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const admin = await Admin.findOne({ email: email.trim() });

    if (!admin || admin.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { password: _, ...adminWithoutPassword } = admin.toObject();
    res.json({
      message: "Login successful",
      admin: adminWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find()
      .populate("sellerId", "name email university faculty phoneNumber")
      .sort({ createdAt: -1 });
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Item.deleteMany({ sellerId: user._id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User and their listings deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
