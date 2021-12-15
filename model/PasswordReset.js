const mongoose = require("mongoose");

const passwordResetSchema = new mongoose.Schema({
	userId: {
		type: String
	},
	resetString: {
		type: String
	},
	createdAt: {
		type: Date
	},
	expiresAt: {
		type: Date
	}
});

module.exports = mongoose.model("PasswordReset", passwordResetSchema);