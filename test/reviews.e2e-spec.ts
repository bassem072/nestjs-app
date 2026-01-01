import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Product } from '../src/products/product.entity';
import request from 'supertest';
import { Server } from 'http';
import { User } from '../src/users/user.entity';
import { UserType } from '../src/utils/enums';
import bcrypt from 'bcryptjs';
import { CreateReviewDto } from 'src/reviews/dtos/create-review.dto';
import { Review } from '../src/reviews/review.entity';
import { CreateProductDto } from '../src/products/dtos/create-product.dto';

describe('Review Controller (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let accessToken: string;
  let review: CreateReviewDto;
  const product: CreateProductDto = {
    title: 'smart watch',
    description: 'This is a smart watch',
    price: 150,
  };

  beforeEach(async () => {
    review = {
      comment: 'Thanks',
      rate: 4,
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Bdsgdfgfdgfdd2751959@', salt);

    await dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          email: 'bassem.elsayed@travolic.com',
          password: hash,
          userType: UserType.ADMIN,
          isAccountVerified: true,
        },
      ])
      .execute();

    const loginResponse: {
      body: { accessToken: string };
      status: HttpStatus;
    } = await request(app.getHttpServer() as Server)
      .post('/api/users/auth/login')
      .send({
        email: 'bassem.elsayed@travolic.com',
        password: 'Bdsgdfgfdgfdd2751959@',
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterEach(async () => {
    await dataSource.createQueryBuilder().delete().from(Review).execute();
    await dataSource.createQueryBuilder().delete().from(Product).execute();
    await dataSource.createQueryBuilder().delete().from(User).execute();
    await app.close();
  });

  describe('Create Review', () => {
    it('should create an new review and save it to the database', async () => {
      const res = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const prod: Product = res.body as Product;

      const response = await request(app.getHttpServer() as Server)
        .post('/api/reviews/' + prod.id)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(review);

      const { id } = response.body as Review;

      expect(response.status).toBe(201);
      expect(id).toBeDefined();
      expect(response.body).toMatchObject(review);
    });
  });
});
