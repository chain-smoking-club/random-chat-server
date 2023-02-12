import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { UserService } from './user.service';
import { CreateUserDto } from '../common/dtos/user.dto';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';

@Controller('api')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('users')
  async createUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: CreateUserDto,
  ) {
    const data = await this.userService.create(createDto);

    return res.status(200).json({
      result: true,
      data,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/info')
  async getUserInfo(@Req() req: Request, @Res() res: Response) {
    const user = await this.userService.findOneByEmail(req.user['email']);
    delete user.password;

    return res.status(200).json({
      result: true,
      data: user,
    });
  }
}
