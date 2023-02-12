import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../common/entities/user.entity';
import { CreateUserDto } from '../common/dtos/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createDto: CreateUserDto): Promise<User> {
    createDto.password = await bcrypt.hash(createDto.password, 10);
    const user = await this.userRepository.save(createDto);
    delete user.password;
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }
}
