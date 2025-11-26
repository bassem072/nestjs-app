import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenType, JWTPayloadType } from 'src/utils/types';
import { UpdateUserDto } from './dtos/update-user.dto';
import { UserType } from 'src/utils/enums';
import { AuthProvider } from './auth.provider';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly authProvider: AuthProvider,
  ) {}

  /**
   * Register new user
   * @param registerDto data for creating new user
   * @returns JWT (access token)
   */
  public async register(registerDto: RegisterDto): Promise<AccessTokenType> {
    return this.authProvider.register(registerDto);
  }

  /**
   * Login user
   * @param loginDto data for login user
   * @returns JWT (access token)
   */
  public async login(loginDto: LoginDto): Promise<AccessTokenType> {
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
}
