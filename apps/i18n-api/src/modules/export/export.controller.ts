import { Controller, Get, Query, Res } from '@nestjs/common';
import { ExportService } from './export.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import archiver from 'archiver';
import dayjs from 'dayjs';
import type { FastifyReply } from 'fastify';

@ApiTags('导出')
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @ApiOperation({ summary: '导出 JSON 压缩包' })
  @Get('json-zip')
  async exportJsonZip(
    @Query('projectId') projectId: string,
    @Res() response: FastifyReply,
  ) {
    const res = await this.exportService.exportJsonZip(projectId);

    response.header('Content-Type', 'application/zip');
    response.header('Content-Disposition', 'attachment; filename="translations.zip"');

    const zip = archiver('zip');

    for (const lang of Object.keys(res)) {
      zip.append(JSON.stringify(res[lang], null, 2), { name: `${lang}.json` });
    }

    const allData = {
      projectId,
      exportedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      translations: res,
    };
    zip.append(JSON.stringify(allData, null, 2), { name: 'all.json' });

    zip.finalize();

    return response.send(zip);
  }
}
