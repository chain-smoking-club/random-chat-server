import { InjectRedis } from '@liaoliaots/nestjs-redis/dist/redis/common';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Redis } from 'ioredis';
import { Socket, Server } from 'socket.io';
import { RegisterUserName, SendMessage } from './socket.dto';

@WebSocketGateway({
  transports: ['websocket'],
  heartbeatInterval: 10000,
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectRedis('user_socket')
    private readonly redis_user_socket: Redis,

    @InjectRedis('socket_user')
    private readonly redis_socket_user: Redis,
  ) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  async handleConnection(socket: Socket, ...args: any[]) {
    this.logger.log(`Client Connected : ${socket.id}`);
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    this.logger.log(`Client Disconnected : ${socket.id}`);
  }

  @SubscribeMessage('REGISTER_USER_NAME')
  async registerUserName(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: RegisterUserName,
  ) {
    await this.redis_socket_user.set(socket.id, data.userName);
    await this.redis_user_socket.set(data.userName, socket.id);
  }

  @SubscribeMessage('MATCH')
  async match(@ConnectedSocket() socket: Socket) {}

  @SubscribeMessage('SEND_MESSAGE')
  async chat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: SendMessage,
  ) {
    this.server.emit('RECEIVE_MESSAGE', data);
  }
}
