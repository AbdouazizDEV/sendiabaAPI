import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

export enum SenegalRegion {
  DAKAR = 'Dakar',
  THIES = 'Thiès',
  SAINT_LOUIS = 'Saint-Louis',
  ZIGUINCHOR = 'Ziguinchor',
  TAMBACOUNDA = 'Tambacounda',
  KAOLACK = 'Kaolack',
  LOUGA = 'Louga',
  FATICK = 'Fatick',
  KOLDA = 'Kolda',
  MATAM = 'Matam',
  KEDOUGOU = 'Kédougou',
  SEDHIOU = 'Sédhiou',
}

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column()
  label: string;

  @Column()
  recipientName: string;

  @Column()
  phone: string;

  @Column('text')
  address: string;

  @Column()
  city: string;

  @Column({
    type: 'enum',
    enum: SenegalRegion,
  })
  region: SenegalRegion;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ default: 'Sénégal' })
  country: string;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}




