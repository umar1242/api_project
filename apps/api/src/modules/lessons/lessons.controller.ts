import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from "@nestjs/swagger";
import { LessonsService } from "./lessons.service";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { LessonResponseDto } from "./dto/lesson-response.dto";
import { ServiceTokenGuard } from "../../common/guards/service-token.guard";

@ApiTags("Lessons")
@ApiSecurity("service-token")
@UseGuards(ServiceTokenGuard)
@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new lesson for a group" })
  @ApiResponse({ status: 201, type: LessonResponseDto })
  async create(@Body() dto: CreateLessonDto): Promise<LessonResponseDto> {
    return this.lessonsService.create(dto);
  }

  @Get("group/:groupId")
  @ApiOperation({ summary: "Get all lessons for a group (student's schedule)" })
  @ApiQuery({ name: "skip", required: false, type: Number })
  @ApiQuery({ name: "take", required: false, type: Number })
  @ApiResponse({ status: 200 })
  async findAllByGroup(
    @Param("groupId", ParseIntPipe) groupId: number,
    @Query("skip") skip?: number,
    @Query("take") take?: number,
  ): Promise<{ data: LessonResponseDto[]; total: number }> {
    return this.lessonsService.findAllByGroup(BigInt(groupId), { skip, take });
  }

  @Get("group/:groupId/upcoming")
  @ApiOperation({
    summary: "Get upcoming lessons for a group (for the schedule widget)",
  })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, type: [LessonResponseDto] })
  async findUpcoming(
    @Param("groupId", ParseIntPipe) groupId: number,
    @Query("limit") limit?: number,
  ): Promise<LessonResponseDto[]> {
    return this.lessonsService.findUpcoming(BigInt(groupId), limit ?? 5);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a lesson by ID" })
  @ApiResponse({ status: 200, type: LessonResponseDto })
  @ApiResponse({ status: 404, description: "Lesson not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.findOne(BigInt(id));
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a lesson" })
  @ApiResponse({ status: 200, type: LessonResponseDto })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLessonDto,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.update(BigInt(id), dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a lesson" })
  @ApiResponse({ status: 204 })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.lessonsService.remove(BigInt(id));
  }

  // TODO: Implement attendance endpoint (out of scope for current stage according to project_plan.md Stage 3/7).
  // Once implemented, add a call to GamificationService.addCoins(..., attendanceReward) for attending students.
}
