const mongoose = require('mongoose')
const validator = require('validator')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    room: {
        type: String,
        trim: true
    },
})

const User = mongoose.model('User', userSchema)
module.exports = User