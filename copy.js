const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../model/User");

router.get("/view/me", async (req, res) => {
	const bearerHeader = req.headers["authorization"];
	const bearer = typeof bearerHeader !== "undefined" && bearerHeader.split(" ");
	const token = bearer && bearer[1];
	try {
		const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
		let user = await User.findById(decoded._id);
		const meResult = {
			userID: user._id,
			name: user.name,
			imagePath: user.imagePath,
		};
		res.status(200).json(meResult);
	} catch {
		res.status(400).json("User not found!");
	}
});

router.get("/view/users", async (req, res) => {
	try {
		let user = await User.findById({
			_id: req.query._id,
		});

		const userResult = {
			name: user.name,
			imagePath: user.imagePath,
		};

		res.status(200).json(userResult);
	} catch {
		res.status(400).json("User not found!");
	}
});

module.exports = router;

