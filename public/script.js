const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

var friend = "default";
var myId;

if (messageForm != null) {
  const id = prompt('What is your ID?')
  myId = id;
  socket.emit('get-info', roomName);
  appendMessage('You joined')
  socket.emit('new-user', roomName, id)

  messageForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', roomName, message, id, friend);
    messageInput.value = ''
  })
}

socket.on('room-created', room => {
  const roomElement = document.createElement('div')
  roomElement.innerText = room
  const roomLink = document.createElement('a')
  roomLink.href = `/${room}`
  roomLink.innerText = 'join'
  roomContainer.append(roomElement)
  roomContainer.append(roomLink)
})

socket.on('get-friend', () => {
  socket.emit('friend-id', roomName, myId);
})

socket.on('friend-id', (room, friendId) => {
  if(roomName == room) {
    if( myId != friendId) {
      friend = friendId;
      console.log(friend);
    }
    console.log(friend);
  }
})

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-connected', (name, friendId) => {
  friend = friendId;
  appendMessage(`${name} connected`)
})

socket.on('user-disconnected', name => {
  appendMessage(`${name} disconnected`)
})

function appendMessage(message) {
  const messageElement = document.createElement('div')
  messageElement.innerText = message
  messageContainer.append(messageElement)
}