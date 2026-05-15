import User from "../models/User.js";

// REGISTER (plain password)
export const registerUser = async (req, res) => {
  const { name, email, password, university, faculty, phoneNumber } = req.body;

  const missingFields = [];
  if (!name?.trim()) missingFields.push("name");
  if (!email?.trim()) missingFields.push("email");
  if (!password) missingFields.push("password");
  if (!university?.trim()) missingFields.push("university");
  if (!faculty?.trim()) missingFields.push("faculty");
  if (!phoneNumber?.trim()) missingFields.push("phoneNumber");

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Required fields are missing",
      fields: missingFields
    });
  }

  try {
    const userExist = await User.findOne({ email: email.trim() });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim(),
      password, // plain text (not secure)
      university: university.trim(),
      faculty: faculty.trim(),
      phoneNumber: phoneNumber.trim()
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json({ message: "User registered", user: userWithoutPassword });

  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

// LOGIN (simple check)
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.trim() });

    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({
      message: "Login successful",
      user: userWithoutPassword
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};