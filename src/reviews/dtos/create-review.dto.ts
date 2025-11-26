import { Injectable } from '@nestjs/common';
import { IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

@Injectable()
export class CreateReviewDto {
  @IsString()
  @MinLength(2)
  comment: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rate: number;
}
