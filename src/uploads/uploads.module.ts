import { BadRequestException, Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  controllers: [UploadsController],
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './images',
        filename: (req, file, cb) => {
          const perfix = `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
          const filename = `${perfix}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) cb(null, true);
        else cb(new BadRequestException('Unsupported file format'), false);
      },
      limits: { fileSize: 1024 * 1024 * 2 },
    }),
  ],
  // imports: [MulterModule.register({ dest: 'images' })],
})
export class UploadsModule {}
