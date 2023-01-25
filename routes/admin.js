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
      return res.status(200).json({
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
route.post("/admin/user-list", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }
    const { approved_list } = req.body;

    const list = await User.find({
      verified: approved_list,
      admin: false,
    }).select("-password");
    return res.json({ status: true, list });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 6 : See Candidate according to election
route.post("/admin/candidates-details", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }
    const { election_id } = req.body;

    const total_voters = await (await Voting.find({election_id})).length;

    const candidate_list = await Candidate.find({ election_id });
    return res.json({ status: true,total_voters, candidate_list });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 7 : Get All Voted User
route.post("/admin/voted-user", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }
    const { election_id } = req.body;

    const voted_user_list = await Voting.find({ election_id });
    return res.json({ status: true, voted_user_list });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 8 : get all stats for admin dashboard
route.get("/admin/get-all-stats", async (req, res) => {
  try {
    const total_candidate = await (await Candidate.find()).length;
    const total_election = await (await Election.find()).length;
    const total_user = (await (await User.find()).length) - 1;
    return res.json({
      status: true,
      total_candidate,
      total_election,
      total_user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 9 : get recent results admin
route.get("/admin/recent-results", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }

    const candidate_list = await (await Candidate.find()).splice(0, 5);
    return res.json({ status: true, candidate_list });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 10 : get recent voters admin
route.get("/admin/recent-voters", fetchUser, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }

    const voters = await (await Voting.find()).splice(0, 5);
    return res.json({ status: true, voters });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

// Route 11 : get Proper result 
route.post("/admin/result", fetchUser, async (req, res) => {
  try {
    const {election_id} = req.body;
    if(!election_id){
      return res.status(200).json({status: false, msg : "Please provide the election_id"});
    }

    const admin = await User.findById(req.user.id);
    if (!admin.admin) {
      return res.status(401).json({ error: "Only Access Admin." });
    }

    const voter_list = await Voting.find({election_id});
    let obj = {};
    let arr =[];
    const total_voters = voter_list.length;
    voter_list.forEach((element)=>{
      if(element.candidate_id in arr){
        obj[element.candidate_id] = obj[element.candidate_id] + 1;
      }else{
        arr.push(element.candidate_id);
        obj[element.candidate_id] = 1;
      }
    })

    Object.keys(obj).forEach(function(key, idx) {
      let voter = obj[key];
      let percentage = (voter*100)/total_voters; 
      obj[key] = percentage;
   });
    console.log(obj)
    res.status(200).json({ status: true, obj });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false, error });
  }
});

module.exports = route;
