import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { KeysService } from './keys.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateKeyDto, EditKeyDto } from './dto/create-key.dto';
import { FastifyRequest } from 'fastify';

@ApiTags('国际化键')
@ApiBearerAuth()
@Controller('keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) {}

  @ApiOperation({ summary: '创建国际化键' })
  @Post('create')
  async create(@Body() body: CreateKeyDto, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    return this.keysService.create(body, userId);
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
  async delete(@Body('id') id: string, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    return this.keysService.delete(id, userId);
  }

  @ApiOperation({ summary: '编辑国际化键' })
  @Post('edit')
  async edit(@Body() body: EditKeyDto, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    return this.keysService.edit(body, userId);
  }
}
