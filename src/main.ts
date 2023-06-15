import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.setGlobalPrefix('api');
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
		}),
	);

	const config = new DocumentBuilder()
		.setTitle('OpenArms API')
		.setDescription('Cipher - OpenArms API description')
		.setVersion('1.0')
		.addTag('openarms')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				name: 'JWT',
				description: 'Enter JWT token',
				in: 'header',
			},
			'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
		)
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/swagger', app, document);
	app.enableCors();
	await app.listen(3000);
}
bootstrap();
