import { PartialType } from "@nestjs/swagger";
import { CreateLessonDto } from "./create-lesson.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { LessonStatus } from "../../../common/enums/lesson.enums";

export class UpdateLessonDto extends PartialType(CreateLessonDto) {
  @ApiPropertyOptional({ enum: LessonStatus })
  @IsOptional()
  @IsEnum(LessonStatus)
  status?: LessonStatus;
}
