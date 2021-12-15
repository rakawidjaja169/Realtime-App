const mongoose = require("mongoose");

const playerListSchema = new mongoose.Schema({
	gameRoomID: {
		type: String,
		required: true,
	},
	roomPIN: {
		type: String,
		required: true,
		min: 6,
	},
	userID: {
		type: String,
		required: true,
	},
	isReady: {
		type: Boolean,
		default: false,
	},
	abandonStatus: {
		type: Boolean,
		default: false,
	},
	finalPoint: {
		type: String,
		default: 0,
	},
	finalStreak: {
		type: String,
		default: 0,
	},
});

module.exports = mongoose.model("PlayerList", playerListSchema);
