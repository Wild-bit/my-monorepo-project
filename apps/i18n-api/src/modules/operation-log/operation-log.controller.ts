import { Controller, Get, Query } from '@nestjs/common';
import { OperationLogService } from './operation-log.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('操作记录')
@ApiBearerAuth()
@Controller('operation-log')
export class OperationLogController {
  constructor(private readonly operationLogService: OperationLogService) {}

  @ApiOperation({ summary: '获取项目操作记录列表' })
  @Get('list')
  async getList(
    @Query('projectId') projectId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.operationLogService.getList(projectId, { page, pageSize });
  }
}
