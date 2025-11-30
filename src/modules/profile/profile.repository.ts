import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { UserPreferences } from './entities/user-preferences.entity';

@Injectable()
export class ProfileRepository {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(UserPreferences)
    private readonly preferencesRepository: Repository<UserPreferences>,
  ) {}

  // Address methods
  async findAddressesByUserId(userId: string): Promise<Address[]> {
    return this.addressRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findAddressById(id: string, userId: string): Promise<Address | null> {
    return this.addressRepository.findOne({
      where: { id, userId },
    });
  }

  async createAddress(addressData: Partial<Address>): Promise<Address> {
    const address = this.addressRepository.create(addressData);
    return this.addressRepository.save(address);
  }

  async updateAddress(id: string, updateData: Partial<Address>): Promise<Address> {
    await this.addressRepository.update(id, updateData);
    const address = await this.addressRepository.findOne({ where: { id } });
    if (!address) {
      throw new Error(`Address with id ${id} not found after update`);
    }
    return address;
  }

  async deleteAddress(id: string): Promise<void> {
    await this.addressRepository.delete(id);
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<void> {
    // Désactiver toutes les adresses par défaut
    await this.addressRepository.update(
      { userId },
      { isDefault: false },
    );
    // Activer l'adresse spécifiée
    await this.addressRepository.update(addressId, { isDefault: true });
  }

  // Preferences methods
  async findPreferencesByUserId(userId: string): Promise<UserPreferences | null> {
    return this.preferencesRepository.findOne({
      where: { userId },
    });
  }

  async createPreferences(preferencesData: Partial<UserPreferences>): Promise<UserPreferences> {
    const preferences = this.preferencesRepository.create(preferencesData);
    return this.preferencesRepository.save(preferences);
  }

  async updatePreferences(
    userId: string,
    updateData: Partial<UserPreferences>,
  ): Promise<UserPreferences> {
    await this.preferencesRepository.update({ userId }, updateData);
    const preferences = await this.findPreferencesByUserId(userId);
    if (!preferences) {
      throw new Error(`Preferences for user ${userId} not found after update`);
    }
    return preferences;
  }
}
