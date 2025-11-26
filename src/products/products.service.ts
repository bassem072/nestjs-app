import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { Between, Like, Repository } from 'typeorm';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly usersService: UsersService,
  ) {}

  public async getAllProducts(
    title?: string,
    minPrice?: number,
    maxPrice?: number,
  ) {
    const filters = {
      ...(title ? { title: Like(`%${title.toLowerCase()}%`) } : {}),
      ...(minPrice && maxPrice ? { price: Between(minPrice, maxPrice) } : {}),
    };
    return await this.productRepository.find({
      where: filters,
      relations: { user: true, reviews: true },
    });
  }

  public async createNewProduct(dto: CreateProductDto, userId: number) {
    const user = await this.usersService.getUser(userId);

    const newProduct = this.productRepository.create({
      ...dto,
      title: dto.title.toLowerCase(),
      user,
    });

    return await this.productRepository.save(newProduct);
  }

  public async getSingleProduct(id: number) {
    const product = await this.productRepository.findOne({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found', {
        description: 'No product for this id: ' + id,
      });
    }

    return product;
  }

  public async updateProduct(id: number, body: UpdateProductDto) {
    const product = await this.getSingleProduct(id);

    if (!product) {
      throw new NotFoundException('Product not found', {
        description: 'No product for this id: ' + id,
      });
    }

    product.title = body.title ?? product.title;
    product.description = body.description ?? product.description;
    product.price = body.price ?? product.price;

    return await this.productRepository.save(product);
  }

  public async deleteProduct(id: number) {
    const product = await this.getSingleProduct(id);

    if (!product) {
      throw new NotFoundException('Product not found', {
        description: 'No product for this id: ' + id,
      });
    }

    return await this.productRepository.remove(product);
  }
}
