import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { UsersService } from 'src/users/users.service';
import { ProductsService } from 'src/products/products.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { Repository } from 'typeorm';
import { UpdateReviewDto } from './dtos/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
  ) {}

  public async createReview(
    userId: number,
    productId: number,
    dto: CreateReviewDto,
  ) {
    const user = await this.usersService.getUser(userId);

    const product = await this.productsService.getSingleProduct(productId);

    const review = this.reviewsRepository.create({
      ...dto,
      product,
      user,
    });

    const { id, comment, rate, createdAt } =
      await this.reviewsRepository.save(review);

    return {
      id,
      comment,
      rate,
      createdAt,
      userId,
      productId,
    };
  }

  public async getAll(pageNumber: number = 1, reviewsPerPage: number = 10) {
    return await this.reviewsRepository.find({
      skip: (pageNumber - 1) * reviewsPerPage,
      take: reviewsPerPage,
      order: { createdAt: 'DESC' },
    });
  }

  public async getSingleReview(reviewId: number) {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException('Review not found');

    return review;
  }

  public async update(reviewId: number, userId: number, dto: UpdateReviewDto) {
    const review = await this.getSingleReview(reviewId);

    const user = await this.usersService.getUser(userId);

    if (review.user.id !== user.id)
      throw new ForbiddenException('Access denied, You are not allowed');

    review.comment = dto.comment ?? review.comment;
    review.rate = dto.rate ?? review.rate;

    return this.reviewsRepository.save(review);
  }

  public async delete(reviewId: number, userId: number) {
    const review = await this.getSingleReview(reviewId);

    const user = await this.usersService.getUser(userId);

    if (review.user.id !== user.id)
      throw new ForbiddenException('Access denied, You are not allowed');

    return this.reviewsRepository.remove(review);
  }
}
