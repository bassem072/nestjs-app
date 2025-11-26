import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class UpdateUserDto {
  @IsStrongPassword()
  @IsNotEmpty()
  @IsOptional()
  password: string;

  @IsOptional()
  @IsString()
  @Length(2, 150)
  username: string;
}
