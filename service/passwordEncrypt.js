const bcrypt = require('bcrypt');

async function hashPassword(req, res, next) {
  try {
    const { password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);
    req.hashedPass = hashedPass;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Hashing failed" });
  }
}

async function comparePassword(req, res, next) {
    try {
      const { password } = req.body;
      const userPassword = req.user.password;
      const isMatch = await bcrypt.compare(password, userPassword);
  
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
  
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Password comparison failed" });
    }
}

module.exports = {
  hashPassword,
  comparePassword,
};
