Create a TCP (transmission control protocol) chatroom
- Clients should be able to connect to the chatroom through telnet
- Clients should be able to run special commands to: 
  - exit the chatroom
  - list all users
  - reset their nickname
  - send direct messages

MVP
- create a TCP server using NODEJS net module
- create a Client constructor that models an individual connection
- Each client instance should contain (at least) an _id, nickname, and socket properties
- Clients should be able to send messages to all other clients through sending to the server
- Clients should be able to run special commands:
  - @quit to disconnect
  - @list to list all connected users
  - @nickname <new-name> to change their nickname
  - @dm <to-username> <message> to send a message directly to another user by their nickname

Conencted clients should be maintained in an in-memory collection called the `clientPool`
- When a socket emits the `close` event, the socket should be removed from the client pool
- When a socket emits the `error` event the error should be logged on the server
- When a socket emits the `data` event, the data should be logged on the server and the above commands should be implemented