const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    user: {
        type: String,
        min: 6,
        max: 12
    },
    friend: {
        type: String, 
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Friend', friendSchema);