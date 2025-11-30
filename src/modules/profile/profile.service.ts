import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileRepository } from './profile.repository';
import { User } from '../auth/entities/user.entity';
import { Address } from './entities/address.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { AuthRepository } from '../auth/auth.repository';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return this.authRepository.update(userId, updateProfileDto);
  }

  async getAddresses(userId: string): Promise<Address[]> {
    return this.profileRepository.findAddressesByUserId(userId);
  }

  async createAddress(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    // Si c'est la première adresse ou si isDefault est true, définir comme défaut
    const existingAddresses = await this.profileRepository.findAddressesByUserId(userId);
    const isDefault = createAddressDto.isDefault ?? existingAddresses.length === 0;

    if (isDefault && existingAddresses.length > 0) {
      // Désactiver les autres adresses par défaut
      await this.profileRepository.setDefaultAddress(userId, 'temp');
    }

    const address = await this.profileRepository.createAddress({
      ...createAddressDto,
      userId,
      isDefault,
    });

    if (isDefault && existingAddresses.length > 0) {
      await this.profileRepository.setDefaultAddress(userId, address.id);
    }

    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.profileRepository.findAddressById(addressId, userId);
    if (!address) {
      throw new NotFoundException('Adresse non trouvée');
    }

    // Si on définit cette adresse comme défaut, désactiver les autres
    if (updateAddressDto.isDefault === true) {
      await this.profileRepository.setDefaultAddress(userId, addressId);
    }

    return this.profileRepository.updateAddress(addressId, updateAddressDto);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.profileRepository.findAddressById(addressId, userId);
    if (!address) {
      throw new NotFoundException('Adresse non trouvée');
    }

    await this.profileRepository.deleteAddress(addressId);
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    let preferences = await this.profileRepository.findPreferencesByUserId(userId);
    
    if (!preferences) {
      // Créer des préférences par défaut si elles n'existent pas
      preferences = await this.profileRepository.createPreferences({
        userId,
      });
    }

    return preferences;
  }

  async updatePreferences(
    userId: string,
    updatePreferencesDto: UpdatePreferencesDto,
  ): Promise<UserPreferences> {
    let preferences = await this.profileRepository.findPreferencesByUserId(userId);
    
    if (!preferences) {
      preferences = await this.profileRepository.createPreferences({
        userId,
        ...updatePreferencesDto,
      });
    } else {
      preferences = await this.profileRepository.updatePreferences(userId, updatePreferencesDto);
    }

    return preferences;
  }
}


