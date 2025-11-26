import { CurrentUser } from 'src/users/decorators/current-user.decorator';
import { CreateReviewDto } from './dtos/create-review.dto';
import { ReviewsService } from './reviews.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { JWTPayloadType } from 'src/utils/types';
import { Roles } from 'src/users/decorators/user-roles.decorator';
import { UserType } from 'src/utils/enums';
import { AuthRolesGuard } from 'src/users/guards/auth-roles.guard';
import { AuthGuard } from 'src/users/guards/auth.guard';
import { UpdateReviewDto } from './dtos/update-review.dto';

@Controller('api/reviews')
export class ReviewsController {
  constructor(private readonly reviewService: ReviewsService) {}
  @Post(':productId')
  @Roles(UserType.ADMIN, UserType.USER)
  @UseGuards(AuthRolesGuard)
  public async createReview(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() body: CreateReviewDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.reviewService.createReview(payload.id, productId, body);
  }

  @Get()
  @UseGuards(AuthGuard)
  public async getAllReviews(
    @Query('pageNumber') pageNumber?: number,
    @Query('reviewsPerPage') reviewsPerPage?: number,
  ) {
    return await this.reviewService.getAll(pageNumber, reviewsPerPage);
  }

  @Put(':id')
  @Roles(UserType.ADMIN, UserType.USER)
  @UseGuards(AuthRolesGuard)
  public async updateReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateReviewDto,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.reviewService.update(id, payload.id, body);
  }

  @Delete(':id')
  @Roles(UserType.ADMIN, UserType.USER)
  @UseGuards(AuthRolesGuard)
  public async deleteReview(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() payload: JWTPayloadType,
  ) {
    return this.reviewService.delete(id, payload.id);
  }
}
