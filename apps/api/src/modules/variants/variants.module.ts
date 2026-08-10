import { Module } from '@nestjs/common';
import { VariantsController } from './variants.controller';
import { VariantsService } from './variants.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [VariantsController],
  providers: [VariantsService]
})
export class VariantsModule {}
