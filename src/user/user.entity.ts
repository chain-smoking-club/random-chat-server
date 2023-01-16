import { Column, Entity } from 'typeorm';

@Entity('user')
export class User {
  @Column({ primary: true, type: 'varchar', length: 20, unique: true })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;
}
