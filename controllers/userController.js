import User from "../models/User.js";

// REGISTER (plain password)
export const registerUser = async (req, res) => {
  const { name, email, password, university } = req.body;

  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password, // ❗ plain text (not secure)
      university
    });

    res.json({ message: "User registered", user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN (simple check)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};