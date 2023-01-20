import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketModule } from './socket/socket.module';
import { UserModule } from './user/user.module';
import { User } from './entity/user.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 13306,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
