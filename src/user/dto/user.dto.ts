import { IsEmail, IsEmpty, IsString } from '@nestjs/class-validator';
import { Length } from '@nestjs/class-validator';

export class CreateUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 20)
  password: string;

  @IsString()
  @Length(2, 20)
  nickname: string;
}
