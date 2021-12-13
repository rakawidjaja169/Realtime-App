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

router.post("/view/me/edit", async (req, res) => {
	const bearerHeader = req.headers["authorization"];
	const bearer = typeof bearerHeader !== "undefined" && bearerHeader.split(" ");
	const token = bearer && bearer[1];
	try {
		const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
		const myQuery = await User.findById({
			_id: decoded._id,
		});
		const newValues = {
			$set: {
				name: req.body.name,
				imagePath: req.body.imagePath,
			},
		};
		const editUser = await User.updateOne(myQuery, newValues);
		if (!editUser) return res.status(400).json("Error editing user!");
		res.status(200).json("User edited!");
	} catch {
		return res.status(400).json("An error occured!");
	}
});

router.get("/view/users", async (req, res) => {
	req.headers["authorization"];

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
