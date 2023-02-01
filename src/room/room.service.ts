import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RoomService {
  constructor(
    @InjectRedis('rooms')
    private readonly redis_rooms: Redis,
  ) {}

  async findAll() {
    const rooms = await this.redis_rooms.keys('*');
    return rooms;
  }
}
