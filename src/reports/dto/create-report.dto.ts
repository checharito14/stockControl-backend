import { IsEnum, IsInt, Min, Max } from 'class-validator';

export class CreateReportDto {
  @IsEnum(['weekly', 'monthly'])
  type: 'weekly' | 'monthly';

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsInt()
  @Min(1)
  @Max(53) // Máximo 53 semanas o 12 meses
  period: number;
}
