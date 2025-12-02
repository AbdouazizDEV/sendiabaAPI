import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSecuritySettings } from './entities/user-security-settings.entity';
import { LoginActivity } from './entities/login-activity.entity';

@Injectable()
export class SecurityRepository {
  constructor(
    @InjectRepository(UserSecuritySettings)
    private readonly securitySettingsRepository: Repository<UserSecuritySettings>,
    @InjectRepository(LoginActivity)
    private readonly loginActivityRepository: Repository<LoginActivity>,
  ) {}

  // UserSecuritySettings methods
  async findSecuritySettingsByUserId(
    userId: string,
  ): Promise<UserSecuritySettings | null> {
    return this.securitySettingsRepository.findOne({
      where: { userId },
    });
  }

  async createSecuritySettings(
    userId: string,
  ): Promise<UserSecuritySettings> {
    const settings = this.securitySettingsRepository.create({
      userId,
    });
    return this.securitySettingsRepository.save(settings);
  }

  async updateSecuritySettings(
    userId: string,
    updateData: Partial<UserSecuritySettings>,
  ): Promise<UserSecuritySettings> {
    await this.securitySettingsRepository.update({ userId }, updateData);
    const settings = await this.findSecuritySettingsByUserId(userId);
    if (!settings) {
      throw new Error(
        `Security settings for user ${userId} not found after update`,
      );
    }
    return settings;
  }

  // LoginActivity methods
  async createLoginActivity(
    activityData: Partial<LoginActivity>,
  ): Promise<LoginActivity> {
    const activity = this.loginActivityRepository.create(activityData);
    return this.loginActivityRepository.save(activity);
  }

  async findUserLoginActivities(
    userId: string,
    limit: number = 50,
  ): Promise<LoginActivity[]> {
    return this.loginActivityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findRecentLoginActivity(
    userId: string,
    hours: number = 24,
  ): Promise<LoginActivity[]> {
    const date = new Date();
    date.setHours(date.getHours() - hours);

    return this.loginActivityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.createdAt >= :date', { date })
      .orderBy('activity.createdAt', 'DESC')
      .getMany();
  }
}


