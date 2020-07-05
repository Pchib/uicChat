const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser= require('body-parser')
const http = require ('http')
const socketio = require('socket.io')
const port = process.env.PORT|| 5000;



const router = require('./router')
const {adduser, removeUser, getUser,getUserInRoom} = require('./user')



app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
const server = http.createServer(app)
const io = socketio(server)

if(process.env.NODE_ENV ==='production'){
    app.use(express.static('client/build'));
    app.get('*',(req, res)=>{
      res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    })
  }
  app.use(router)
//  io.set('transports', ['polling'])
//  app.all('/', (req,res)=>{
//   res.header("Access-Control-Allow-Origin","*");
//   res.header("Access-Control-Allow-Origin","X-Requested-With");
//  })
io.on('connection',(socket)=>{
console.log('NEW CONNECTION');
socket.on('join',({name,room}, callback)=>{

  const {error, user} = adduser({id : socket.id , name, room})
  if (error) return callback(error)

  socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`})
  socket.broadcast.to(user.room).emit('message',{user: 'admin', text : `${user.name}, has joined`})
  socket.join(user.room);
  io.to(user.room).emit('roomEData',{room: user.room, users: getUserInRoom(user.room)})

  callback()

})
socket.on('sendMessage', (message, callback)=>{
 const user = getUser (socket.id);
 io.to(user.room ).emit('message', {user : user.name, text: message })
 io.to(user.room ).emit('roomData', {room : user.name, users: getUserInRoom(user.room) })
 
 callback()
})

socket.on('disconnect',()=>{
 const user = removeUser(socket.id)    
 if (user){
   io.to(user.room).emit('message',{usesr:'admin', text:`${user.name} has left` })
 }
})
})





server.listen(port, () => console.log(`Example app listening on port${port} !`))