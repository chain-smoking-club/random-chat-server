import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { Request, Response } from 'express';
import { CreateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Controller('api')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('users')
  async createUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: CreateUserDto,
  ) {
    createDto.password = await bcrypt.hash(createDto.password, 10);
    const user = await this.userService.createUser(createDto);
    return res.status(201).json(user);
  }
}
