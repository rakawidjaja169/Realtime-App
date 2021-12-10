const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    user: {
        type: String,
        min: 6,
        max: 12
    },
    friend: {
        type: String, 
        required: true
    },
    message: {
        type: String, 
        required: true
    },
    roomID: {
        type: String, 
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);