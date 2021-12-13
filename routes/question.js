const router = require("express").Router();
const Question = require("../model/Question");
const QuestionSet = require("../model/QuestionSet");
const User = require("../model/User");
//const verify = require('../middleware/verifyToken');
const { questionValidation } = require("../validation/validation");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./uploads/");
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + file.originalname);
	},
});

const fileFilter = (req, file, cb) => {
	//Reject a File
	if (
		file.mimetype === "image/jpeg" ||
		file.mimetype === "image/png" ||
		file.mimetype === "image/jpg"
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const upload = multer({
	storage: storage,
	limits: {
		//5 MB
		fileSize: 1024 * 1024 * 5,
	},
	fileFilter: fileFilter,
});

//Add Question
router.post("/add", upload.single("questionImage"), async (req, res) => {
	//Get the Author Email
	const bearerHeader = req.headers["authorization"];
	const bearer = typeof bearerHeader !== "undefined" && bearerHeader.split(" ");
	const token = bearer && bearer[1];
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = questionValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Create New Question
	const question = new Question({
		questionSetID: req.body.questionSetID,
		number: req.body.number,
		question: req.body.question,
		answer: req.body.answer,
		timeLimit: req.body.timeLimit,
		author: user._id,
		questionImage: req.file.path,
	});
	try {
		const questionSet = await QuestionSet.findById({
			_id: req.body.questionSetID,
		});
		const checkNumber = await Question.findOne({
			questionSetID: req.body.questionSetID,
			number: req.body.number,
		});

		if (req.body.number > questionSet.totalQuestion) {
			return res.status(400).json("Total question limit exceeded!");
		} else if (checkNumber) {
			return res.status(400).json("Question number already exists!");
		} else if (req.body.number <= 0) {
			return res.status(400).json("Invalid question number!");
		}
		try {
			const savedQuestion = await question.save();
			res.status(200).json(savedQuestion);
		} catch (err) {
			res.status(400).json(err);
		}
	} catch {
		res.status(400).json("Question Set does not exist!");
	}
});

//Edit Question
router.put("/edit", upload.single("questionImage"), async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = questionValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Checking Question Exist
	const question = await Question.findOne({
		_id: req.body.questionSetID,
	});
	if (!question) return res.status(400).json("Question Set is not exist");
	//Update Question
	const myquery = {
		questionSetID: req.body.questionSetID,
		number: req.body.number,
		author: user._id,
	};
	const newvalues = {
		$set: {
			question: req.body.question,
			answer: req.body.answer,
			timeLimit: req.body.timeLimit,
			questionImage: req.file.path,
		},
	};

	const updateQuestion = await Question.updateOne(myquery, newvalues);
	//Error log nya masih salahhh

	if (!updateQuestion) return res.status(400).json("Update Question is Error");

	return res.status(200).json("Question is Edited");
});

//Delete Question
router.delete("/delete", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Checking Question Exist
	const question = await Question.findOne({
		questionSetID: req.body.questionSetID,
	});
	if (!question) return res.status(400).json("Question Set is not exist");

	//Delete Question
	const myquery = {
		questionSetID: req.body.questionSetID,
		number: req.body.number,
		author: user._id,
	};
	const deleteQuestion = await Question.deleteOne(myquery);
	//Error log nya masih salahhh
	if (!deleteQuestion) return res.status(400).json("Delete Question is Error");

	res.status(200).json("Question is Deleted");
});

//View All Question
router.get("/all/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//View the Question
	const question = await Question.find({
		questionSetID: req.query.questionSetID,
		author: user._id
	});

	//Error log nya masih salahhh
	if (!question) return res.status(400).json("Question Set does not exist!");
	res.status(200).json(question);
});

//View Specific Question
router.get("/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//View the Question
	const question = await Question.findOne({
		questionSetID: req.query.questionSetID,
		number: req.query.number,
		author: user._id,
	});

	//Error log nya masih salahhh
	if (!question) return res.status(400).json("Question Set does not exist!");
	res.status(200).json(question);
});

module.exports = router;
