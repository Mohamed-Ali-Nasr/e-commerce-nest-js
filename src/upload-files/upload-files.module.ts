import { Module } from '@nestjs/common';
import { UploadFilesController } from './upload-files.controller';
import { CloudinaryService } from './upload-files.service';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  controllers: [UploadFilesController],
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService, CloudinaryProvider],
})
export class UploadFilesModule {}
