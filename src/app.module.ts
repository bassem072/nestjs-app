import { LoggerMiddleware } from './utils/middlewares/logger.middleware';
import {
  ClassSerializerInterceptor,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { UploadsModule } from './uploads/uploads.module';
import { MailModule } from './mail/mail.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { dataSourceOption } from '../db/data-source';

@Module({
  imports: [
    ProductsModule,
    ReviewsModule,
    UsersModule,
    UploadsModule,
    MailModule,
    TypeOrmModule.forRoot(dataSourceOption),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV !== 'production'
          ? `.env.${process.env.NODE_ENV}`
          : '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 3,
      },
    ]),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: '/api/products', method: RequestMethod.GET })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

// LOCAL DATABASE
//
// {
//   inject: [ConfigService],
//   useFactory: (config: ConfigService) => {
//     return {
//       type: 'postgres',
//       database: config.get<string>('DB_NAME'),
//       username: config.get<string>('DB_USERNAME'),
//       password: config.get<string>('DB_PASSWORD'),
//       port: config.get<number>('DB_PORT'),
//       host: 'localhost',
//       synchronize: true, // This for development
//       entities: [Product, Review, User],
//     };
//   },
// }
