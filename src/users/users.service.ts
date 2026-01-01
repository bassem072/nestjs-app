import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { JWTPayloadType } from '../utils/types';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserType } from '../utils/enums';
import { AuthProvider } from './auth.provider';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly authProvider: AuthProvider,
  ) {}

  /**
   * Register new user
   * @param registerDto data for creating new user
   * @returns JWT (access token)
   */
  public async register(registerDto: RegisterDto) {
    return this.authProvider.register(registerDto);
  }

  /**
   * Login user
   * @param loginDto data for login user
   * @returns JWT (access token)
   */
  public async login(loginDto: LoginDto) {
    return this.authProvider.login(loginDto);
  }

  /**
   * Get current user
   * @param id id of the logged in user
   * @returns the user from the database
   */
  public async getUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  /**
   * Get all users from database
   * @returns collection of users
   */
  public async getAll() {
    return await this.userRepository.find();
  }

  /**
   * Update user
   * @param id id for logged in user
   * @param updateUserDto data for updating the user
   * @returns updated user from the database
   */
  public async update(id: number, updateUserDto: UpdateUserDto) {
    const { username, password } = updateUserDto;
    const user = await this.getUser(id);

    if (!user) throw new BadRequestException('User not found');

    user.username = username ?? user.username;

    if (password) {
      user.password = await this.authProvider.hashPassword(password);
    }

    return await this.userRepository.save(user);
  }

  public async delete(id: number, payload: JWTPayloadType) {
    const user = await this.getUser(id);

    if (!user) throw new BadRequestException('User not found');

    if (payload.userType !== UserType.ADMIN)
      throw new UnauthorizedException(
        'Access denied, you do not have permissions',
      );

    await this.userRepository.remove(user);

    return { message: 'User has been deleted' };
  }

  public async setProfileImage(userId: number, newImageProfile: string) {
    const user = await this.getUser(userId);

    user.profileImage = newImageProfile;

    return await this.userRepository.save(user);
  }

  public async deleteProfileImage(userId: number) {
    const user = await this.getUser(userId);

    if (!user.profileImage) {
      throw new NotFoundException('There is no profile photo');
    }

    const imagePath = join(process.cwd(), `images/users/${user.profileImage}`);

    if (existsSync(imagePath)) {
      unlinkSync(imagePath);
    }

    user.profileImage = null;

    return await this.userRepository.save(user);
  }

  public async verifyEmail(userId: number, verificationToken: string) {
    const user = await this.getUser(userId);

    if (!user.verificationToken) {
      throw new NotFoundException('There is no verification token');
    }

    if (user.verificationToken !== verificationToken) {
      throw new BadRequestException('Invalid link');
    }

    user.isAccountVerified = true;
    user.verificationToken = null;

    await this.userRepository.save(user);

    return {
      message: 'Your email has been verified, please login to your account',
    };
  }

  public async sendResetPassword(email: string) {
    return this.authProvider.sendResetPassword(email);
  }

  public async getResetPasswordLink(
    userId: number,
    resetPasswordToken: string,
  ) {
    return this.authProvider.getResetPasswordLink(userId, resetPasswordToken);
  }

  public async resetPassword(dto: ResetPasswordDto) {
    return this.authProvider.resetPassword(dto);
  }
}
