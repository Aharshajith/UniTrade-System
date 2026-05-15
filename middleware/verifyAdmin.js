import Admin from "../models/Admin.js";

export const verifyAdmin = async (req, res, next) => {
  const email = req.headers["x-admin-email"];
  const password = req.headers["x-admin-password"];

  if (!email || !password) {
    return res.status(401).json({
      message: "Admin authentication required",
      hint: "Send x-admin-email and x-admin-password headers"
    });
  }

  try {
    const admin = await Admin.findOne({ email: email.trim() });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
