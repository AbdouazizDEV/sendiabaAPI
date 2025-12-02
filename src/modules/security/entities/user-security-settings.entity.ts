import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('user_security_settings')
export class UserSecuritySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  // Paramètres de confidentialité
  @Column({ default: true })
  profileVisibility: boolean; // Profil visible publiquement

  @Column({ default: true })
  showEmail: boolean; // Afficher l'email dans le profil

  @Column({ default: true })
  showPhone: boolean; // Afficher le téléphone dans le profil

  @Column({ default: true })
  allowMessages: boolean; // Permettre les messages privés

  @Column({ default: false })
  twoFactorEnabled: boolean; // Authentification à deux facteurs

  @Column({ type: 'varchar', nullable: true })
  twoFactorSecret: string | null; // Secret pour 2FA

  // Paramètres de sécurité
  @Column({ default: true })
  emailNotifications: boolean; // Notifications par email pour activités suspectes

  @Column({ default: true })
  loginAlerts: boolean; // Alertes de connexion

  @Column({ default: true })
  deviceManagement: boolean; // Gestion des appareils

  @Column({ default: 30 })
  sessionTimeout: number; // Timeout de session en minutes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: User;
}



