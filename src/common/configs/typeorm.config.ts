import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { User } from '../entities/user.entity';

export class TypeOrmConfig {
  static getOrmConfig(configService: ConfigService): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: configService.get<string>('MYSQL_HOST'),
      port: configService.get<number>('MYSQL_DOCKER_PORT'),
      username: configService.get<string>('MYSQL_USERNAME'),
      password: configService.get<string>('MYSQL_ROOT_PASSWORD'),
      database: configService.get<string>('MYSQL_DATABASE'),
      entities: [User],
      logging: true,
      synchronize: true,
    };
  }
}

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => TypeOrmConfig.getOrmConfig(configService),
  inject: [ConfigService],
};
