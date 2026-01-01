import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { CreateProductDto } from '../src/products/dtos/create-product.dto';
import { DataSource } from 'typeorm';
import { Product } from '../src/products/product.entity';
import request from 'supertest';
import { Server } from 'http';
import { User } from '../src/users/user.entity';
import { UserType } from '../src/utils/enums';
import bcrypt from 'bcryptjs';
import { UpdateProductDto } from '../src/products/dtos/update-product.dto';

describe('Product Controller (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let productsToSave: CreateProductDto[];
  let accessToken: string;
  const product: CreateProductDto = {
    title: 'smart watch',
    description: 'This is a smart watch',
    price: 150,
  };

  beforeEach(async () => {
    productsToSave = [
      { title: 'Book', description: 'This is a book', price: 50 },
      { title: 'Story', description: 'This is a Story', price: 30 },
      { title: 'TV', description: 'This is a TV', price: 90 },
      { title: 'Laptop', description: 'This is a Laptop', price: 60 },
    ];

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterEach(async () => {
    await dataSource.createQueryBuilder().delete().from(Product).execute();
    await dataSource.createQueryBuilder().delete().from(User).execute();
    await app.close();
  });

  describe('Create New Product', () => {
    beforeEach(async () => {
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
    it('should create a new product and save it to the database', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const newProduct = response.body as Product;

      expect(response.status).toBe(201);

      const getResponse = await request(app.getHttpServer() as Server).get(
        '/api/products/' + newProduct.id,
      );

      const getProduct = getResponse.body as Product;

      expect(getResponse.status).toBe(200);
      expect({
        ...getProduct,
        price: Math.round(getProduct.price),
      }).toMatchObject(product);
    });

    it('should return 400 status code if title was lees than 3 characters', async () => {
      product.title = 'aa';
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      expect(response.status).toBe(400);
    });

    it('should return 401 status code if title was lees than 3 characters', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .send(product);

      expect(response.status).toBe(401);
    });
  });

  describe('GET All Products', () => {
    beforeEach(async () => {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Product)
        .values(productsToSave)
        .execute();
    });
    it('should return all products from database', async () => {
      const response = await request(app.getHttpServer() as Server).get(
        '/api/products',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(4);
    });

    it('should return products from database based on title', async () => {
      const response = await request(app.getHttpServer() as Server).get(
        '/api/products?title=oo',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('should return products from database based on minPrice & maxPrice', async () => {
      const response = await request(app.getHttpServer() as Server).get(
        '/api/products?minPrice=40&maxPrice=70',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should return products from database based on title & minPrice & maxPrice', async () => {
      const response = await request(app.getHttpServer() as Server).get(
        '/api/products?title=ap&minPrice=40&maxPrice=70',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('should return zero product from database based on title & minPrice & maxPrice', async () => {
      const response = await request(app.getHttpServer() as Server).get(
        '/api/products?title=xy&minPrice=40&maxPrice=70',
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('Get Single Product /:id', () => {
    beforeEach(async () => {
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
    it('should return a product with the given id', async () => {
      product.title = 'book';
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const newProduct = response.body as Product;

      const getResponse = await request(app.getHttpServer() as Server).get(
        '/api/products/' + newProduct.id,
      );

      const getProduct = getResponse.body as Product;

      expect(getResponse.status).toBe(200);
      expect({
        ...getProduct,
        price: Math.round(getProduct.price),
      }).toMatchObject(product);
    });
    it('should return 404 status code when given id not found', async () => {
      const getResponse = await request(app.getHttpServer() as Server).get(
        '/api/products/50',
      );

      expect(getResponse.status).toBe(404);
    });
    it('should return 400 status code when given id is invalid', async () => {
      const getResponse = await request(app.getHttpServer() as Server).get(
        '/api/products/xyz',
      );

      expect(getResponse.status).toBe(400);
    });
  });

  describe('Update Product', () => {
    beforeEach(async () => {
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

    it('should update the product', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const newProduct = response.body as Product;

      const prod: UpdateProductDto = {
        title: 'updated',
        description: newProduct.description,
        price: newProduct.price,
      };

      const res = await request(app.getHttpServer() as Server)
        .put('/api/products/' + newProduct.id)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(prod);

      const updatedProduct = res.body as Product;

      expect(res.status).toBe(200);
      expect(updatedProduct.title).toBe('updated');
    });

    it('should return 400 status code if title less than 3 chars', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const newProduct = response.body as Product;

      const prod: UpdateProductDto = {
        title: 'up',
        description: newProduct.description,
        price: newProduct.price,
      };

      const res = await request(app.getHttpServer() as Server)
        .put('/api/products/' + newProduct.id)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(prod);

      expect(res.status).toBe(400);
    });

    it('should return 404 status code if id not found', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const newProduct = response.body as Product;

      const prod: UpdateProductDto = {
        title: 'up',
        description: newProduct.description,
        price: newProduct.price,
      };

      const res = await request(app.getHttpServer() as Server)
        .put('/api/products/50')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(prod);

      expect(res.status).toBe(400);
    });

    it('should return 401 status code if no user authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const newProduct = response.body as Product;

      const prod: UpdateProductDto = {
        title: 'up',
        description: newProduct.description,
        price: newProduct.price,
      };

      const res = await request(app.getHttpServer() as Server)
        .put('/api/products/' + newProduct.id)
        .send(prod);

      expect(res.status).toBe(401);
    });
  });

  describe('Delete Product', () => {
    beforeEach(async () => {
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

    it('should delete the product', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const newProduct = response.body as Product;

      const res = await request(app.getHttpServer() as Server)
        .delete('/api/products/' + newProduct.id)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 status code if id is wrong', async () => {
      const res = await request(app.getHttpServer() as Server)
        .put('/api/products/50')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 status code if no user authenticated', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/products')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(product);

      const newProduct = response.body as Product;

      const res = await request(app.getHttpServer() as Server).delete(
        '/api/products/' + newProduct.id,
      );

      expect(res.status).toBe(401);
    });
  });
});
