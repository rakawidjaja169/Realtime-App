const mongoose = require('mongoose');

const questionSetSchema = new mongoose.Schema({
    questionSet: {
        type: String,
        required: true,
        min: 4
    },
    theme: {
        type: String,
        required: true
    },
    visible: {
        type: String,
        required: true,
        min: 8
    },
    totalQuestion: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    author: {
        type: String,
        min: 8,
        max: 255
    },
    questionSetImage: {
        type: String
    }
});

module.exports = mongoose.model('QuestionSet', questionSetSchema);