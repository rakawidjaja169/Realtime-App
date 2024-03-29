const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
	questionSetID: {
		type: String,
		required: true,
	},
	number: {
		type: Number,
		required: true,
	},
	question: {
		type: String,
		required: true,
		min: 8,
	},
	answer: {
		type: Boolean,
		required: true,
	},
	timeLimit: {
		type: Number,
		required: true,
	},
	date: {
		type: Date,
		default: Date.now,
	},
	author: {
		type: String,
		min: 8,
		max: 255,
	},
	questionImage: {
		type: String,
		default:
			"https://res.cloudinary.com/stadious-backend/image/upload/v1639486516/stadious_logo_s0cimx.png",
	},
	cloudinaryID: {
		type: String,
		default: "stadious_logo_s0cimx",
	},
});

module.exports = mongoose.model("Question", questionSchema);
