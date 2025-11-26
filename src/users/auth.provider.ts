import { BadRequestException, Injectable } from '@nestjs/common';
import { AccessTokenType, JWTPayloadType } from 'src/utils/types';
import { LoginDto } from './dtos/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthProvider {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register new user
   * @param registerDto data for creating new user
   * @returns JWT (access token)
   */
  public async register(registerDto: RegisterDto): Promise<AccessTokenType> {
    const { email, password, username } = registerDto;

    const userFromDB = await this.userRepository.findOne({ where: { email } });

    if (userFromDB) throw new BadRequestException('User already exist');

    const hashedPassword = await this.hashPassword(password);

    const userInstance = this.userRepository.create({
      email,
      username,
      password: hashedPassword,
    });

    const user = await this.userRepository.save(userInstance);

    return {
      accessToken: await this.generateJWT({
        id: user.id,
        userType: user.userType,
      }),
    };
  }

  /**
   * Login user
   * @param loginDto data for login user
   * @returns JWT (access token)
   */
  public async login(loginDto: LoginDto): Promise<AccessTokenType> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) throw new BadRequestException('Invalid email or password');

    const compare = await bcrypt.compare(password, user.password);

    if (!compare) throw new BadRequestException('Invalid email or password');

    return {
      accessToken: await this.generateJWT({
        id: user.id,
        userType: user.userType,
      }),
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
}
