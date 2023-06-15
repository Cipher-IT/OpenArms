import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseClientService } from './services';
import { HealthModule } from './health/health.module';
import { OpenaiService } from './services/openai-service.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: [`${process.env.NODE_ENV}.env`, '.env', 'keys.env'],
    isGlobal: true,
  }), HealthModule],
  controllers: [AppController],
  providers: [AppService, OpenaiService, SupabaseClientService],
})
export class AppModule {}
