import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SocketModule } from './socket/socket.module';
import { UserModule } from './user/user.module';
import { User } from './entity/user.entity';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_DOCKER_PORT,
      username: 'root',
      password: '3565',
      database: 'random_chat',
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
          namespace: 'socket_user',
          db: 1,
        },
        {
          host: 'localhost',
          port: 16379,
          namespace: 'socket_room',
          db: 2,
        },
      ],
    }),
    SocketModule,
    UserModule,
    AuthModule,
    RoomModule,
  ],
})
export class AppModule {}
