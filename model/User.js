const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		min: 6,
		max: 12,
	},
	email: {
		type: String,
		required: true,
		min: 8,
		max: 255,
	},
	password: {
		type: String,
		required: true,
		max: 1024,
		min: 8,
	},
	date: {
		type: Date,
		default: Date.now,
	},
	imagePath: {
		type: String,
		default: "arts/avatars/1.png",
	},
});

module.exports = mongoose.model("User", userSchema);
