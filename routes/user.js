const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../model/User");

router.get("/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	if (!user) return res.status(400).json("User does not exist!");
	res.status(200).json(user);
});

module.exports = router;
