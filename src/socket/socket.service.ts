import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { WsException, WsResponse } from '@nestjs/websockets';
import Redis from 'ioredis';
import { Socket } from 'socket.io';
import { ISocketResponse } from 'src/common/interfaces/socket.response.interface';
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

  async getEmailByAuthSocket(socket: Socket): Promise<string> {
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

    return tokenInfo.sub;
  }

  async makeRoom(
    socket: Socket,
    roomName: string,
  ): Promise<WsResponse<ISocketResponse>> {
    const isRoomExists = await this.redis_rooms.exists(roomName);
    if (isRoomExists) {
      const event = 'makeRoom';
      const data = {
        statusCode: 400,
        message: 'room already exists',
      };

      return {
        event,
        data,
      };
    }

    await this.redis_rooms.set(roomName, socket.id);
    socket.join(roomName);

    const event = 'makeRoom';
    const data = {
      statusCode: 200,
      message: 'room created successfully',
    };

    return {
      event,
      data,
    };
  }

  async joinRoom(
    socket: Socket,
    roomName: string,
  ): Promise<WsResponse<ISocketResponse>> {
    const isRoomExists = await this.redis_rooms.exists(roomName);
    if (!isRoomExists) {
      const event = 'joinRoom';
      const data = {
        statusCode: 400,
        message: 'room does not exist',
      };

      return {
        event,
        data,
      };
    }

    socket.join(roomName);

    const event = 'joinRoom';
    const data = {
      statusCode: 200,
      message: 'room joined successfully',
    };

    return {
      event,
      data,
    };
  }
}
