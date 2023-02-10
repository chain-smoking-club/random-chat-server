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
      const tokenInfo = await this.authService.validateToken(token);
      const accessTokenInRedis = await this.redis_access_token.get(
        tokenInfo.sub,
      );

      if (accessTokenInRedis !== token) {
        throw new WsException('Unauthorized');
      }

      this.logger.log(`Client Connected : ${socket.id}`);
    } catch (error) {
      socket.emit('error', error.message);
      socket.disconnect();
      this.logger.error(error);
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    this.logger.log(`Client Disconnected : ${socket.id}`);
  }

  @SubscribeMessage('makeRoom')
  async makeRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ): Promise<WsResponse<unknown>> {
    const isRoomExists = await this.redis_rooms.exists(payload.roomName);
    if (isRoomExists) {
      this.server.to(socket.id).emit('makeRoomResponse', {
        isSuccess: false,
        message: 'room already exists',
        roomName: payload.roomName,
      });

      return;
    }

    await this.redis_rooms.set(payload.roomName, 0);
    await this.redis_socket_room.set(socket.id, payload.roomName);

    socket.join(payload.roomName);
    const event = 'makeRoom';
    const data = {
      isSuccess: true,
      message: 'room created successfully',
      roomName: payload.roomName,
    };
    return {
      event,
      data,
    };

    // this.server.to(socket.id).emit('makeRoomResponse', {
    //   isSuccess: true,
    //   message: 'room created successfully',
    //   roomName: payload.roomName,
    // });

    this.logger.log(`Client: ${socket.id} created room: ${payload.roomName}`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    const isRoomExists = await this.redis_rooms.exists(payload.roomName);
    if (!isRoomExists) {
      this.server.to(socket.id).emit('joinRoomResponse', {
        isSuccess: false,
        message: 'room does not exist',
        roomName: payload.roomName,
      });

      return;
    }

    await this.redis_socket_room.set(socket.id, payload.roomName);
    socket.join(payload.roomName);
    this.server.to(socket.id).emit('joinRoomResponse', {
      isSuccess: true,
      message: 'joined room successfully',
      roomName: payload.roomName,
    });

    this.logger.log(`Client: ${socket.id} joined room: ${payload.roomName}`);
  }

  @SubscribeMessage('sendMessage')
  async chat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessage,
  ) {
    this.server.to(payload.roomName).emit('sendMessageResponse', {
      isSuccess: true,
    });

    this.server.to(payload.roomName).emit('receiveMessage', {
      content: payload.content,
    });

    this.logger.log(`Message sent to room ${payload.roomName}`);
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    this.server.to(payload.roomName).emit('leaveRoomResponse', {
      isSuccess: true,
    });

    socket.leave(payload.roomName);

    this.logger.log(`User left room ${payload.roomName}`);
  }
}
