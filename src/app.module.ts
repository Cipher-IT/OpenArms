import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseClientService } from './services';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: [`${process.env.NODE_ENV}.env`, '.env', 'keys.env'],
    isGlobal: true,
  })],
  controllers: [AppController],
  providers: [AppService, SupabaseClientService],
})
export class AppModule {}
