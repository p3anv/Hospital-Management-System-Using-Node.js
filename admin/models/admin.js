const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  fullName: String,
});

const Admin = mongoose.model("Admin", userSchema);

module.exports = Admin;
