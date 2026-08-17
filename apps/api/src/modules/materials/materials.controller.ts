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
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from "@nestjs/swagger";
import { MaterialsService } from "./materials.service";
import { CreateMaterialDto } from "./dto/create-material.dto";
import { UpdateMaterialDto } from "./dto/update-material.dto";
import { MaterialResponseDto } from "./dto/material-response.dto";
import { ServiceTokenGuard } from "../../common/guards/service-token.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";
import { Req } from "@nestjs/common";

@ApiTags("Materials")
@ApiSecurity("service-token")
@UseGuards(ServiceTokenGuard)
@Controller("materials")
export class MaterialsController {
  constructor(
    private readonly materialsService: MaterialsService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private async isStudentRequester(req: any): Promise<boolean> {
    const isService = !!req.headers["x-service-token"];
    const isAdminHeader = !!req.adminTelegramId;
    if (isService || isAdminHeader) return false;

    if (req.telegramUser?.id) {
      const user = await this.prisma.user.findUnique({
        where: { telegramId: BigInt(req.telegramUser.id) },
      });
      if (user && (user.role === UserRole.ADMIN || user.role === UserRole.CURATOR)) {
        return false;
      }
    }
    return true;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @ApiOperation({ summary: "Create a new material" })
  @ApiResponse({ status: 201, type: MaterialResponseDto })
  async create(
    @Req() req: any,
    @Body() createMaterialDto: CreateMaterialDto,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialsService.create(createMaterialDto);
    const userId = req.telegramUser?.id || req.adminTelegramId;
    if (userId) {
      this.auditService.logAction(
        BigInt(userId),
        "CREATE_MATERIAL",
        BigInt(material.id),
        "Material",
        createMaterialDto,
      );
    }
    return material;
  }

  @Put(":id/publish")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @ApiOperation({ summary: "Mark material as PUBLISHED" })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  async publish(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<MaterialResponseDto> {
    const material = await this.materialsService.publish(BigInt(id));
    const userId = req.telegramUser?.id || req.adminTelegramId;
    if (userId) {
      this.auditService.logAction(
        BigInt(userId),
        "PUBLISH_MATERIAL",
        BigInt(id),
        "Material",
        null,
      );
    }
    return material;
  }

  @Get("group/:groupId")
  @ApiOperation({
    summary: "Get materials for a group (all materials for admins/curators, PUBLISHED only for students)",
  })
  @ApiQuery({ name: "telegramId", required: false, type: String })
  @ApiResponse({ status: 200, type: [MaterialResponseDto] })
  async findAllByGroup(
    @Req() req: any,
    @Param("groupId", ParseIntPipe) groupId: number,
    @Query("telegramId") telegramId?: string,
  ): Promise<MaterialResponseDto[]> {
    if (telegramId) {
      return this.materialsService.findAllByGroupForStudent(
        BigInt(groupId),
        BigInt(telegramId),
      );
    }

    const isStudent = await this.isStudentRequester(req);
    return this.materialsService.findAllByGroup(BigInt(groupId), isStudent);
  }

  @Get("lesson/:lessonId")
  @ApiOperation({
    summary: "Get materials for a specific lesson (all for admins/curators, PUBLISHED only for students)",
  })
  @ApiResponse({ status: 200, type: [MaterialResponseDto] })
  async findAllByLesson(
    @Req() req: any,
    @Param("lessonId", ParseIntPipe) lessonId: number,
  ): Promise<MaterialResponseDto[]> {
    const isStudent = await this.isStudentRequester(req);
    return this.materialsService.findAllByLesson(BigInt(lessonId), isStudent);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a material by ID" })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  @ApiResponse({ status: 404, description: "Material not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<MaterialResponseDto> {
    return this.materialsService.findOne(BigInt(id));
  }

  @Put(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @ApiOperation({ summary: "Update a material" })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<MaterialResponseDto> {
    return this.materialsService.update(BigInt(id), updateMaterialDto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CURATOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a material" })
  @ApiResponse({ status: 204 })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.materialsService.remove(BigInt(id));
  }
}
