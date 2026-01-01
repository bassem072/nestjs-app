import { BadRequestException, Injectable } from '@nestjs/common';
import { JWTPayloadType } from '../utils/types';
import { LoginDto } from './dtos/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from './dtos/reset-password.dto';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Register new user
   * @param registerDto data for creating new user
   * @returns JWT (access token)
   */
  public async register(registerDto: RegisterDto) {
    const { email, password, username } = registerDto;

    const userFromDB = await this.userRepository.findOne({ where: { email } });

    if (userFromDB) throw new BadRequestException('User already exist');

    const hashedPassword = await this.hashPassword(password);

    const userInstance = this.userRepository.create({
      email,
      username,
      password: hashedPassword,
      verificationToken: randomBytes(32).toString('hex'),
    });

    const user = await this.userRepository.save(userInstance);

    const link = this.generateLink(user.id, user.verificationToken!);

    await this.mailService.sendVerifyEmail(user.email, link);

    return {
      message:
        'Verification token has been sent to your email, please verify your address.',
    };
  }

  /**
   * Login user
   * @param loginDto data for login user
   * @returns JWT (access token)
   */
  public async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) throw new BadRequestException('Invalid email or password');

    const compare = await bcrypt.compare(password, user.password);

    if (!compare) throw new BadRequestException('Invalid email or password');

    if (!user.isAccountVerified) {
      let verificationToken = user.verificationToken;

      if (!verificationToken) {
        user.verificationToken = randomBytes(32).toString('hex');
        await this.userRepository.save(user);
        verificationToken = user.verificationToken;
      }

      const link = this.generateLink(user.id, verificationToken);

      await this.mailService.sendVerifyEmail(user.email, link);

      return {
        message:
          'Verification token has been sent to your email, please verify your address.',
      };
    }

    // await this.mailService.sendLoginEmail(user.email);

    return {
      accessToken: await this.generateJWT({
        id: user.id,
        userType: user.userType,
      }),
    };
  }

  public async sendResetPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      throw new BadRequestException('User with given email does not exist');

    user.resetPasswordToken = randomBytes(32).toString('hex');
    await this.userRepository.save(user);

    const resetPasswordLink = `${this.config.get<string>('CLIENT_DOMAIN')}verify-email/${user.id}/${user.resetPasswordToken}`;

    await this.mailService.sendResetPassword(email, resetPasswordLink);

    return {
      message:
        'Password reset link sent to your email, please check your inbox',
    };
  }

  public async getResetPasswordLink(
    userId: number,
    resetPasswordToken: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new BadRequestException('Invalid link');

    if (
      !user.resetPasswordToken ||
      user.resetPasswordToken !== resetPasswordToken
    )
      throw new BadRequestException('Invalid link');

    return {
      message: 'Valid link',
    };
  }

  public async resetPassword(dto: ResetPasswordDto) {
    const { newPassword, userId, resetPasswordToken } = dto;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new BadRequestException('Invalid link');

    if (
      !user.resetPasswordToken ||
      user.resetPasswordToken !== resetPasswordToken
    )
      throw new BadRequestException('Invalid link');

    const hashedPassword = await this.hashPassword(newPassword);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    await this.userRepository.save(user);

    return {
      message: 'Password reset successfully, please login.',
    };
  }

  /**
   * Hash Password
   * @param password Password to hash
   * @returns hashed password
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Generate Json Web Token
   * @param payload JWT payload
   * @returns token
   */
  private async generateJWT(payload: JWTPayloadType): Promise<string> {
    return await this.jwtService.signAsync(payload);
  }

  /**
   * Generate Json Web Token
   * @param id Integer
   * @param verificationToken String
   * @returns token
   */
  private generateLink(id: number, verificationToken: string): string {
    return `${this.config.get<string>('DOMAIN')}api/users/verify-email/${id}/${verificationToken}`;
  }
}
