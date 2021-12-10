const router = require("express").Router();
const Friend = require("../model/Friend");
const Room = require("../model/Room");
const User = require("../model/User");
//const verify = require('../middleware/verifyToken');
const { friendValidation } = require("../validation/validation");
const jwt = require("jsonwebtoken");

//Add Friend
router.post("/add", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = friendValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

    //Checking Friend Exist
	const friendExist = await Friend.findOne({
        user: user._id,
		friend: req.body.friend
	});
	if (friendExist) return res.status(400).json("Already Friends");

	//Checking Room Exist
	const roomExist = await Room.findOne({
		"$or": [{
			user: user._id,
			friend: req.body.friend
		}, {
			user: req.body.friend,
			friend: user._id
		}]
	});

	//Create New Friend
	const friend = new Friend({
		user: user._id,
		friend: req.body.friend
	});

	//Create New Room
	const room = new Room({
		user: user._id,
		friend: req.body.friend
	});

	if (!roomExist) return savedRoom = await room.save();

	try {
		const savedFriend = await friend.save();
		res.status(200).json(savedFriend);
	} catch (err) {
		res.status(400).json(err);
	}
});

//Delete Friend
router.delete("/remove", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Checking Friend Exist
	const friend = await Friend.findOne({
		user: user._id,
		friend: req.body.friend
	});
	if (!friend) return res.status(400).json("Friend doesn't exist");

	//Delete Friend
	const myquery = {
		user: user._id,
		friend: req.body.friend
	};

	const deleteFriend = await Friend.deleteOne(myquery);
	//Error log nya masih salahhh
	if (!deleteFriend) return res.status(400).json("Delete Friend is Error");

	res.status(200).json("Friend is Deleted");
});

//View Specific Friend
router.get("/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//View the Friend
	const friend = await Friend.findOne({
		user: user._id,
		friend: req.body.friend
	});

	//Error log nya masih salahhh
	if (!friend) return res.status(400).json("Friend does not exist!");
	res.status(200).json(friend);
});

//View All Friend
router.get("/all/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//View the Friend
	const friend = await Friend.find({
		user: user._id
	});

	//Error log nya masih salahhh
	if (!friend) return res.status(400).json("Friend does not exist!");
	res.status(200).json(friend);
});

module.exports = router;
