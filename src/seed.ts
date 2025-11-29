import { NestFactory } from '@nestjs/core';
import { SeederService } from './seeder/seeder.service';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeederService);

  // Obtener el userId del argumento de línea de comandos
  const userId = process.argv[2] ? parseInt(process.argv[2]) : 1;

  try {
    console.log(`🌱 Starting seeding for user ${userId}...`);
    await seeder.seed(userId);
    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed!', error);
  } finally {
    await app.close();
  }
}

bootstrap();
