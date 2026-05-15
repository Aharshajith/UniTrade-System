import User from "../models/User.js";

export const verifyUser = async (req, res, next) => {
  const email = req.headers["x-user-email"];
  const password = req.headers["x-user-password"];

  if (!email || !password) {
    return res.status(401).json({
      message: "Login required",
      hint: "Send x-user-email and x-user-password headers"
    });
  }

  try {
    const user = await User.findOne({ email: String(email).trim() });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
