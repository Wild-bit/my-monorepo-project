import { Body, Controller, Post } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportDto } from './dto/import.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('导入')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @ApiOperation({ summary: '导入 JSON 翻译' })
  @Post('json')
  async importJson(@Body() dto: ImportDto) {
    return this.importService.importJson(dto);
  }
}
