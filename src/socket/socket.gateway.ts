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

import {
  MakeOrJoinOrLeaveRoom,
  RegisterUserName,
  SendMessage,
} from './socket.dto';

@WebSocketGateway({
  transports: ['websocket'],
  heartbeatInterval: 10000,
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    @InjectRedis('socket_user')
    private readonly redis_socket_user: Redis,

    @InjectRedis('socket_room')
    private readonly redis_socket_room: Redis,
  ) {}

  rooms: string[] = [];
  connectedUsers: string[] = [];

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('SocketGateway');

  afterInit(server: Server) {
    this.logger.log('Init SocketGateway');
  }

  async handleConnection(socket: Socket, ...args: any[]) {
    this.logger.log(`Client Connected : ${socket.id}`);
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    this.logger.log(`Client Disconnected : ${socket.id}`);
  }

  @SubscribeMessage('makeRoom')
  async makeRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: MakeOrJoinOrLeaveRoom,
  ) {
    if (this.rooms.includes(data.roomName)) {
      this.server.to(socket.id).emit('makeRoomResponse', {
        message: 'room already exists',
        roomName: data.roomName,
      });

      return;
    }

    this.rooms.push(data.roomName);
    socket.join(data.roomName);
    this.server.to(socket.id).emit('makeRoomResponse', {
      message: 'success',
      roomName: data.roomName,
    });

    this.logger.log(`Room ${data.roomName} created`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: MakeOrJoinOrLeaveRoom,
  ) {
    for (const room of this.rooms) {
      if (room === data.roomName) {
        this.rooms.splice(this.rooms.indexOf(room), 1);
        socket.join(data.roomName);

        this.server.to(socket.id).emit('joinRoomResponse', {
          message: 'success',
          roomName: data.roomName,
        });

        this.logger.log(`User joined room ${data.roomName}`);

        return;
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async chat(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: SendMessage,
  ) {
    this.server.to(data.roomName).emit('sendMessageResponse', {
      message: data.content,
      roomName: data.roomName,
    });

    this.logger.log(`Message sent to room ${data.roomName}`);
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: MakeOrJoinOrLeaveRoom,
  ) {
    socket.leave(data.roomName);

    this.logger.log(`User left room ${data.roomName}`);
  }

  @SubscribeMessage('getRooms')
  async getRooms(@ConnectedSocket() socket: Socket) {
    this.server.to(socket.id).emit('getRooms', {
      message: 'success',
      rooms: this.rooms,
    });

    this.logger.log(`Rooms sent to user ${socket.id}`);
  }
}
