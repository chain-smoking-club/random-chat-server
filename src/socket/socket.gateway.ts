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

  @SubscribeMessage('makeRoom')
  async makeRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    const data = await this.socketService.makeRoom(socket, payload.roomName);
    return data;
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    const data = await this.socketService.joinRoom(socket, payload.roomName);
    return data;
  }

  @SubscribeMessage('sendMessage')
  async chat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessage,
  ) {
    this.server.to(payload.roomName).emit('receiveMessage', {
      content: payload.content,
    });

    const data = {
      statusCode: 200,
      message: 'message sent successfully',
    };

    this.logger.log(`Message sent to room ${payload.roomName}`);

    return data;
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MakeOrJoinOrLeaveRoom,
  ) {
    socket.leave(payload.roomName);

    const data = {
      statusCode: 200,
      message: 'room left successfully',
    };

    this.logger.log(`User left room ${payload.roomName}`);

    return data;
  }
}
