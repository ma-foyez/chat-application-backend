const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors")
const port = 5000;
const { addUser, removeUser, getUserById, getRoomUsers } = require('./users')
const app = express();
app.use(cors())
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) {
      callback(error)
    }
    socket.join(room);
    socket.emit('message', { user: "Admin", text: `welcome ${name} to ${room} group chat` })
    socket.broadcast.to(room).emit('message', {
      user: "Admin",
      text: `${name} just joined to ${room} group chat`
    })
    const roomUser = getRoomUsers(room);
    io.to(room).emit('userList', { roomUser });
    callback();
  })

  //sent everyone with separate group or room

  //message 
  socket.on('message', (message) => {
    const user = getUserById(socket.id);
    io.to(user.room).emit('message', {
      user: user.name,
      text: message
    })

  })

  //disconnect socket io
  socket.on('disconnect', () => {
    console.log('user disconneted :>> ', socket.id);
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('message', {
        user: "Admin",
        text: `${user.name} just left from ${user.room} group chat`
      })
      const roomUser = getRoomUsers(user.room);
      io.to(user.room).emit('userList', { roomUser });
    }

  })
});

app.get('/', (req, res) => {
  res.send("server is up and running");
})

server.listen(port, () => console.log(`Server has started on  port ${port}`));
