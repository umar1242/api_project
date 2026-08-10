import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery } from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialResponseDto } from './dto/material-response.dto';
import { ServiceTokenGuard } from '../../common/guards/service-token.guard';

@ApiTags('Materials')
@ApiSecurity('service-token')
@UseGuards(ServiceTokenGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new material' })
  @ApiResponse({ status: 201, type: MaterialResponseDto })
  async create(@Body() createMaterialDto: CreateMaterialDto): Promise<MaterialResponseDto> {
    return this.materialsService.create(createMaterialDto);
  }

  @Put(':id/publish')
  @ApiOperation({ summary: 'Mark material as PUBLISHED' })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  async publish(@Param('id', ParseIntPipe) id: number): Promise<MaterialResponseDto> {
    return this.materialsService.publish(BigInt(id));
  }

  @Get('group/:groupId')
  @ApiOperation({ summary: 'Get materials for a group (Student access logic)' })
  @ApiQuery({ name: 'telegramId', required: true, type: String })
  @ApiResponse({ status: 200, type: [MaterialResponseDto] })
  async findAllByGroupForStudent(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('telegramId') telegramId: string,
  ): Promise<MaterialResponseDto[]> {
    if (!telegramId) {
      throw new BadRequestException('telegramId query param is required');
    }
    return this.materialsService.findAllByGroupForStudent(BigInt(groupId), BigInt(telegramId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a material by ID' })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MaterialResponseDto> {
    return this.materialsService.findOne(BigInt(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a material' })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<MaterialResponseDto> {
    return this.materialsService.update(BigInt(id), updateMaterialDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a material' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.materialsService.remove(BigInt(id));
  }
}
