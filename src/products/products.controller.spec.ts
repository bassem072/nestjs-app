import { CreateProductDto } from './dtos/create-product.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JWTPayloadType } from 'src/utils/types';
import { UserType } from '../utils/enums';
import { UpdateProductDto } from './dtos/update-product.dto';
import { NotFoundException } from '@nestjs/common';

type ProductTestType = {
  id: number;
  title: string;
  description: string;
  price: number;
  userId: number;
};

describe('Product Controller', () => {
  let productsController: ProductsController;
  let productsService: ProductsService;
  const currentUser: JWTPayloadType = { id: 1, userType: UserType.ADMIN };
  const createProductDto: CreateProductDto = {
    title: 'Book',
    description: 'This is a book',
    price: 140,
  };

  let products: ProductTestType[];

  beforeEach(async () => {
    products = [
      {
        id: 1,
        title: 'Book',
        description: 'This is a book',
        price: 50,
        userId: 1,
      },
      {
        id: 2,
        title: 'Story',
        description: 'This is a Story',
        price: 30,
        userId: 1,
      },
      { id: 3, title: 'TV', description: 'This is a TV', price: 90, userId: 1 },
      {
        id: 4,
        title: 'Laptop',
        description: 'This is a Laptop',
        price: 60,
        userId: 1,
      },
    ];

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {},
        },
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: ProductsService,
          useValue: {
            createNewProduct: jest.fn((dto: CreateProductDto, id: number) => {
              const product: ProductTestType = {
                ...dto,
                id: products[products.length - 1].id + 1,
                userId: id,
              };

              products.push(product);

              return Promise.resolve(product);
            }),
            getAllProducts: jest.fn(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              (title?: string, minPrice?: number, maxPrice?: number) => {
                if (title) return Promise.resolve([products[0], products[2]]);
                return Promise.resolve(products);
              },
            ),
            getSingleProduct: jest.fn((id: number) => {
              const product = products.find((product) => product.id === id);
              if (product) return Promise.resolve(product);
              else throw new NotFoundException('Product not found');
            }),
            updateProduct: jest.fn((id: number, body: UpdateProductDto) => {
              let product = products.find((p) => p.id === id);
              if (product) product = { ...product, ...body };
              else throw new NotFoundException('Product not found');

              return product;
            }),
            deleteProduct: jest.fn((id: number) => {
              const product = products.find((p) => p.id === id);
              if (product) products = products.filter((p) => p.id !== id);
              else throw new NotFoundException('Product not found');

              return product;
            }),
          },
        },
      ],
    }).compile();

    productsController = module.get<ProductsController>(ProductsController);
    productsService = module.get<ProductsService>(ProductsService);
  });

  it('should productsController be defined', () => {
    expect(productsController).toBeDefined();
  });

  it('should productsService be defined', () => {
    expect(productsService).toBeDefined();
  });

  describe('Create Product', () => {
    it('should call createProduct from productsService', async () => {
      const spy = jest.spyOn(productsService, 'createNewProduct');
      await productsController.createNewProduct(createProductDto, currentUser);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(createProductDto, currentUser.id);
    });

    it('should return new product with given data', async () => {
      const data = await productsController.createNewProduct(
        createProductDto,
        currentUser,
      );

      expect(data).toBeDefined();
      expect(data).toMatchObject(createProductDto);
      expect(data.id).toBe(products[products.length - 1].id);
    });
  });

  describe('Get All Products', () => {
    it('should call getAllProducts method in product service', async () => {
      const spy = jest.spyOn(productsService, 'getAllProducts');

      await productsController.getAllProducts();
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return 2 products if an argument passed', async () => {
      const data = await productsController.getAllProducts('book');
      expect(data).toHaveLength(2);
      expect(data[0].title).toBe('Book');
    });

    it('should return all products if no argument passed', async () => {
      const data = await productsController.getAllProducts();
      expect(data).toHaveLength(4);
      expect(data[0].title).toBe('Book');
    });
  });

  describe('Get Single Product', () => {
    it('should call getSingleProduct method in product repository', async () => {
      const spy = jest.spyOn(productsService, 'getSingleProduct');

      await productsController.getSingleProduct(2);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return single product if id found', async () => {
      const data = await productsController.getSingleProduct(2);
      expect(data).toBeDefined();
      expect(data).toMatchObject(products[1]);
    });

    it('should return error if id not found', async () => {
      expect.assertions(1);
      try {
        await productsController.getSingleProduct(5);
        console.log('done');
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product not found' });
      }
    });
  });

  describe('Update Product', () => {
    const title = 'product updated';

    it('should call getSingleProduct method in product service', async () => {
      const spy = jest.spyOn(productsService, 'updateProduct');

      await productsController.updateProduct(1, { title });
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(products).toHaveLength(4);
    });

    it('should return updated product if id found', async () => {
      const updatedProduct = await productsController.updateProduct(1, {
        title,
      });
      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.title).toBe(title);
    });

    it('should return error if id not found', async () => {
      expect.assertions(1);
      try {
        await productsController.updateProduct(5, { title });
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product not found' });
      }
    });
  });

  describe('Delete Product', () => {
    it('should call deleteProduct method in product repository', async () => {
      const spy = jest.spyOn(productsService, 'deleteProduct');

      await productsController.deleteProduct(1);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return removed product if id found and remove it from products', async () => {
      const deletedProduct = await productsController.deleteProduct(1);
      expect(deletedProduct).toBeDefined();
      expect(deletedProduct.title).toBe('Book');
      expect(products).toHaveLength(3);
    });

    it('should return error if id not found', async () => {
      expect.assertions(1);
      try {
        await productsController.deleteProduct(5);
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product not found' });
      }
    });
  });
});
