import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CloudinaryService } from './upload-files.service';
import { Roles } from 'src/user/decorator/roles.decorator';
import { Role } from 'src/user/enum';
import { AuthGuard } from 'src/user/guard/auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

@Controller('upload-files')
export class UploadFilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  /**
   *  @docs    User can upload image or file
   *  @Route   POST /api/v1/upload-files/image
   *  @access  Private [admin, user]
   */
  @Post('image')
  @Roles(Role.Admin, Role.User)
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1000000,
            message: 'File is too large must be less than 1MB',
          }),
          new FileTypeValidator({ fileType: 'image/jpeg|image/png|image/jpg' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.uploadFile(file);

    return {
      message: 'File uploaded successfully',
      url: result.secure_url,
    };
  }

  /**
   *  @docs    Admin can upload image or file
   *  @Route   POST /api/v1/upload-files/multiple-images
   *  @access  Private [admin]
   */
  @Post('multiple-images')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('images'))
  async uploadMultipleImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1000000,
            message: 'File is too large must be less than 1MB',
          }),
          new FileTypeValidator({ fileType: 'image/jpeg|image/png|image/jpg' }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    const results = await this.cloudinaryService.uploadMultipleFiles(files);

    return {
      message: 'Files uploaded successfully',
      urls: results.map((result) => result.secure_url),
    };
  }
}
