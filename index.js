const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { requireAuth } = require("./middleware/verifyToken.js");
const http = require("http");
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);
const cors = require("cors");

//Swagger
const apiDocumentation = require("./apidocs.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(apiDocumentation));

//Socket Chat
const rooms = { };
const Message = require("./model/Message");

//Import Routes
const authRoute = require("./routes/auth");
const questionSetRoute = require("./routes/questionSet");
const questionRoute = require("./routes/question");
const historyRoute = require("./routes/history");
const userRoute = require("./routes/user");
const friendRoute = require("./routes/friend");
const messageRoute = require("./routes/message");
const roomRoute = require("./routes/room");

dotenv.config();

//Connect to DB
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () =>
	console.log("Connect to DB")
);

//Testing Purpose Only for Socket
app.set("view engine", "ejs");
app.get('/socket', (req, res) => {
  res.render('index', { rooms: rooms })
});

//Middleware
app.use(express.json());
app.use(cookieParser());

// CORS
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header(
		"Access-Control-Allow-Methods",
		"GET, POST, DELETE, UPDATE, PUT, OPTIONS"
	);
	next();
});

app.options("*", cors());

const whitelist = ["http://localhost:3000"];
const corsOptions = {
	origin: function (origin, callback) {
		if (whitelist.indexOf(origin) !== -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
};

app.use(cors(corsOptions));
// app.use(cors());

//Create Room with Socket
app.post('/room', (req, res) => {
  var roomId = makeid(5);
  if (rooms[roomId] != null) {
    return res.redirect('/')
  }
  rooms[roomId] = { users: {} }
  res.redirect(roomId)
  // Send message that new room was created
  io.emit('room-created', roomId)
});

app.get('/:room', (req, res) => {
  if (rooms[req.params.room] == null) {
    return res.redirect('/')
  }
  res.render('room', { roomName: req.params.room })
});

//Run Socket when a Client Connects
io.on('connection', socket => {

	socket.on('startIsClicked', (room, timer, query) => {
	  countdown(room, timer);
	  question(room, query);
	  io.to(room).emit('getRoomId', room)
	  io.to(room).emit('startIsClicked');
	});
  
	socket.on('nextRound', (room, timer) => {
	  countdown(room, timer);
	  io.to(room).emit('start-round');
	}) ;
  
	socket.on('keyIsPressed', (room, pos) => {
	  io.to(room).emit('keyIsPressed', pos);
	});;
  
	socket.on('giveScore', (room, score) => {
	  score += 1;
	  io.to(room).emit('giveScore', score);
	});
  
	socket.on('new-user', (room, name) => {
	  socket.join(room)
	  rooms[room].users[socket.id] = name
	  socket.to(room).emit('user-connected', name)
	});
  
	socket.on('send-chat-message', (room, msg) => {
	  const message = new Message({ 
		user: "61b2f68fef0cea950e40a4ca",
		friend: "61b2f6aaef0cea950e40a4ce",
        message: msg,
        roomID: "61b2f6f4ef0cea950e40a4d5"
	 });
	  message.save().then(() => {
		socket.to(room).emit('chat-message', { message: msg, name: rooms[room].users[socket.id] })
	  });
	});
  
	socket.on('disconnect', () => {
	  getUserRooms(socket).forEach(room => {
		socket.to(room).emit('user-disconnected', rooms[room].users[socket.id])
		delete rooms[room].users[socket.id]
	  });
	});
  
  });
  
  function getUserRooms(socket) {
	return Object.entries(rooms).reduce((names, [name, room]) => {
	  if (room.users[socket.id] != null) names.push(name)
	  return names
	}, [])
  };
  
  function question(room, query) {
	Msg.find(query).then(result => {
	  io.to(room).emit('question', result[0].msg)
	});
  };
  
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
  };
  
  function makeid(length) {
	var code           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
	   code += characters.charAt(Math.floor(Math.random() * charactersLength));
	};
	return code;
  };

//Route Middlewares
app.use("/api/auth", authRoute);
app.use("/api/questionset", requireAuth, questionSetRoute);
app.use("/api/question", requireAuth, questionRoute);
app.use("/api/history", requireAuth, historyRoute);
app.use("/api/uploads", express.static("uploads"));
app.use("/api/user", requireAuth, userRoute);
app.use("/api/friend", requireAuth, friendRoute);
app.use("/api/message", requireAuth, messageRoute);
app.use("/api/room", requireAuth, roomRoute);
app.use("/public", express.static('./public/'));

server.listen(process.env.PORT || 3000, () =>
	console.log("Server Up and Running")
);
