const router = require("express").Router();
const History = require("../model/History");
const User = require("../model/User");
//const verify = require('../middleware/verifyToken');
const { historyValidation } = require("../validation/validation");
const jwt = require("jsonwebtoken");

// router.get('/', verify, (req, res) => {
//     res.json({
//         posts: {
//             title: 'My First Question Set',
//             description: 'Question Set for Private'
//         }
//     });
// });

//Add History
router.post("/add", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = historyValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Create New History
	const history = new History({
		user: user._id,
		rank: req.body.rank,
		streak: req.body.streak,
		point: req.body.point,
	});
	try {
		const savedHistory = await history.save();
		res.status(200).json(savedHistory);
	} catch (err) {
		res.status(400).json(err);
	}
});

//View History
router.get("/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//View the History
	const history = await History.find({
		user: user._id,
	});

	if (!history) return res.status(400).json("History does not exist!");
	res.status(200).json(history);
});

module.exports = router;