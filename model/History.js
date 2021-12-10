const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    user: {
        type: String,
        min: 6,
        max: 12
    },
    rank: {
        type: Number,
        required: true
    },
    streak: {
        type: Number,
        required: true
    },
    point: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('History', historySchema);