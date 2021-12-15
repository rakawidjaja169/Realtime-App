const mongoose = require("mongoose");

const gameRoomSchema = new mongoose.Schema({
	roomPIN: {
		type: String,
		required: true,
		min: 6,
	},
	host: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		default: Date.now,
	},
	gameStartDate: {
		type: Date,
		default: null,
	},
	status: {
		type: String,
		default: "Waiting",
	},
});

module.exports = mongoose.model("GameRoom", gameRoomSchema);
