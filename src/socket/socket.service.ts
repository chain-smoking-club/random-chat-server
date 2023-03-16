import { Redis } from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { WsException, WsResponse } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { ISocketResponse } from '../common/interfaces/socket.response.interface';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SocketService {
  constructor(
    @InjectRedis('rooms')
    private readonly redis_rooms: Redis,

    @InjectRedis('access_token')
    private readonly redis_access_token: Redis,

    private readonly authService: AuthService,
  ) {}

  async getNicknameByAuthSocket(socket: Socket): Promise<string> {
    let token: string;

    if (socket.handshake.auth.token) {
      token = socket.handshake.auth.token;
    } else {
      token = socket.handshake.query.token as string;
    }

    token = token.replace('Bearer ', '');
    const tokenInfo = await this.authService.validateToken(token);
    const accessTokenInRedis = await this.redis_access_token.get(tokenInfo.sub);

    if (accessTokenInRedis !== token) {
      throw new WsException('Unauthorized');
    }

    return tokenInfo.nickname;
  }

  async makeRoom(socket: Socket, roomName: string): Promise<ISocketResponse> {
    const isRoomExists = await this.redis_rooms.exists(roomName);
    if (isRoomExists) {
      const data = {
        statusCode: 400,
        message: 'room already exists',
      };

      return data;
    }

    await this.redis_rooms.set(roomName, socket.id);
    socket.join(roomName);

    const data = {
      statusCode: 200,
      message: 'room created successfully',
    };

    return data;
  }

  async joinRoom(socket: Socket, roomName: string): Promise<ISocketResponse> {
    const isRoomExists = await this.redis_rooms.exists(roomName);
    if (!isRoomExists) {
      const data = {
        statusCode: 400,
        message: 'room does not exist',
      };

      return data;
    }

    socket.join(roomName);

    const data = {
      statusCode: 200,
      message: 'room joined successfully',
    };

    return data;
  }
}
