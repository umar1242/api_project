import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  async uploadFile(filename: string): Promise<string> {
    const id = randomUUID();
    const ext = filename.split('.').pop() || 'bin';
    return `https://s3.mock.com/file-${id}.${ext}`;
  }
}
