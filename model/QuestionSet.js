const mongoose = require("mongoose");

const questionSetSchema = new mongoose.Schema({
	questionSet: {
		type: String,
		required: true,
		min: 4,
	},
	theme: {
		type: String,
		required: true,
	},
	visible: {
		type: Boolean,
		default: true,
	},
	totalQuestion: {
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
	questionSetImage: {
		type: String,
		default:
			"https://res.cloudinary.com/stadious-backend/image/upload/v1639486516/stadious_logo_compact_qpsai3.png",
	},
	cloudinaryID: {
		type: String,
		default: "stadious_logo_compact_qpsai3",
	},
});

module.exports = mongoose.model("QuestionSet", questionSetSchema);
