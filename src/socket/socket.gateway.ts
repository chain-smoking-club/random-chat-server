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
      const event = 'makeRoom';
      const data = {
        statusCode: 400,
        message: 'room already exists',
      };
      this.logger.log(
        `Client: ${socket.id} tried to create room: ${payload.roomName} but it already exists`,
      );
      return {
        event,
        data,
      };
    }

    await this.redis_rooms.set(payload.roomName, socket.id);
    await this.redis_socket_room.set(socket.id, payload.roomName);

    socket.join(payload.roomName);

    const event = 'makeRoom';
    const data = {
      statusCode: 200,
      message: 'room created successfully',
    };

    this.logger.log(`Client: ${socket.id} created room: ${payload.roomName}`);

    return {
      event,
      data,
    };
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    const isRoomExists = await this.redis_rooms.exists(payload.roomName);
    if (!isRoomExists) {
      const event = 'joinRoom';
      const data = {
        statusCode: 400,
        message: 'room does not exist',
      };

      this.logger.log(
        `Client: ${socket.id} tried to join room: ${payload.roomName} but it does not exist`,
      );

      return {
        event,
        data,
      };
    }

    await this.redis_socket_room.set(socket.id, payload.roomName);

    socket.join(payload.roomName);

    const event = 'joinRoom';
    const data = {
      statusCode: 200,
      message: 'room joined successfully',
    };

    this.logger.log(`Client: ${socket.id} joined room: ${payload.roomName}`);

    return {
      event,
      data,
    };
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
    await this.redis_socket_room.del(socket.id);

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
