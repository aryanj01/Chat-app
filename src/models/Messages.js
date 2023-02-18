const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    room: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
    },
    image: {
        type: String
    },
    file: {
        type: String
    },
    createdAt: {
        type: Date
    }
})

const Messages = mongoose.model('Messages', messageSchema)
module.exports = Messages