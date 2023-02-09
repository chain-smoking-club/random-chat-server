import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from '../common/dtos/auth.dto';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body() loginDto: LoginDto,
  ) {
    const data = await this.authService.login(req.user['email']);

    return res.status(200).json({
      result: true,
      data,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('auth/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.logout(req.user['email']);

    return res.status(200).json({ result });
  }
}
