import { Injectable } from '@nestjs/common';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

@Injectable()
export class UpdateReviewDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  comment: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rate: number;
}
