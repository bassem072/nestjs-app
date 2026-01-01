import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsStrongPassword,
  Min,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsStrongPassword()
  @IsNotEmpty()
  newPassword: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  resetPasswordToken: string;
}
