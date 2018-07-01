'use strict';

const EventEmitter = require('events');
const net = require('net');
const logger = require('./logger');
const Client = require('../model/user');

const PORT = process.env.PORT || 3000;

const server = net.createServer();
const event = new EventEmitter();
const clientPool = {};

const parseData = (buffer) => {
  const text = buffer.toString().trim();
  if (!text.startsWith('@')) return null;

  const [command, ...message] = text.split(' ');

  logger.log(logger.INFO, `THIS IS THE MESSAGE: ${command}`);
  logger.log(logger.INFO, `THIS IS THE MESSAGE: ${message}`);

  return { command, message };
};

const dispatchAction = (client, buffer) => {
  const entry = parseData(buffer);
  if (entry) event.emit(entry.command, entry, client);
};

// these are all the event listeners
event.on('@all', (data, client) => {
  logger.log(logger.INFO, data);
  data.message = data.message.join(' ');
  Object.keys(clientPool).forEach((clientIdKey) => {
    const targetedClient = clientPool[clientIdKey];
    targetedClient.socket.write(`<${client.nickname}>: ${data.message}\n`);
  });
});

event.on('@dm', (data, client) => {
  logger.log(logger.INFO, data);

  const targetNickname = data.message.shift();
  data.message = data.message.join(' ');


  Object.keys(clientPool).forEach((clientIdKey) => {
    const targetedClient = clientPool[clientIdKey];
    if (targetedClient.nickname[0] === targetNickname) {
      targetedClient.socket.write(`<${client.nickname}>: ${data.message}\n`);
    }
  });
});

event.on('@nickname', (data, client) => {
  logger.log(logger.INFO, data);
  clientPool[client._id].nickname = data.message;
  client.socket.write(`You have changed your client name to ${data.message}\n`);
});

event.on('@list', (data, client) => {
  logger.log(logger.INFO, data);
  Object.keys(clientPool).forEach((clientIdKey) => {
    client.socket.write(`${clientPool[clientIdKey].nickname}\n`);
  });
});

event.on('@quit', (data, client) => {
  logger.log(logger.INFO, data);
  delete clientPool[client._id];
  client.socket.destroy();
});

server.on('connection', (socket) => {
  const client = new Client(socket);

  socket.write(`Welcome to the chatroom, ${client.nickname}!\n`);
  clientPool[client._id] = client;
  logger.log(logger.INFO, `A new client ${client.nickname} has entered the chatroom!`);

  socket.on('data', (buffer) => {
    dispatchAction(client, buffer);
  });

  socket.on('close', () => {
    logger.log(logger.INFO, 'Client disconnected.');
  });

  socket.on('error', (err) => {
    logger.log(logger.INFO, err);
  });
});

server.listen(PORT, () => {
  logger.log(logger.INFO, `Server up on PORT: ${PORT}`);
});
