import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('login_activities')
@Index(['userId', 'createdAt'])
export class LoginActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  userId: string;

  @Column()
  ipAddress: string;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  device: string | null; // Mobile, Desktop, Tablet

  @Column({ type: 'varchar', nullable: true })
  browser: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null; // Ville, Pays

  @Column({ default: true })
  success: boolean; // Connexion réussie ou échouée

  @Column({ type: 'varchar', nullable: true })
  failureReason: string | null; // Raison de l'échec si applicable

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.id)
  user: User;
}

