// cloudinary.service.ts

import { HttpException, Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
import * as streamifier from 'streamifier';
import { createHash } from 'crypto';

@Injectable()
export class CloudinaryService {
  // Generate SHA-256 hash of file buffer
  private generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  // Check if file exists in Cloudinary by public_id
  private async checkFileExists(public_id: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(public_id, { resource_type: 'image' });
      return true; // File exists
    } catch (error) {
      if (error.error.http_code === 404) {
        return false;
      }
      throw new HttpException(
        `Error checking file existence: ${error.erroe.message}`,
        500,
      );
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'nest-js-upload-file',
  ): Promise<CloudinaryResponse> {
    // Generate unique public_id based on file hash
    const fileHash = this.generateFileHash(file.buffer);
    const public_id = `${fileHash}`;

    // Check if file already exists
    const fileExists = await this.checkFileExists(`${folder}/${public_id}`);

    if (fileExists) {
      throw new HttpException('Image already exists in Cloudinary', 409);
    }

    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id,
          resource_type: 'auto',
          overwrite: false,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'nest-js-upload-multiple-files',
  ): Promise<CloudinaryResponse[]> {
    // Validate file count (max 5 files)
    if (files.length > 5) {
      throw new HttpException('Cannot upload more than 5 files at once', 400);
    }

    // Check for duplicates among uploaded files
    const hashes = new Set<string>();
    for (const file of files) {
      const hash = this.generateFileHash(file.buffer);

      if (hashes.has(hash)) {
        throw new HttpException(
          'Duplicate files detected in the upload batch',
          400,
        );
      }
      hashes.add(hash);
    }

    return Promise.all(files.map((file) => this.uploadFile(file, folder)));
  }
}
