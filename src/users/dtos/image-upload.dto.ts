import { ApiProperty } from '@nestjs/swagger';
import type { Express } from 'express';

export class UploadImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: true,
    name: 'user-image',
  })
  file: Express.Multer.File;
}
