const socket = io.connect()
var uploader = new SocketIOFileUpload(socket)
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $fileInput = document.querySelector('#file_input')
const $uploadButton = document.querySelector('#upload_button')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const fileTemplate = document.querySelector('#file-template').innerHTML
const imageTemplate = document.querySelector('#image-template').innerHTML

//Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild
    
    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    //Visible Height 
    const visibleHeight = $messages.scrollHeight
    
    //Height of messages container
    const containerHeight = $messages.scrollHeight
    
    //Height far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight
    
    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})

socket.on('locationMessage', (message) => {
    
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if(error) { 
            return console.log(error)
        }
        console.log('Message delivered !')
    })
})

document.querySelector('#send-location').addEventListener('click', () => {
    if(!navigator.geolocation) {
        return alert('Your browser does not support geolocation.')
    }
    $locationButton.setAttribute('disabled', 'disabled')
    
    navigator.geolocation.getCurrentPosition( (position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location shared !')
        })
    })
})

uploader.listenOnSubmit($uploadButton, $fileInput)

uploader.addEventListener('progress', (event) => {
    const percent = (event.bytesLoaded / event.file.size) * 100;
    console.log('File is', percent.toFixed(2), 'percent loaded')
})
socket.on('sendImage', (file) => {
    const img_html = Mustache.render(imageTemplate, {
        username: file.username,
        filename: file.filename,
        createdAt: moment(file.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', img_html)
    autoscroll()
})

socket.on('sendFile', (file) => {
    const file_html = Mustache.render(fileTemplate, {
        username: file.username,
        filename: file.filename,
        createdAt: moment(file.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', file_html)
    autoscroll()
})

socket.on('getOldData', (data) => {
    data.forEach((msg) => {
        let htmlTemplate, htmlObj, filename
        if(msg.message) {
            htmlTemplate = messageTemplate
            htmlObj = {
                username: msg.name,
                message: msg.message,
                createdAt: moment(msg.createdAt).format('h:mm a')
            }
        } else {
            if(msg.image) {
                htmlTemplate = imageTemplate
                filename = msg.image
            } else {
                htmlTemplate = fileTemplate
                filename = msg.file
            }
            htmlObj = {
                username: msg.name,
                filename,
                createdAt: moment(msg.createdAt).format('h:mm a')
            }
        }
        const msghtml = Mustache.render(htmlTemplate, htmlObj)  
        $messages.insertAdjacentHTML('beforeend', msghtml)
    })
    autoscroll()
})