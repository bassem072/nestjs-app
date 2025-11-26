import { IsInt, IsNotEmpty, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Title should be not empty' })
  @IsString({ message: 'Title should be string' })
  @MinLength(3, {
    message: 'Title should be with length grater than 2 characters',
  })
  title: string;

  @IsString({ message: 'Description should be string' })
  @MinLength(5, {
    message: 'Description should be with length grater than 4 characters',
  })
  description: string;

  @IsNotEmpty({ message: 'Price should be not empty' })
  @IsInt({ message: 'Price should be Integer' })
  @Min(0, { message: 'Price should be not less than 0' })
  price: number;
}
