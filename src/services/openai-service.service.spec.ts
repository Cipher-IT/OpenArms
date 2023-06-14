import { Test, TestingModule } from '@nestjs/testing';
import { OpenaiServiceService } from './openai-service.service';

describe('OpenaiServiceService', () => {
  let service: OpenaiServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpenaiServiceService],
    }).compile();

    service = module.get<OpenaiServiceService>(OpenaiServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
