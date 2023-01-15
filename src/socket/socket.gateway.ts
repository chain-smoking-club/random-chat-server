import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({ transports: ['websocket'] })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}

  users = [];

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  async handleConnection(socket: Socket, ...args: any[]) {
    this.users.push(socket);
  }

  async handleDisconnect(socket: Socket): Promise<void> {}

  @SubscribeMessage('SEND_MESSAGE')
  async chat(socket: Socket, data) {
    this.server
      .to(this.users[this.users.length - 1])
      .emit('RECEIVE_MESSAGE', data);
  }
}
