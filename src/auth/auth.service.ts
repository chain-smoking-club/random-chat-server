import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { ConfigService } from '@nestjs/config';

import { UserService } from '../user/user.service';
import { User } from '../common/entities/user.entity';
import { IPayload } from '../common/interfaces/payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRedis('access_token')
    private readonly redis_access_token: Redis,

    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findOneByEmail(email);

    if (user && bcrypt.compareSync(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(email: string): Promise<any> {
    const payload = { sub: email };
    const options = {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    };
    const access_token = this.jwtService.sign(payload, options);

    await this.redis_access_token.set(
      email,
      access_token,
      'EX',
      this.configService.get<number>('REDIS_ACCESS_TOKEN_EXPIRES_IN'),
    );

    return { access_token };
  }

  async logout(email: string) {
    await this.redis_access_token.del(email);

    return true;
  }

  async validateToken(token: string): Promise<IPayload> {
    return await this.jwtService.verify(token);
  }
}
