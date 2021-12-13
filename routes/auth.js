const router = require("express").Router();
const User = require("../model/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { parse, stringify, toJSON, fromJSON } = require("flatted");
const ObjectId = require("mongoose").Types.ObjectId;
const {
	registerValidation,
	loginValidation,
} = require("../validation/validation");
const { response } = require("express");
const { json } = require("body-parser");

const maxAge = 1000 * 60 * 60 * 24 * 7;

//Register
router.post("/register", async (req, res) => {
	//Validate Data
	const { error } = registerValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Checking Unique User
	const emailExist = await User.findOne({ email: req.body.email });
	if (emailExist) return res.status(400).json("Email already exists");

	//Hash the Password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);

	//Create New User
	const user = new User({
		name: req.body.name,
		email: req.body.email.toLowerCase(),
		password: hashedPassword,
	});

	try {
		await user.save();
		const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
		const registerResponse = {
			user: {
				id: user.id,
				name: user.name,
			},
			token: token,
		};
		res.status(200).json(registerResponse);
	} catch (err) {
		res.status(400).json(err);
	}
});

//Login
router.post("/login", async (req, res) => {
	//Validate Data
	const { error } = loginValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Checking Email Exist
	const user = await User.findOne({ email: req.body.email.toLowerCase() });
	if (!user) return res.status(400).json("Email or Password is wrong");

	//Checking Password
	const validPass = await bcrypt.compare(req.body.password, user.password);
	if (!validPass) return res.status(400).json("Email or Password is wrong");

	//Create a Token
	const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
	const tokenString = token.toString();

	const returnToken = {
		token: tokenString,
	};
	res.cookie("jwt", token, { maxAge: maxAge });
	res.status(200).json(returnToken);
});

//Log Out
router.get("/logout", async (req, res) => {
	//Erase Cookies
	res.clearCookie("jwt");
	res.status(200).json("Cookie is Deleted");

	//Redirect to Home Page
	//res.redirect('/');
});

module.exports = router;
