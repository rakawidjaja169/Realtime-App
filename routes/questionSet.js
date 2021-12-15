const router = require("express").Router();
const QuestionSet = require("../model/QuestionSet");
const Question = require("../model/Question");
const User = require("../model/User");
//const verify = require('../middleware/verifyToken');
const {
	questionSetValidation,
	questionSetEditValidation,
} = require("../validation/validation");
const jwt = require("jsonwebtoken");
const upload = require("../utils/multer");
const cloudinary = require("../utils/cloudinary");

//Add Question Set
router.post("/add", upload.single("questionSetImage"), async (req, res) => {
	//Get the Author Email
	const token = req.cookies.jwt;
	const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
	let user = await User.findById(decoded._id);

	//Validate Data
	const { error } = questionSetValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);
	const imageUpload = await cloudinary.uploader.upload(req.file.path);

	//Create New Question
	const questionSet = await new QuestionSet({
		questionSet: req.body.questionSet,
		theme: req.body.theme,
		visible: req.body.visible,
		totalQuestion: req.body.totalQuestion,
		author: user._id,
		questionSetImage: imageUpload.secure_url,
		cloudinaryID: imageUpload.public_id,
	});
	try {
		const saveQuestionSet = await questionSet.save();
		res.status(200).json(saveQuestionSet);
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
	const { error } = questionSetEditValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Checking Question Set Exist
	const questionSet = await QuestionSet.findById({
		_id: req.body._id,
	});
	if (!questionSet) return res.status(400).json("Question Set does not exist");

	//Update Question Set
	const myquery = { questionSet: req.body.questionSet, author: user._id };

	const imageUpload = await cloudinary.uploader.upload(req.file.path);

	const newvalues = {
		$set: {
			questionSet: req.body.questionSet,
			theme: req.body.theme,
			visible: req.body.visible,
			totalQuestion: req.body.totalQuestion,
			questionSetImage: imageUpload.secure_url,
			cloudinaryID: imageUpload.public_id,
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
	const questionSet = await QuestionSet.findById({
		_id: req.body._id,
		author: user._id,
	});

	//Error log nya masih salahhh
	if (!questionSet) return res.status(400).json("Error deleting Question Set!");
	res.status(200).json(questionSet);
});

module.exports = router;
