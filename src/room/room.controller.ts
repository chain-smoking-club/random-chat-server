import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';
import { RoomService } from './room.service';

@Controller('api')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(JwtAuthGuard)
  @Get('rooms')
  async getRooms(@Req() req: Request, @Res() res: Response) {
    const data = await this.roomService.findAll();

    return res.status(200).json({
      result: true,
      data,
    });
  }
}
