import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dtos/create-product.dto';

type ProductTestType = {
  id: number;
  title: string;
  description: string;
  price: number;
};
type GetAllOptions = {
  where: { title?: string; minPrice?: number; maxPrice?: number };
};
type GetOneOptions = {
  where: { id: number };
};

describe('ProductsService', () => {
  let productsService: ProductsService;
  let productsRepository: Repository<Product>;
  const REPOSITORY_TOKEN = getRepositoryToken(Product);
  const createProductDto: CreateProductDto = {
    title: 'Story',
    description: 'This is science fiction story',
    price: 123,
  };

  let products: ProductTestType[];

  beforeEach(async () => {
    products = [
      { id: 1, title: 'Book', description: 'This is a book', price: 50 },
      { id: 2, title: 'Story', description: 'This is a Story', price: 30 },
      { id: 3, title: 'TV', description: 'This is a TV', price: 90 },
      { id: 4, title: 'Laptop', description: 'This is a Laptop', price: 60 },
    ];

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: UsersService,
          useValue: {
            getUser: jest.fn((userId: number) =>
              Promise.resolve({ id: userId }),
            ),
          },
        },
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            create: jest.fn((dto: CreateProductDto) => ({
              ...dto,
              id: products[products.length - 1].id + 1,
            })),
            save: jest.fn((prod: CreateProductDto & { id: number }) => {
              let product = products.find((p) => p.id === prod.id);
              if (!product) products.push(prod);
              else product = { ...product, ...prod };

              return prod;
            }),
            find: jest.fn((options?: GetAllOptions) => {
              if (options?.where.title)
                return Promise.resolve([products[0], products[2]]);

              return Promise.resolve(products);
            }),
            findOne: jest.fn((options: GetOneOptions) => {
              return Promise.resolve(
                products.find((product) => product.id === options.where.id),
              );
            }),
            remove: jest.fn((prod: CreateProductDto & { id: number }) => {
              const product = products.find((p) => p.id === prod.id);
              products = products.filter((p) => p.id !== prod.id);

              return product;
            }),
          },
        },
      ],
    }).compile();

    productsService = module.get<ProductsService>(ProductsService);
    productsRepository = module.get<Repository<Product>>(REPOSITORY_TOKEN);
  });

  it('should products service be defined', () => {
    expect(productsService).toBeDefined();
  });

  it('should products repository be defined', () => {
    expect(productsRepository).toBeDefined();
  });

  describe('Create Product', () => {
    it('should call create method in product repository', async () => {
      const spy = jest.spyOn(productsRepository, 'create');

      await productsService.createNewProduct(createProductDto, 1);
      expect(spy).toHaveBeenCalled();
    });

    it('should call save method in product repository', async () => {
      const spy = jest.spyOn(productsRepository, 'save');

      await productsService.createNewProduct(createProductDto, 1);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call save method in product repository', async () => {
      const product = await productsService.createNewProduct(
        createProductDto,
        1,
      );

      expect(product).toBeDefined();
      expect(product.title).toBe('story');
      expect(product.price).toBe(123);
    });
  });

  describe('Get All Products', () => {
    it('should call find method in product repository', async () => {
      const spy = jest.spyOn(productsRepository, 'find');

      await productsService.getAllProducts();
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return 2 products if an argument passed', async () => {
      const data = await productsService.getAllProducts('book');
      expect(data).toHaveLength(2);
      expect(data[0].title).toBe('Book');
    });

    it('should return all products if no argument passed', async () => {
      const data = await productsService.getAllProducts();
      expect(data).toHaveLength(4);
      expect(data[0].title).toBe('Book');
    });
  });

  describe('Get Single Product', () => {
    it('should call findOne method in product repository', async () => {
      const spy = jest.spyOn(productsRepository, 'findOne');

      await productsService.getSingleProduct(1);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return single product if id found', async () => {
      const data = await productsService.getSingleProduct(2);
      expect(data).toBeDefined();
      expect(data).toMatchObject(products[1]);
    });

    it('should return error if id not found', async () => {
      expect.assertions(1);
      try {
        await productsService.getSingleProduct(5);
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product not found' });
      }
    });
  });

  describe('Update Product', () => {
    const title = 'product updated';

    it('should call getSingleProduct method in product service', async () => {
      const spy = jest.spyOn(productsService, 'getSingleProduct');

      await productsService.updateProduct(1, { title });
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(products).toHaveLength(4);
    });

    it('should call save method in product repository', async () => {
      const spy = jest.spyOn(productsRepository, 'save');

      await productsService.updateProduct(1, { title });
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return updated product if id found', async () => {
      const updatedProduct = await productsService.updateProduct(1, { title });
      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.title).toBe(title);
    });

    it('should return error if id not found', async () => {
      expect.assertions(1);
      try {
        await productsService.updateProduct(5, { title });
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product not found' });
      }
    });
  });

  describe('Delete Product', () => {
    it('should call getSingleProduct method in product service', async () => {
      const spy = jest.spyOn(productsService, 'getSingleProduct');

      await productsService.deleteProduct(1);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call remove method in product repository', async () => {
      const spy = jest.spyOn(productsRepository, 'remove');

      await productsService.deleteProduct(1);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return removed product if id found and remove it from products', async () => {
      const deletedProduct = await productsService.deleteProduct(1);
      expect(deletedProduct).toBeDefined();
      expect(deletedProduct.title).toBe('Book');
      expect(products).toHaveLength(3);
    });

    it('should return error if id not found', async () => {
      expect.assertions(1);
      try {
        await productsService.deleteProduct(5);
      } catch (error) {
        expect(error).toMatchObject({ message: 'Product not found' });
      }
    });
  });
});
