const express = require("express");

const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const fetchUser = require("../middleware/fetchUser");
const jwt = require("jsonwebtoken");

const JWT_SECERT = "ONLINE_VOTING_SYSTEM_SECRET_KEY";

// Import User Model
const User = require("../model/User");
const Candidate = require("../model/Candidate");
const Voting = require("../model/Voting");

const route = express.Router();

// Route 1 : this route for register user
route.post(
  "/user/register",
  [
    body("user_name").isLength({ min: 3 }),
    body("adhar_no").isLength({ min: 12 }),
    body("password").isLength({ min: 5 }),
  ],
  async (req, res) => {
    const {
      adhar_no,
      user_name,
      date_of_birth,
      gender,
      phone_no,
      address,
      password,
      age,
    } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (age < 18) {
      return res.json({ status: false, msg: "You are not eligible for it." });
    }
    try {
      const user = await User.find({ adhar_no });
      if (user.length) {
        return res
          .status(401)
          .json({ status: false, msg: "User Already Exist" });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(password, salt);
      const result = await User.create({
        adhar_no,
        user_name,
        date_of_birth,
        gender,
        phone_no,
        address,
        age,
        password: secPass,
      });
      if (result) {
        return res
          .status(200)
          .json({ status: true, msg: "Create your Account Successfully" });
      } else {
        return res.status(400).json({ status: true, msg: "Some Error" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: false, error });
    }
  }
);

// Route 2 : Login User
route.post(
  "/user/login",
  [body("adhar_no").exists(), body("password").exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { adhar_no, password } = req.body;
    try {
      let user = await User.findOne({ adhar_no });
      if (!user) {
        return res.status(400).json({
          success: false,
          error: "Please try to login with correct credentials",
        });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({
          success: false,
          error: "Please try to login with correct credentials",
        });
      }

      data = {
        user: {
          id: user.id,
        },
      };
      if (user.verified) {
        user = await User.findOne({ adhar_no }).select("-password");
        const authtoken = jwt.sign(data, JWT_SECERT);
        return res.json({ success: true, user, admin: user.admin, authtoken });
      } else {
        return res.json({
          success: false,
          type: "Not Verified",
          msg: "you are not verified. After verification login again",
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: "Some Error occured" });
    }
  }
);

// Route 3 : See Candidate according to election
route.post("/user/candidates-details", fetchUser, async (req, res) => {
  try {
    const { election_id } = req.body;

    const candidate_list = await Candidate.find({ election_id }).select(
      "-voting"
    );
    return res.json({ status: true, candidate_list });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 4 : Give the vote according to election
route.post("/user/vote", fetchUser, async (req, res) => {
  try {
    const { election_id, candidate_id } = req.body;

    const admin = await User.findById(req.user.id);
    if (admin.admin) {
      return res.status(401).json({ error: "Admin cannot give vote." });
    }

    if (!candidate_id && !election_id) {
      return res.json({
        msg: "Please provide candidate_id,election_id for give the vote",
      });
    }

    const candidate = await Candidate.find({ _id: candidate_id });
    if (!candidate.length) {
      return res.json({ msg: "Candidate or Election not exist" });
    }

    const vote = await Voting.find({ user_id: req.user.id, candidate_id });
    if (vote.length) {
      return res.json({ status: false, msg: "Already Voted." });
    }
    const result = await Candidate.findByIdAndUpdate(
      candidate_id,
      { voting: candidate[0].voting + 1 },
      { new: true }
    ).select("-voting");

    const voting_data = await Voting.create({
      candidate_name: candidate[0].candidate_name,
      party_name: candidate[0].party_name,
      election_id: candidate[0].election_id,
      candidate_id: candidate[0]._id,
      user_id: req.user.id,
      user_name: admin.user_name,
    });

    return res.json({
      status: true,
      result,
      msg: "Successfully give the vote.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 5 : Return voted or not response
route.post("/user/vote-status", fetchUser, async (req, res) => {
  try {
    const { election_id, user_id } = req.body;

    const admin = await User.findById(req.user.id);
    if (admin.admin) {
      return res.status(401).json({ error: "Admin cannot give vote." });
    }
    if (!election_id && !user_id) {
      return res.json({
        msg: "Please provide candidate_id,election_id for give the vote",
      });
    }

    const vote = await Voting.find({ election_id, user_id });
    if (vote.length) {
      return res.json({ status: true, vote, msg: "Already Voted." });
    } else {
      return res.json({ status: false, vote, msg: "Not Voted." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

module.exports = route;
