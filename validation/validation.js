//Validation
const Joi = require("@hapi/joi");

//Register Validation
const registerValidation = (data) => {
	const schema = Joi.object({
		name: Joi.string().min(6).required(),
		email: Joi.string().min(8).required().email(),
		password: Joi.string().min(8).required(),
	});
	return schema.validate(data);
};

//Login Validation
const loginValidation = (data) => {
	const schema = Joi.object({
		email: Joi.string().min(8).required().email(),
		password: Joi.string().min(8).required(),
	});
	return schema.validate(data);
};

//Question Set Validation
const questionSetValidation = (data) => {
	const schema = Joi.object({
		questionSet: Joi.string().min(4).required(),
		theme: Joi.string().required(),
		visible: Joi.bool().required(),
		totalQuestion: Joi.number().required(),
	});
	return schema.validate(data);
};

const questionSetEditValidation = (data) => {
	const schema = Joi.object({
		_id: Joi.required(),
		questionSet: Joi.string().min(4).required(),
		theme: Joi.string().required(),
		visible: Joi.bool().required(),
		totalQuestion: Joi.number().required(),
	});
	return schema.validate(data);
};

//Question Validation
const questionValidation = (data) => {
	const schema = Joi.object({
		_id: Joi.string(),
		questionSetID: Joi.string().required(),
		number: Joi.number().required(),
		question: Joi.string().min(8).required(),
		answer: Joi.required(),
		timeLimit: Joi.number().required(),
	});
	return schema.validate(data);
};

//History Validation
const historyValidation = (data) => {
	const schema = Joi.object({
		rank: Joi.number().required(),
		streak: Joi.number().required(),
		point: Joi.number().required(),
	});
	return schema.validate(data);
};

//Friend Validation
const friendValidation = (data) => {
	const schema = Joi.object({
		friend: Joi.string().required(),
	});
	return schema.validate(data);
};

//Message Validation
const messageValidation = (data) => {
	const schema = Joi.object({
		friend: Joi.string().required(),
		message: Joi.string().required(),
		roomID: Joi.string().required(),
	});
	return schema.validate(data);
};

//Room Validation
const roomValidation = (data) => {
	const schema = Joi.object({
		friend: Joi.string().required(),
	});
	return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.questionSetValidation = questionSetValidation;
module.exports.questionSetEditValidation = questionSetEditValidation;
module.exports.questionValidation = questionValidation;
module.exports.historyValidation = historyValidation;
module.exports.friendValidation = friendValidation;
module.exports.messageValidation = messageValidation;
module.exports.roomValidation = roomValidation;
