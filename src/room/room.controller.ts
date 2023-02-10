import { Controller, Delete, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';

import { RoomService } from './room.service';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';

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

  // TODO: 추후 삭제될 API
  @UseGuards(JwtAuthGuard)
  @Delete('rooms')
  async deleteRooms(@Req() req: Request, @Res() res: Response) {
    const data = await this.roomService.deleteAll();

    return res.status(200).json({
      result: true,
      data,
    });
  }
}
