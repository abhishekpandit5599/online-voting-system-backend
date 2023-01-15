const express = require("express");

const fetchUser = require("../middleware/fetchUser");

// Import User Model
const User = require("../model/User");
// Import Election Model
const Election = require("../model/Election");
const Candidate = require("../model/Candidate");
const Voting = require("../model/Voting");

const route = express.Router();

// Route 1 : Create Election
route.post("/admin/create-election", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }

    const { election_name, election_date, no_of_candidate } = req.body;
    if (election_name && election_date && no_of_candidate) {
      const election = await Election.create({
        election_name,
        election_date,
        no_of_candidate,
      });
      return res.json({ status: true, election });
    } else {
      return res.status(200).json({
        status: false,
        msg: "Please provide election_name,election_date,no_of_candidate",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 2 : Verify User
route.put("/admin/verify-user", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }

    const { user_id } = req.body;
    if (!user_id) {
      return res.status(200).json({
        status: false,
        msg: "Please provide user_id",
      });
    }
    const user = await User.findByIdAndUpdate(
      user_id,
      { verified: true },
      { new: true }
    ).select("-password");
    return res.json({ status: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 3 : Add Candidate for Specific Election
route.post("/admin/add-candidate", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }

    const {
      candidate_name,
      election_id,
      party_name,
      candidate_age,
      party_logo,
    } = req.body;
    if (
      !election_id &&
      !candidate_name &&
      !election_id &&
      !party_name &&
      !candidate_age &&
      !party_logo
    ) {
      return res.status(200).json({
        status: false,
        msg: "Please provide candidate_name, election_id,party_name,candidate_age,party_logo",
      });
    }
    const election = await Election.findById(election_id);
    if (!election) {
      return res.status(401).json({ msg: "Election are not exist" });
    }

    const result = await Candidate.find({
      candidate_name,
      election_id,
      party_name,
      candidate_age,
    });
    if (result.length) {
      return res
        .status(200)
        .json({
          status: false,
          msg: "Candidate All ready added in this election",
        });
    }

    const candidate = await Candidate.create({
      candidate_name,
      election_id,
      party_name,
      candidate_age,
      party_logo,
    });
    return res.json({ status: true, candidate });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 4 : See All Elections
route.get("/admin/all-elections", fetchUser, async (req, res) => {
  try {
    const elections = await Election.find();

    return res.json({ status: true, elections });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 5 : See User Approved or pending
route.get("/admin/user-list", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }
    const {approved_list} = req.body;

    const list = await User.find({verified: approved_list,admin: false}).select("-password");
    return res.json({ status: true, list });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});


// Route 6 : See Candidate according to election
route.get("/admin/candidates-details", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }
    const {election_id} = req.body;

    const candidate_list = await Candidate.find({election_id});
    return res.json({ status: true, candidate_list });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});


// Route 7 : Get All Voted User
route.get("/admin/voted-user", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }
    const {election_id} = req.body;

    const voted_user_list = await Voting.find({election_id});
    return res.json({ status: true, voted_user_list });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

module.exports = route;
