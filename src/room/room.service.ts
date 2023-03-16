import Redis from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomService {
  constructor(
    @InjectRedis('rooms')
    private readonly redis_rooms: Redis,
  ) {}

  async findAll(): Promise<string[]> {
    const rooms = await this.redis_rooms.keys('*');
    return rooms;
  }

  async deleteAll(): Promise<string[]> {
    const rooms = await this.redis_rooms.keys('*');
    const pipeline = this.redis_rooms.pipeline();
    rooms.forEach((room) => {
      pipeline.del(room);
    });
    await pipeline.exec();
    return rooms;
  }
}
