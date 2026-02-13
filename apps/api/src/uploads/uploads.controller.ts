import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Ensure uploaded-images folder exists
const uploadDir = path.join(process.cwd(), 'uploaded-images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller('uploads')
export class UploadsController {
  @Post('image')
  async uploadImage(@Body() body: { image: string; folder?: string }) {
    try {
      const { image, folder = 'general' } = body;

      if (!image) {
        throw new BadRequestException('No image provided');
      }

      // Extract base64 data from data URL
      const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        throw new BadRequestException('Invalid image format. Expected base64 data URL');
      }

      const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Create subfolder if specified
      const subfolderPath = path.join(uploadDir, folder);
      if (!fs.existsSync(subfolderPath)) {
        fs.mkdirSync(subfolderPath, { recursive: true });
      }

      // Generate unique filename
      const filename = `${crypto.randomUUID()}.${extension}`;
      const filepath = path.join(subfolderPath, filename);

      // Save file
      fs.writeFileSync(filepath, buffer);

      // Return the URL path (relative to server)
      const imageUrl = `/uploaded-images/${folder}/${filename}`;

      return { url: imageUrl, filename };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error uploading image:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  @Post('images')
  async uploadMultipleImages(@Body() body: { images: string[]; folder?: string }) {
    try {
      const { images, folder = 'general' } = body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        throw new BadRequestException('No images provided');
      }

      const results: { url: string; filename: string }[] = [];

      for (const image of images) {
        const result = await this.uploadImage({ image, folder });
        results.push(result);
      }

      return { urls: results.map(r => r.url), files: results };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error uploading images:', error);
      throw new BadRequestException('Failed to upload images');
    }
  }
}