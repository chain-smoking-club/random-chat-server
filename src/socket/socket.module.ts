import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [AuthModule],
  providers: [SocketGateway],
})
export class SocketModule {}
