const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const http = require('http')
const socketiofileupload = require('socketio-file-upload')
const app = express().use(socketiofileupload.router)
const server = http.createServer(app)
const io = socketio(server)
const {generateMessage, generateLocationMessage, generateFile, generateOldMessages} = require('./utils/messages')
const {addUser, removeUser, getUser, getUserInRoom} = require('./utils/users')
require('./db/mongoose')
const User = require('../src/models/User')
const Messages = require('../src/models/Messages')

const publicDirectoryPath = path.join(__dirname, '../public')
const port = process.env.PORT||3000

app.use(express.static(publicDirectoryPath))

io.on('connection',  (socket) => {
    console.log('New WebSocket connection')

    const uploader = new socketiofileupload()
    uploader.dir = publicDirectoryPath + '/uploads'
    uploader.listen(socket)

    uploader.on('saved', async (event) => {
        const user = await getUser(socket.id)
        const filename = event.file.name
        const filenameExtension = filename.split('.').pop()
        const iamgeExtensions = ['jpg', 'jpeg','png', 'gif']
        const isImage = iamgeExtensions.includes(filenameExtension)
        let messageobj
        if(isImage) {
            messageobj = new Messages({
                name: user.username,
                room: user.room,
                image: filename,
                createdAt: new Date().getTime()
            })
            await messageobj.save()
            socket.emit('sendImage', generateFile('You', event.file.name))
            socket.broadcast.to(user.room).emit('sendImage', generateFile(user.username, event.file.name))
        }else {
            messageobj = new Messages({
                name: user.username,
                room: user.room,
                file: filename,
                createdAt: new Date().getTime()
            })
            await messageobj.save()
            socket.emit('sendFile', generateFile('You', event.file.name))
            socket.broadcast.to(user.room).emit('sendFile', generateFile(user.username, event.file.name))
        }
    
    })

    uploader.on('error', (event) => {
        console.log(event)
        throw new Error('Uploader event error')
    })

    socket.on('join', async ({username, room}, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room})
        
        if(error) {
            return callback(error)
        }
        socket.join(room)
        const roomData = await Messages.find({room})
        if(roomData){
            socket.emit('getOldData', roomData)
        }
        const userDB = new User({username, room})
        await userDB.save()

        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', async (message, callback) => {  
        const user = getUser(socket.id)
        const name = user.username
        const room = user.room
        const messageobj = new Messages({
            name,
            room,
            message,
            createdAt: new Date().getTime()
        })
        await messageobj.save()
        socket.emit('message', generateMessage('You', message))
        socket.broadcast.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })
    socket.on('sendLocation', ({latitude, longitude}, callback) => {
        const user = getUser(socket.id)
        const url = `https://google.com/maps?q=${latitude},${longitude}`
        socket.emit('locationMessage', generateLocationMessage('You', url))
        socket.broadcast.to(user.room).emit('locationMessage', generateLocationMessage(user.username, url))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if(user) {
            io.to(user.room).emit('message',generateMessage(`${user.username} user has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }

    })
})

server.listen(port, () => {
    console.log('Server is up and running.')
})
