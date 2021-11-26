const socket = io('http://localhost:3000')
const messageContainer = document.getElementById('message-container')
const roomContainer = document.getElementById('room-container')
const messageForm = document.getElementById('send-container')
const messageInput = document.getElementById('message-input')

const BG_COLOUR = '#00FF00';
const BG_COLOUR2 = '#FF0000';

var canvas;
var ctx;

var timer = 30;

var player;

var leftPaddleY = 190;
var leftPaddleX = 200;
const PADDLE_HEIGHT = 50;
const PADDLE_WIDTH = 50;

var player1Score = 0;
var player2Score = 0;
const WINNING_SCORE = 11;

var pos = "true";

var query = { msg: "Siapa anda?"};

startButton.addEventListener('click', () => {
  socket.emit('startIsClicked', roomName, timer, query);
});

score1.addEventListener('click', () => {
  socket.emit('giveScore', roomName, player1Score);
});

nextRound.addEventListener('click', () => {
  socket.emit('nextRound', roomName, timer);
});

socket.on('getRoomId', roomId => {
  showRoomId(roomId);
}) 

socket.on('startIsClicked', () => {
  init();
});

socket.on('start-round', () => {
  startRound();
})

socket.on('keyIsPressed', pos => {
  moveObject(pos);
});

socket.on('countdown', timeleft => {
  countdown(timeleft);
});

socket.on('giveScore', score => {
  player1Score = score;
});

socket.on('end-round', () => {
  endRound();
});

socket.on('question', question => {
  showQuestion(question);
})

function showRoomId(room) {
  document.getElementById("roomId").innerHTML = room;
}

function showQuestion(question) {
  document.getElementById("question").innerHTML = question;
}

function startRound() {
  canvas.style.display = "block";
  leaderCanvas.style.display = "none";
  header.style.display = "block";
}

function endRound() {
  canvas.style.display = "none";
  leaderCanvas.style.display = "block";
  header.style.display = "none";
  document.getElementById("leaderboard").innerHTML = player + " " + player1Score;
}

function moveObject(pos) {
  if(pos == "true") {
    leftPaddleX = 200;
  } else {
    leftPaddleX = 700;
  }
}

function countdown(timeleft) {
  if(timeleft >= 0){
    document.getElementById("timer").innerHTML = timeleft ;
  }
}

function init() {
  startButton.style.display = "none";
  leaderCanvas.style.display = "none";

  canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	
	var framePerSecond = 60;
	setInterval(main, 1000/framePerSecond);
	
	document.addEventListener('keydown',
    function onkeydown(e) {
      if(e.keyCode==39) {pos = "false"} //right arrow
      else if(e.keyCode==37) {pos = "true"} //left arrow
      else if(e.keyCode==38) {leftPaddleY-=10;} //up arrow
      else if(e.keyCode==40) {leftPaddleY+=10;} //down arrow

      socket.emit('keyIsPressed', roomName, pos);
    }
  );
}

function main() {
	drawEverything();
}

function drawEverything() {

  //True Canvas
	colorRect(0, 0, canvas.width/2, canvas.height, BG_COLOUR);

  //False Canvas
	colorRect(canvas.width/2, 0, canvas.width/2, canvas.height, BG_COLOUR2);

	//Left Paddle
	colorRect(leftPaddleX, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT, 'black');
	
	//Line
	colorRect(canvas.width/2, 0, 6, 800, 'white');
	
	//Score
	ctx.fillText(player1Score, 300, 100);
	ctx.fillText(player2Score, (canvas.width/2)+100, 100);

}

function colorRect(x, y, width, height, drawColor) {
	ctx.fillStyle = drawColor;
	ctx.fillRect(x, y, width, height);
}

if (messageForm != null) {
  const name = prompt('What is your name?')
  player = name;
  appendMessage('You joined')
  socket.emit('new-user', roomName, name)

  messageForm.addEventListener('submit', e => {
    e.preventDefault()
    const message = messageInput.value
    appendMessage(`You: ${message}`)
    socket.emit('send-chat-message', roomName, message)
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

socket.on('chat-message', data => {
  appendMessage(`${data.name}: ${data.message}`)
})

socket.on('user-connected', name => {
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