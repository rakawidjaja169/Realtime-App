const router = require("express").Router();
const Message = require("../model/Message");
const User = require("../model/User");
//const verify = require('../middleware/verifyToken');
const { messageValidation } = require("../validation/validation");
const jwt = require("jsonwebtoken");

//Add Message
router.post("/add", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = messageValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Create New Message
	const message = new Message({
		user: user._id,
		friend: req.body.friend,
        message: req.body.message,
        roomID: req.body.roomID
	});
	try {
		const savedMessage = await message.save();
		res.status(200).json(savedMessage);
	} catch (err) {
		res.status(400).json(err);
	}
});

//Delete Message
router.delete("/remove", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Checking Friend Exist
	const message = await Message.findOne({
        messageID: req.body.messageID
	});
	if (!message) return res.status(400).json("Message doesn't exist");

	//Delete Friend
	const myquery = {
		messageID: req.body.messageID
	};

	const deleteMessage = await Message.deleteOne(myquery);
	//Error log nya masih salahhh
	if (!deleteMessage) return res.status(400).json("Unsend Message is Error");

	res.status(200).json("Unsend");
});

//View All Message
router.get("/all/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//View all message
	const message = await Message.find({
		roomID: req.body.roomID
	});

	//Error log nya masih salahhh
	if (!message) return res.status(400).json("Message does not exist!");
	res.status(200).json(message);
});

module.exports = router;
