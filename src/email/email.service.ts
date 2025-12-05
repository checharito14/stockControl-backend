import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Client } from '../clients/entities/client.entity';
import { Coupon } from '../coupons/entities/coupon.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
  }

  async sendCouponNotification(
    clients: Client[],
    coupon: Coupon,
    user: User,
  ): Promise<void> {
    if (!clients || clients.length === 0) {
      this.logger.warn('No hay clientes para enviar notificación');
      return;
    }

    const emailAddresses = clients
      .filter(client => client.email)
      .map(client => client.email);

    if (emailAddresses.length === 0) {
      this.logger.warn('No hay clientes con email válido');
      return;
    }

    const htmlBody = this.buildEmailTemplate(coupon, user);

    try {
     
      const batchSize = 50;
      for (let i = 0; i < emailAddresses.length; i += batchSize) {
        const batch = emailAddresses.slice(i, i + batchSize);
        
        const command = new SendEmailCommand({
          Source: process.env.AWS_SES_FROM_EMAIL,
          Destination: {
            BccAddresses: batch,
          },
          Message: {
            Subject: {
              Data: `¡Nuevo cupón de descuento en ${user.storeName}!`,
              Charset: 'UTF-8',
            },
            Body: {
              Html: {
                Data: htmlBody,
                Charset: 'UTF-8',
              },
            },
          },
        });

        await this.sesClient.send(command);
        this.logger.log(`Email enviado a ${batch.length} clientes (lote ${Math.floor(i / batchSize) + 1})`);
      }
    } catch (error) {
      this.logger.error('Error al enviar emails:', error);
     
    }
  }

  private buildEmailTemplate(coupon: Coupon, user: User): string {
    const expirationDate = new Date(coupon.expirationDate).toLocaleDateString('es-ES');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">          
          <div style="padding: 30px; background-color: #f9fafb; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #374151;">Hola,</p>
            <p style="font-size: 16px; color: #374151;">
              <strong>${user.storeName}</strong> tiene un nuevo cupón de descuento para ti:
            </p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 10px 0; font-size: 14px; color: #6b7280;">Código del cupón:</p>
              <p style="margin: 10px 0; font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px;">
                ${coupon.name}
              </p>
              
              <p style="margin: 10px 0; font-size: 14px; color: #6b7280;">Descuento:</p>
              <p style="margin: 10px 0; font-size: 32px; font-weight: bold; color: #10b981;">
                ${coupon.discountPercentage}%
              </p>
              
              <p style="margin: 10px 0; font-size: 14px; color: #6b7280;">Válido hasta:</p>
              <p style="margin: 10px 0; font-size: 18px; font-weight: bold; color: #ef4444;">
                ${expirationDate}
              </p>
            </div>
            
            <p style="font-size: 16px; color: #374151;">
              ¡No te lo pierdas! Usa este cupón en tu próxima compra.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>Saludos,<br><strong>${user.storeName}</strong></p>
          </div>
        </body>
      </html>
    `;
  }
}
