const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}
const generateFile = (username, filename) => {
    return {
        username,
        filename,
        createdAt: new Date().getTime()
    }
}
const generateOldMessages = (username, room) => {
    return {
        username,
        room,
    }
}
module.exports = {
    generateMessage,
    generateLocationMessage,
    generateFile,
    generateOldMessages
}