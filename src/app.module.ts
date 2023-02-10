import { Module, ValidationPipe } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { SocketModule } from './socket/socket.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { typeOrmConfigAsync } from './common/configs/typeorm.config';
import { redisConfigAsync } from './common/configs/redis.config';
import { AllExceptionFilter } from './common/filters/all-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    RedisModule.forRootAsync(redisConfigAsync),
    SocketModule,
    UserModule,
    AuthModule,
    RoomModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
})
export class AppModule {}
