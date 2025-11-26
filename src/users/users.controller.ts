import type { AccessTokenType, JWTPayloadType } from 'src/utils/types';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { UsersService } from './users.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/user-roles.decorator';
import { UserType } from 'src/utils/enums';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Register new user
   * @param body data to creating user
   * @returns JWT (access token)
   */
  @Post('/auth/register')
  public register(@Body() body: RegisterDto): Promise<AccessTokenType> {
    return this.usersService.register(body);
  }

  /**
   * Login user
   * @param body data for login user
   * @returns JWT (access token)
   */
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  public login(@Body() body: LoginDto): Promise<AccessTokenType> {
    return this.usersService.login(body);
  }

  @Get('current-user')
  @UseGuards(AuthGuard)
  public getCurrentUser(@CurrentUser() payload: JWTPayloadType) {
    return this.usersService.getUser(payload.id);
  }

  @Get()
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  public getAllUser() {
    return this.usersService.getAll();
  }

  @Put()
  @UseGuards(AuthGuard)
  public updateUser(
    @CurrentUser() payload: JWTPayloadType,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(payload.id, body);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  public deleteUser(
    @CurrentUser() payload: JWTPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.delete(id, payload);
  }
}
