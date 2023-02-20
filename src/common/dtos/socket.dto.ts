import { IsString } from '@nestjs/class-validator';

export class SendMessage {
  @IsString()
  roomName: string;

  @IsString()
  content: string;
}

export class MakeOrJoinOrLeaveRoom {
  @IsString()
  roomName: string;
}
