import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  nickname: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_file_path: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnail_file_path: string;
}
