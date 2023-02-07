import * as bcrypt from 'bcrypt';
import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { UserService } from './user.service';
import { CreateUserDto } from '../common/dtos/user.dto';

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
    const user = await this.userService.create(createDto);
    delete user.password;
    return res.status(200).json(user);
  }
}
