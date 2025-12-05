import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { InsightData } from './entities/ai-insight.entity';

export interface SalesMetrics {
  totalSales: number;
  transactionCount: number;
  averageTicket: number;
  growthPercentage?: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  bestDayOfWeek?: string;
}

export interface StockMetrics {
  lowStockProducts: Array<{
    name: string;
    stock: number;
    soldLast30Days?: number;
  }>;
  totalProducts: number;
}

export interface CouponMetrics {
  totalCoupons: number;
  usedCoupons: number;
  discountImpact: number;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private groq: Groq;

  constructor(private configService: ConfigService) {
   
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new Error('GROQ_API_KEY no está configurada en el archivo .env');
    }

    this.groq = new Groq({ apiKey });
  }

  
  async generateInsights(
    salesMetrics: SalesMetrics,
    stockMetrics: StockMetrics,
    couponMetrics: CouponMetrics,
  ): Promise<InsightData[]> {
    // 1. Preparar los datos en formato JSON limpio
    const metrics = {
      ventas: {
        total: salesMetrics.totalSales,
        transacciones: salesMetrics.transactionCount,
        ticketPromedio: salesMetrics.averageTicket,
        crecimiento: salesMetrics.growthPercentage,
        mejorDia: salesMetrics.bestDayOfWeek,
      },
      productosTop: salesMetrics.topProducts.map((p) => ({
        nombre: p.name,
        cantidadVendida: p.quantity,
        ingresos: p.revenue,
      })),
      inventario: {
        totalProductos: stockMetrics.totalProducts,
        productosStockBajo: stockMetrics.lowStockProducts.map((p) => ({
          nombre: p.name,
          stock: p.stock,
          vendidosUltimos30Dias: p.soldLast30Days,
        })),
      },
      cupones: {
        activos: couponMetrics.totalCoupons,
        utilizados: couponMetrics.usedCoupons,
        descuentoTotal: couponMetrics.discountImpact,
      },
    };

    this.logger.log('Generando insights con Groq (Llama 3.3 - GRATIS)...');

    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', 
      messages: [
        {
          role: 'system',
          content: `Eres un asistente inteligente para dueños de tienditas en México.
Analiza los datos del negocio y genera exactamente 5 insights accionables.
IMPORTANTE: Incluye predicciones y recomendaciones basadas en patrones.

Responde SOLO con JSON en este formato:
{
  "insights": [
    { "description": "frase corta y accionable" }
  ]
}

Tipos de insights que DEBES incluir:
1. Análisis de tendencias actuales (ventas, productos)
2. Predicciones futuras basadas en patrones ("La próxima semana...", "Este fin de semana...")
3. Recomendaciones de restock con prioridad
4. Identificación del mejor día/horario para ventas
5. Oportunidades de crecimiento o alertas

Ejemplos de frases:
• "Tus ventas crecieron 23% esta semana, la tendencia seguirá al alza."
• "Los viernes vendes 40% más, prepara más inventario para el próximo."
• "Coca Cola 600ml se agotará en 3 días al ritmo actual, reabastece YA."
• "Pan Bimbo se vende más los lunes, aumenta pedido este fin de semana."
• "La próxima semana podrías vender 15% más si tienes suficiente stock."`,
        },
        {

          role: 'user',
          content: `Analiza estos datos del negocio y genera 5 insights con predicciones:

${JSON.stringify(metrics, null, 2)}

Identifica patrones temporales (días de la semana, tendencias) y haz predicciones específicas.`,
        },
      ],
      response_format: { type: 'json_object' }, 
      temperature: 0.7, 
      max_tokens: 800, 
    });

   
    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Groq no devolvió respuesta');
    }

    // 4. Convertir el texto JSON a objeto JavaScript
    const parsed = JSON.parse(content);

    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      throw new Error('Respuesta de Groq con formato incorrecto');
    }

    this.logger.log(
      `Se generaron ${parsed.insights.length} insights (GRATIS con Groq)`,
    );

    return parsed.insights.slice(0, 5);
  }
}
