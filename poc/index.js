const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new socketIO.Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
});

const groups = {}
function addToGroup(address, socket) {
  if (!groups[address]) groups[address] = []
  const group = groups[address]
  if (group.length) {
    for (const member of group) {
      member.emit('user-add', socket.id)
    }
  }
  group.push(socket)
}
function removeFromGroup(address, socket) {
  if (!groups[address]) return

  const group = groups[address]
  const i = group.indexOf(socket)
  if (i >= 0) {
    group.splice(i, 1)
  }

  if (!group.length) {
    delete groups[address]
  } else {
    for (const member of group) {
      member.emit('user-remove', socket.id)
    }
  }
}

io.on('connection', socket => {
  console.log(`[${socket.id}] Connected`);

  // Add user to group based on IP and send it the list
  const address = socket.handshake.address;
  addToGroup(address, socket);
  socket.emit('user-list', groups[address].map(member => member.id));

  socket.on('signal', ({ id, signal }) => {
    console.log(`[${socket.id}] Signal to ${id}`, signal);
    const group = groups[address] || []
    const target = group.find(member => member.id === id)
    if (target) {
      target.emit('signal', signal)
    } else {
      socket.emit('signal-error', 'target not found')
      return
    }
  })

  socket.on('disconnect', () => {
    console.log(`[${socket.id}] Disconnected`);
    removeFromGroup(address, socket)
  })
  socket.on('', () => { })
})

server.listen(3000, () => {
  console.log('listening on *:3000');
});