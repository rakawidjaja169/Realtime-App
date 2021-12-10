const router = require("express").Router();
const QuestionSet = require("../model/QuestionSet");
const Question = require("../model/Question");
const User = require("../model/User");
//const verify = require('../middleware/verifyToken');
const { questionSetValidation } = require("../validation/validation");
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

// router.get('/', verify, (req, res) => {
//     res.json({
//         posts: {
//             title: 'My First Question Set',
//             description: 'Question Set for Private'
//         }
//     });
// });

//Add Question Set
router.post("/add", upload.single("questionSetImage"), async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = questionSetValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Create New Question
	const questionSet = new QuestionSet({
		questionSet: req.body.questionSet,
		theme: req.body.theme,
		visible: req.body.visible,
		totalQuestion: req.body.totalQuestion,
		author: user._id,
		questionSetImage: req.file.path,
	});
	const checkQuestionSet = QuestionSet.findOne({
		questionSet: req.body.questionSet,
	});
	if (checkQuestionSet) {
		return res.status(400).json("Question Set already exists!");
	}
	try {
		const savedQuestionSet = await questionSet.save();
		res.status(200).json(savedQuestionSet);
	} catch (err) {
		res.status(400).json(err);
	}
});

//Edit Question Set
router.put("/edit", upload.single("questionSetImage"), async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = questionSetValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Checking Question Set Exist
	const questionSet = await QuestionSet.findOne({
		questionSet: req.body.questionSet,
	});
	if (questionSet) return res.status(400).json("Question Set does not exist");

	//Update Question Set
	const myquery = { questionSet: req.body.questionSet, author: user._id };
	const newvalues = {
		$set: {
			questionSet: req.body.questionSet,
			theme: req.body.theme,
			visible: req.body.visible,
			totalQuestion: req.body.totalQuestion,
			questionSetImage: req.file.path,
		},
	};
	const newvaluesQuestion = { $set: { questionSet: req.body.questionSetNew } };
	const updateQuestionSet = await QuestionSet.updateOne(myquery, newvalues);
	const updateQuestion = await Question.updateMany(myquery, newvaluesQuestion);
	//Error log nya masih salahhh
	if (!updateQuestionSet)
		return res.status(400).json("Error updating question set!");
	if (!updateQuestion)
		return res.status(400).json("Error updating question set!");

	if (updateQuestionSet)
		return res.status(200).json("Question set edited successfully.");
});

//Delete Question Set
router.delete("/delete", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Checking Question Exist
	const questionSet = await QuestionSet.findOne({
		questionSet: req.body.questionSet,
	});
	if (!questionSet) return res.status(400).json("Question Set does not exist");

	//Delete Question
	const myquery = { questionSet: req.body.questionSet, author: user._id };
	const deleteQuestionSet = await QuestionSet.deleteOne(myquery);
	const deleteQuestion = await Question.deleteMany(myquery);
	//Error log nya masih salahhh
	if (!deleteQuestionSet)
		return res.status(400).json("Error deleting question set!");
	if (!deleteQuestion)
		return res.status(400).json("Error deleting question set!");

	res.status(200).json("Question is Deleted");
});

//View Question Set
router.get("/view", async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//View the Question Set
	const questionSet = await QuestionSet.findOne({
		questionSet: req.query.questionSet,
		author: user._id,
	});

	//Error log nya masih salahhh
	if (!questionSet) return res.status(400).json("Question Set does not exist!");
	res.status(200).json(questionSet);
});

module.exports = router;
