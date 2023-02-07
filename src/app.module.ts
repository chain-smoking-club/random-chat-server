import { Module, ValidationPipe } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';

import { SocketModule } from './socket/socket.module';
import { UserModule } from './user/user.module';
import { User } from './common/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_DOCKER_PORT),
      username: 'root',
      password: '3565',
      database: 'random_chat_db',
      entities: [User],
      synchronize: true,
    }),
    RedisModule.forRoot({
      config: [
        {
          host: 'localhost',
          port: 16379,
          namespace: 'rooms',
          db: 0,
        },
        {
          host: 'localhost',
          port: 16379,
          namespace: 'socket_room',
          db: 1,
        },
      ],
    }),
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
  ],
})
export class AppModule {}
