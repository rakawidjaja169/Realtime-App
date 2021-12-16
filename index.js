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
const User = require("./model/User");

//Google Auth
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Passport config
require('./config/passport')(passport);

app.use(
	session({
		secret: 'keyboard cat',
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({ mongoUrl: process.env.DB_CONNECT }),
	})
);

//Swagger
const apiDocumentation = require("./apidocs.json");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(apiDocumentation));

//Socket Chat
const rooms = {};
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
const gameRoomRoute = require("./routes/gameRoom");

dotenv.config();

//Connect to DB
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true }, () =>
	console.log("Connect to DB")
);

//Testing Purpose Only for Socket
app.set("view engine", "ejs");
app.get("/socket", (req, res) => {
	res.render("index", { rooms: rooms });
});

//Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

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

const whitelist = [
	"http://localhost:3000",
	"https://stadious-frontend.herokuapp.com/",
];
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
app.post("/room", (req, res) => {
	if (rooms[req.body.room] != null) {
		return res.redirect('/')
	}
	rooms[req.body.room] = { users: {} }
	res.redirect(req.body.room)
	// Send message that new room was created
	io.emit('room-created', req.body.room)
});

app.get("/:room", (req, res) => {
	if (rooms[req.params.room] == null) {
		return res.redirect("/");
	}
	res.render("room", { roomName: req.params.room });
});

//Run Socket when a Client Connects
io.on("connection", (socket) => {

	socket.on("new-user", (room, name) => {
		socket.join(room);
		User.findOne({ _id: name }).then(result => {
			rooms[room].users[socket.id] = result.name;
			socket.to(room).emit("user-connected", result.name, name);
		});
	});

	socket.on("get-info", room => {
		socket.to(room).emit("get-friend");
		var query = { roomID: room };
		Message.find(query).then(result => {
			if (result.length) {
				result.forEach(message => {
					User.findOne({ _id: message.user }).then(name => {
						socket.emit("chat-message", {
							message: message.message,
							name: name.name
						});
					});
				});
			};
		});
	});

	socket.on("friend-id", (room, friendId) => {
		//To room nya juga cacat
		io.emit("friend-id", room, friendId);
	});

	socket.on("send-chat-message", (room, msg, id, friend) => {
		const message = new Message({
			user: id,
			friend: friend,
			message: msg,
			roomID: room,
		});
		message.save().then(() => {
			socket.to(room).emit("chat-message", {
				message: msg,
				name: rooms[room].users[socket.id],
			});
		});
	});

	socket.on("disconnect", () => {
		getUserRooms(socket).forEach((room) => {
			socket.to(room).emit("user-disconnected", rooms[room].users[socket.id]);
			delete rooms[room].users[socket.id];
		});
	});

});

function getUserRooms(socket) {
	return Object.entries(rooms).reduce((names, [name, room]) => {
		if (room.users[socket.id] != null) names.push(name);
		return names;
	}, []);
}

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
app.use("/api/gameroom", requireAuth, gameRoomRoute);
app.use("/public", express.static("./public/"));

//Testing Google Auth
app.use(require("./routes/googleindex"))
app.use('/auth', require('./routes/googleauth'))

server.listen(process.env.PORT || 3000, () =>
	console.log("Server Up and Running")
);
