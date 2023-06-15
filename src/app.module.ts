import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseClientService, ThreadService } from './services';
import { HealthModule } from './health/health.module';
import { OpenaiService } from './services/openai-service.service';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { GPTConsumer } from 'queue-processors/gpt-queue-processor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThreadConsumer } from 'queue-processors';
@Module({
  imports: [ConfigModule.forRoot({ envFilePath: [`${process.env.NODE_ENV}.env`, '.env', 'keys.env'],
    isGlobal: true,
  }), HealthModule, 
  BullModule.forRoot({
    redis: {
      host: 'redis',
      port: 6379,
      username:'default',
    },
  }),
  BullModule.registerQueue({
    name: 'gpt',
    defaultJobOptions: {
      attempts: 1,
      backoff: { type: 'exponential', delay: 1000 },
  }
  }),
  BullModule.registerQueue({
      name: 'thread-queue',
    defaultJobOptions: {
      attempts: 1,
      backoff: { type: 'exponential', delay: 1000 },
  }
  }),
  ThrottlerModule.forRoot({
    ttl: 60*60*3,
    limit: 25,
  }),
],
  controllers: [AppController],
  providers: [AppService, SupabaseClientService, OpenaiService, ThreadService, GPTConsumer, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard
  }, ThreadConsumer,
  ],
})
export class AppModule {}
