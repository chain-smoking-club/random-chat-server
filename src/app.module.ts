import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SocketModule } from './socket/socket.module';
import { UserModule } from './user/user.module';
import { User } from './common/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 13306,
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
})
export class AppModule {}
