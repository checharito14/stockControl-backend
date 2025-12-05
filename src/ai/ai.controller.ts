import { Controller, Get } from '@nestjs/common';
import { AIService } from './ai.service';
import { User } from '../auth/decorators/user.decorator';
import { JwtUser } from '../auth/interfaces/jwt-payload.interface';
import { AIInsightsResponseDto } from './dto/ai-insights-response.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AIService) {}

  /**
   * GET /ai/insights
   * Obtiene los 5 insights de IA para el usuario autenticado
   * Retorna insights en cache (<24h) o genera nuevos
   */
  @Get('insights')
  async getInsights(@User() user: JwtUser): Promise<AIInsightsResponseDto> {
    const insights = await this.aiService.getInsights(+user.sub);
    return { insights };
  }
}
