import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { UserModule } from './user/user.module';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 23306,
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
          port: 26379,
          namespace: 'user_socket',
          db: 1,
        },
        {
          host: 'localhost',
          port: 26379,
          namespace: 'socket_user',
          db: 2,
        },
      ],
    }),

    SocketModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
