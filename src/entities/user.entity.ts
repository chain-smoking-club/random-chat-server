import { Column, Entity } from 'typeorm';

@Entity('user')
export class User {
  @Column({ primary: true, type: 'varchar', length: 255, unique: true })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255 })
  nickname: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_file_path: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnail_file_path: string;
}
