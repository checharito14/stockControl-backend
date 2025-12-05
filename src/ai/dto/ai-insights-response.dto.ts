import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InsightDto {
  description: string;
}

export class AIInsightsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsightDto)
  insights: InsightDto[];
}
