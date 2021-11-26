const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const mongoose = require('mongoose');
const Msg = require('./models/messages');
const mongoDB = 'mongodb+srv://deved:bolehlah@cluster0.ff26a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('connected')
}).catch(err => console.log(err))

app.set('views', './views')
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

const rooms = { }

app.get('/', (req, res) => {
  res.render('index', { rooms: rooms })
})

app.post('/room', (req, res) => {
  var roomId = makeid(5);
  if (rooms[roomId] != null) {
    return res.redirect('/')
  }
  rooms[roomId] = { users: {} }
  res.redirect(roomId)
  // Send message that new room was created
  io.emit('room-created', roomId)
})

app.get('/:room', (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  res.render('room', { roomName: req.params.room })
})

server.listen(3000)

io.on('connection', socket => {

  socket.on('startIsClicked', (room, timer, query) => {
    countdown(room, timer);
    question(room, query);
    io.to(room).emit('getRoomId', room)
    io.to(room).emit('startIsClicked');
  })

  socket.on('nextRound', (room, timer) => {
    countdown(room, timer);
    io.to(room).emit('start-round');
  }) 

  socket.on('keyIsPressed', (room, pos) => {
    io.to(room).emit('keyIsPressed', pos);
  });

  socket.on('giveScore', (room, score) => {
    score += 1;
    io.to(room).emit('giveScore', score);
  });

  socket.on('new-user', (room, name) => {
    socket.join(room)
    rooms[room].users[socket.id] = name
    socket.to(room).broadcast.emit('user-connected', name)
  })

  socket.on('send-chat-message', (room, msg) => {
    const message = new Msg({ msg });
    message.save().then(() => {
      socket.to(room).broadcast.emit('chat-message', { message: msg, name: rooms[room].users[socket.id] })
    })
  })

  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
  })

})

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name)
    return names
  }, [])
}

function question(room, query) {
  Msg.find(query).then(result => {
    io.to(room).emit('question', result[0].msg)
  })
}

function countdown(room, timer) {
  var active = true;
  var timeleft = timer;
  var downloadTimer = setInterval(function(){
    io.to(room).emit ('countdown', timeleft);
    timeleft -= 1;
    if (active == true && timeleft < 0) {
      active = false
      io.to(room).emit ('end-round');
    }
  }, 1000);
}

function makeid(length) {
  var code           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return code;
}