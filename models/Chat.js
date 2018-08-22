const mongoose = require('mongoose');
const { Schema } = mongoose;

const Chat = new Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    messages: [
        {
            message: String,
            meta:
                {
                    user: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User'
                    },
                    date: {
                        type: Date,
                        default: Date.now
                    }
                }
        }
    ],
    participants: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],
    lastSent: { type: Date, default: Date.now },
    recentMessage: { type: String, default: 'Start a conversation' }
})

module.exports = Chat;