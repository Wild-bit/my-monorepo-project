import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TranslateService, TranslateDto } from './translate.service';

@ApiTags('翻译')
@ApiBearerAuth()
@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @ApiOperation({ summary: 'AI 翻译' })
  @Post('ai')
  async translate(@Body() body: TranslateDto) {
    return this.translateService.translate(body);
  }
}
