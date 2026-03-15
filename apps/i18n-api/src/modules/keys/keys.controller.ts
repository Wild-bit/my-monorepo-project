import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { KeysService } from './keys.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateKeyDto, EditKeyDto } from './dto/create-key.dto';

@ApiTags('国际化键')
@ApiBearerAuth()
@Controller('keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @ApiOperation({ summary: '创建国际化键' })
  @Post('create')
  async create(@Body() body: CreateKeyDto) {
    return this.keysService.create(body);
  }

  @ApiOperation({ summary: '获取国际化键列表' })
  @Get('list')
  async getKeysList(
    @Query('projectId') projectId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('search') search?: string
  ) {
    return this.keysService.getKeysList(projectId, { page, pageSize, search });
  }

  @ApiOperation({ summary: '删除国际化键' })
  @Post('delete')
  async delete(@Body('id') id: string) {
    return this.keysService.delete(id);
  }

  @ApiOperation({ summary: '编辑国际化键' })
  @Post('edit')
  async edit(@Body() body: EditKeyDto) {
    return this.keysService.edit(body);
  }
}
