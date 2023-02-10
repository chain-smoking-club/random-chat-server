import { InjectRedis } from '@liaoliaots/nestjs-redis/dist/redis/common';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  WsResponse,
} from '@nestjs/websockets';
import { Redis } from 'ioredis';
import { Socket, Server } from 'socket.io';

import { WsValidationExceptionFilter } from '../common/filters/ws-validation-exception.filter';
import { AuthService } from '../auth/auth.service';
import { MakeOrJoinOrLeaveRoom, SendMessage } from '../common/dtos/socket.dto';
import { SocketService } from './socket.service';

@WebSocketGateway({
  transports: ['websocket'],
  heartbeatInterval: 10000,
})
@UseFilters(new WsValidationExceptionFilter())
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectRedis('rooms')
    private readonly redis_rooms: Redis,

    @InjectRedis('access_token')
    private readonly redis_access_token: Redis,

    private readonly socketService: SocketService,
    private readonly authService: AuthService,
  ) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  afterInit(server: Server) {
    this.logger.log('Init SocketGateway');
  }

  async handleConnection(socket: Socket, ...args: any[]) {
    try {
      await this.socketService.getEmailByAuthSocket(socket);

      this.logger.log(`Client Connected : ${socket.id}`);
    } catch (error) {
      socket.emit('error', error.message);
      socket.disconnect();
      this.logger.error(error);
    }
  }

  async handleDisconnect(socket: Socket) {
    this.logger.log(`Client Disconnected : ${socket.id}`);
  }

  @SubscribeMessage('makeRoom')
  async makeRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    return await this.socketService.makeRoom(socket, payload.roomName);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    return await this.socketService.joinRoom(socket, payload.roomName);
  }

  @SubscribeMessage('sendMessage')
  async chat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessage,
  ) {
    this.server.to(payload.roomName).emit('receiveMessage', {
      content: payload.content,
    });

    const event = 'sendMessage';
    const data = {
      statusCode: 200,
      message: 'message sent successfully',
    };

    this.logger.log(`Message sent to room ${payload.roomName}`);

    return {
      event,
      data,
    };
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    socket.leave(payload.roomName);

    const event = 'leaveRoom';
    const data = {
      statusCode: 200,
      message: 'room left successfully',
    };

    this.logger.log(`User left room ${payload.roomName}`);

    return {
      event,
      data,
    };
  }
}
