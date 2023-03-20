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
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

import { WsValidationExceptionFilter } from '../common/filters/ws-validation-exception.filter';
import { MessageDto, RoomDto } from '../common/dtos/socket.dto';
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
  constructor(private readonly socketService: SocketService) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  afterInit() {
    this.logger.log('Init SocketGateway');
  }

  async handleConnection(socket: Socket) {
    try {
      await this.socketService.getNicknameByAuthSocket(socket);

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

  @SubscribeMessage('getRooms')
  getRooms() {
    const rooms = [];
    const socketMap = this.server.sockets.adapter.rooms;

    for (const key of socketMap.keys()) {
      if (key !== [...socketMap.get(key)][0]) {
        rooms.push(key);
      }
    }

    this.logger.log(`Rooms sent to client`);

    return this.server.emit('getRooms', rooms);
  }

  @SubscribeMessage('makeRoom')
  async makeRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: RoomDto,
  ) {
    const data = await this.socketService.makeRoom(socket, payload.roomName);
    const event = 'makeRoom';

    if (data.statusCode === 200) {
      this.logger.log(`Room created : ${payload.roomName}`);
      this.getRooms();
    }

    return { event, data };
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: RoomDto,
  ) {
    const event = 'joinRoom';
    const data = await this.socketService.joinRoom(socket, payload.roomName);

    this.logger.log(`User joined room ${payload.roomName}`);

    return { event, data };
  }

  @SubscribeMessage('sendMessage')
  async chat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MessageDto,
  ) {
    const nickname = await this.socketService.getNicknameByAuthSocket(socket);
    const roomName = [...socket.rooms][1];
    this.server.to(roomName).emit('receiveMessage', {
      nickname,
      content: payload.content,
    });

    const event = 'sendMessage';
    const data = {
      statusCode: 200,
      message: 'message sent successfully',
    };

    this.logger.log(`Message sent to room ${roomName}`);

    return { event, data };
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(@ConnectedSocket() socket: Socket) {
    const event = 'leaveRoom';
    const roomName = [...socket.rooms][1];
    if (!roomName) {
      const data = {
        statusCode: 400,
        message: 'you are not in any room',
      };

      return { event, data };
    }

    socket.leave(roomName);
    const data = {
      statusCode: 200,
      message: `you left room ${roomName}`,
    };

    this.logger.log(`User left room ${roomName}`);

    return { event, data };
  }
}
