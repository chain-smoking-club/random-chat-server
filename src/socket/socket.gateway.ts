import { InjectRedis } from '@liaoliaots/nestjs-redis/dist/redis/common';
import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { UseFilters } from '@nestjs/common/decorators';
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

import { HttpExceptionFilter } from '../common/filters/http.exception.filter';
import { AuthService } from '../auth/auth.service';
import { MakeOrJoinOrLeaveRoom, SendMessage } from '../common/dtos/socket.dto';

@WebSocketGateway({
  transports: ['websocket'],
  heartbeatInterval: 10000,
})
@UseFilters(HttpExceptionFilter)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectRedis('rooms')
    private readonly redis_rooms: Redis,

    @InjectRedis('socket_room')
    private readonly redis_socket_room: Redis,

    @InjectRedis('access_token')
    private readonly redis_access_token: Redis,

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
      const token = socket.handshake.headers.authorization.replace(
        'Bearer ',
        '',
      );
      const payload = await this.authService.validateToken(token);
      const accessTokenInRedis = await this.redis_access_token.get(payload.sub);

      if (accessTokenInRedis !== token) {
        throw new Error('Unauthorized');
      }

      this.logger.log(`Client Connected : ${socket.id}`);
    } catch (error) {
      this.logger.error(error);
      socket.emit('error', 'Unauthorized');
      socket.disconnect();
      return;
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    this.logger.log(`Client Disconnected : ${socket.id}`);
  }

  @SubscribeMessage('makeRoom')
  async makeRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: MakeOrJoinOrLeaveRoom,
  ) {
    const isRoomExists = await this.redis_rooms.exists(data.roomName);
    if (isRoomExists) {
      this.server.to(socket.id).emit('makeRoomResponse', {
        isSuccess: false,
        message: 'room already exists',
        roomName: data.roomName,
      });

      return;
    }

    await this.redis_rooms.set(data.roomName, 0);
    await this.redis_socket_room.set(socket.id, data.roomName);

    socket.join(data.roomName);
    this.server.to(socket.id).emit('makeRoomResponse', {
      isSuccess: true,
      message: 'room created successfully',
      roomName: data.roomName,
    });

    this.logger.log(`Client: ${socket.id} created room: ${data.roomName}`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: MakeOrJoinOrLeaveRoom,
  ) {
    const isRoomExists = await this.redis_rooms.exists(data.roomName);
    if (!isRoomExists) {
      this.server.to(socket.id).emit('joinRoomResponse', {
        isSuccess: false,
        message: 'room does not exist',
        roomName: data.roomName,
      });

      return;
    }

    await this.redis_socket_room.set(socket.id, data.roomName);
    socket.join(data.roomName);
    this.server.to(socket.id).emit('joinRoomResponse', {
      isSuccess: true,
      message: 'joined room successfully',
      roomName: data.roomName,
    });

    this.logger.log(`Client: ${socket.id} joined room: ${data.roomName}`);
  }

  @SubscribeMessage('sendMessage')
  async chat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: SendMessage,
  ) {
    this.server.to(data.roomName).emit('sendMessageResponse', {
      isSuccess: true,
    });

    this.server.to(data.roomName).emit('receiveMessage', {
      content: data.content,
    });

    this.logger.log(`Message sent to room ${data.roomName}`);
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: MakeOrJoinOrLeaveRoom,
  ) {
    this.server.to(data.roomName).emit('leaveRoomResponse', {
      isSuccess: true,
    });

    socket.leave(data.roomName);

    this.logger.log(`User left room ${data.roomName}`);
  }
}
