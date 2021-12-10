const router = require("express").Router();
const Room = require("../model/Room");
const User = require("../model/User");
//const verify = require('../middleware/verifyToken');
const { roomValidation } = require("../validation/validation");
const jwt = require("jsonwebtoken");

//Add Room
router.post("/add", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = roomValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

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
	if (roomExist) return res.status(400).json("Room is already exist");

	//Create New Room
	const room = new Room({
		user: user._id,
		friend: req.body.friend
	});
	try {
		const savedRoom = await room.save();
		res.status(200).json(savedRoom);
	} catch (err) {
		res.status(400).json(err);
	}
});

//Delete Room
router.delete("/remove", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Checking Room Exist
	const room = await Room.findOne({
		roomID: req.body.roomID
	});
	if (!room) return res.status(400).json("Room doesn't exist");

	//Delete Room
	const myquery = {
		roomID: req.body.roomID
	};

	const deleteRoom = await Room.deleteOne(myquery);
	//Error log nya masih salahhh
	if (!deleteRoom) return res.status(400).json("Delete Room is Error");

	res.status(200).json("Room is Deleted");
});

//View Specific Room
router.get("/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//View the Room
	const room = await Room.findOne({
		roomID: req.body.roomID
	});

	//Error log nya masih salahhh
	if (!room) return res.status(400).json("Room does not exist!");
	res.status(200).json(room);
});

module.exports = router;
