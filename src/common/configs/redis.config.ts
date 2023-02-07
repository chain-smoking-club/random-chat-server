import {
  RedisModuleAsyncOptions,
  RedisModuleOptions,
} from '@liaoliaots/nestjs-redis';
import { ConfigService } from '@nestjs/config';

export class RedisConfig {
  static getRedisConfig(configService: ConfigService): RedisModuleOptions {
    return {
      config: [
        {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_DOCKER_PORT'),
          namespace: 'rooms',
          db: 0,
        },
        {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_DOCKER_PORT'),
          namespace: 'socket_room',
          db: 1,
        },
      ],
    };
  }
}

export const redisConfigAsync: RedisModuleAsyncOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<RedisModuleOptions> => RedisConfig.getRedisConfig(configService),
  inject: [ConfigService],
};
