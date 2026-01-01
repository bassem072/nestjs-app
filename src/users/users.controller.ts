import type { JWTPayloadType } from '../utils/types';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { UsersService } from './users.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/user-roles.decorator';
import { UserType } from '../utils/enums';
import { AuthRolesGuard } from './guards/auth-roles.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ForgetPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ApiBody, ApiConsumes, ApiSecurity } from '@nestjs/swagger';
import { UploadImageDto } from './dtos/image-upload.dto';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Register new user
   * @param body data to creating user
   * @returns JWT (access token)
   */
  @Post('/auth/register')
  public register(@Body() body: RegisterDto) {
    return this.usersService.register(body);
  }

  /**
   * Login user
   * @param body data for login user
   * @returns JWT (access token)
   */
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  public login(@Body() body: LoginDto) {
    return this.usersService.login(body);
  }

  @Get('current-user')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public getCurrentUser(@CurrentUser() payload: JWTPayloadType) {
    return this.usersService.getUser(payload.id);
  }

  @Get()
  @Roles(UserType.ADMIN)
  @UseGuards(AuthRolesGuard)
  @ApiSecurity('bearer')
  public getAllUser() {
    return this.usersService.getAll();
  }

  @Put()
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public updateUser(
    @CurrentUser() payload: JWTPayloadType,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.update(payload.id, body);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public deleteUser(
    @CurrentUser() payload: JWTPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.delete(id, payload);
  }

  @Post('profile-image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('user-image'))
  @ApiSecurity('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: UploadImageDto,
    description: 'Profile Image',
  })
  public uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    if (!file) throw new BadRequestException('No image provided');

    return this.usersService.setProfileImage(payload.id, file.filename);
  }

  @Patch('profile-image')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public async deleteProfileImage(@CurrentUser() payload: JWTPayloadType) {
    await this.usersService.deleteProfileImage(payload.id);

    return 'Profile image deleted successfully';
  }

  @Get('profile-image')
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public async showProfileImage(
    @Res() res: Response,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    const user = await this.usersService.getUser(payload.id);

    if (user.profileImage)
      return res.sendFile(user.profileImage, {
        root: 'images/users',
      });
    else throw new NotFoundException('No profile image');
  }

  @Get('verify-email/:id/:verificationToken')
  public verifyEmail(
    @Param('id', ParseIntPipe) id: number,
    @Param('verificationToken') verificationToken: string,
  ) {
    return this.usersService.verifyEmail(id, verificationToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  public sendResetPassword(@Body() body: ForgetPasswordDto) {
    return this.usersService.sendResetPassword(body.email);
  }

  @Get('reset-password/:id/:resetPasswordToken')
  public getResetPasswordLink(
    @Param('id', ParseIntPipe) id: number,
    @Param('resetPasswordToken') resetPasswordToken: string,
  ) {
    return this.usersService.getResetPasswordLink(id, resetPasswordToken);
  }

  @Post('reset-password')
  public resetPassword(@Body() body: ResetPasswordDto) {
    return this.usersService.resetPassword(body);
  }
}
