'use strict';
const EventEmitter = require('events');
const net = require('net');
const logger = require('./logger');
const User = require('./../model/user');

const PORT = process.env.PORT || 3000;

const server = net.createServer();
const event = new EventEmitter();
const socketPool = {};

const parseData = (buffer) => { //  parsing our binary data
  let text = buffer.toString().trim();
  if (!text.startsWith('@')) {
    return null;
  }

  text = text.split(' '); //  creates new array similar to ['command', 'message']

  const [command] = text; //  this selects the first element in our above array that is commented

  const message = text.slice(1).join(' ');

  logger.log(logger.INFO, `${command}`);
  logger.log(logger.INFO, `THIS IS THE MESSAGE: ${message}`);

  return {
    command,
    message,
  };
};


const dispatchAction = (user, buffer) => {
  const entry = parseData(buffer); // entry is our parsed data
  if(entry) {
    event.emit(entry.command, entry, user); // if there's an entry then we emit the command, the entry, and the user who we are typing to
  }
};

//  event listeners

event.on('@all', (data, user) => {
  logger.log(logger.INFO, data);
  Object.keys(socketPool).forEach((userIdKey) => {
    const targetedUser = socketPool[userIdKey];
    targetedUser.socket.write(`<${user.nickname}>: ${data.message}`);
  });
});

event.on('@list', (data, user) => {
  logger.log(logger.INFO, data);
  Object.keys(socketPool).forEach((userIdKey) => {
    user.socket.write(`${socketPool[userIdKey].nickname}\n`);
  });
});

event.on('@nickname', (data, user) => {
  logger.log(logger.INFO, data);
  socketPool[user._id].nickname = data.message;
  user.socket.write(`You have changed your username to ${data.message}\n`)
  });
});

event.on('@dm <to-username> <message>', (data, user) => {
  logger.log(logger.INFO, data);
  Object.keys(socketPool).forEach((userIdKey) => {
    const targetedUser = socketPool[userIdKey];
    targetedUser.socket.write(`<${user.nickname}>: ${data.message}`);
  });
});

server.on('connection', (socket) => {
  const user = new User(socket);
  socket.write(`Welcome to the chatroom, ${user.nickname}!\n`);
  socketPool[user._id] = user;
  logger.log(logger.INFO, `A new user ${user.nickname} has entered the chatroom!`);

  socket.on('data', (buffer) => {
    dispatchAction(user, buffer);
  });
});

server.listen(PORT, () => {
  logger.log(logger.INFO, `Server up on PORT: ${PORT}`);
});








