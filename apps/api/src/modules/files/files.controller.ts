import { Controller, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile(
    new ParseFilePipe({
      validators: [new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 50 })],
      fileIsRequired: true,
    })
  ) file: Express.Multer.File) {
    const fileUrl = await this.filesService.uploadFile(file.originalname);
    return { fileUrl };
  }
}
