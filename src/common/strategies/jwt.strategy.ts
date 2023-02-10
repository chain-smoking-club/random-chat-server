import Redis from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRedis('access_token')
    private readonly redis_access_token: Redis,

    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<any> {
    const accessTokenInRedis = await this.redis_access_token.get(payload.sub);
    if (
      JSON.stringify(this.jwtService.decode(accessTokenInRedis)) !==
      JSON.stringify(payload)
    ) {
      throw new UnauthorizedException();
    }

    return { email: payload.sub };
  }
}
