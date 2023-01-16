import { IsString } from '@nestjs/class-validator';
import { Length } from '@nestjs/class-validator';

export class CreateUserDto {
  @IsString()
  @Length(4, 20)
  id: string;

  @IsString()
  @Length(8, 20)
  password: string;

  @IsString()
  @Length(2, 20)
  nickname: string;
}
