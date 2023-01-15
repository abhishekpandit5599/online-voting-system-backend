const mongoose = require("mongoose");

const User_Schema = mongoose.Schema({
  adhar_no: { type: Number, unique: true, required: true },
  user_name: { type: String, required: true },
  date_of_birth: { type: Date, required: true },
  gender: { type: String, required: true },
  phone_no: { type: Number },
  password: { type: String, required: true },
  address: { type: String },
  age: { type: Number,required: true },
  verified: {type: Boolean, default: false},
  admin: {type: Boolean,default: false},
});

const User = mongoose.model("User", User_Schema);
User.createIndexes();
module.exports = User;
