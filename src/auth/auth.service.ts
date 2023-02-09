import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { ConfigService } from '@nestjs/config';

import { UserService } from '../user/user.service';
import { User } from '../common/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,

    @InjectRedis('access_token')
    private readonly redis_access_token: Redis,
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
    const access_token = this.jwtService.sign(payload);

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

  async validateToken(token: string): Promise<any> {
    const user = await this.jwtService.verify(token);

    if (user) {
      return user;
    }

    return null;
  }
}
