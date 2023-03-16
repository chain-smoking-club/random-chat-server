import { IsString } from '@nestjs/class-validator';

export class MessageDto {
  @IsString()
  content: string;
}

export class RoomDto {
  @IsString()
  roomName: string;
}

export interface ISocketResponse {
  statusCode: number;
  message: string;
}
