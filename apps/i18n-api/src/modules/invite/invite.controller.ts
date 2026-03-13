import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { InviteService } from './invite.service';
import { CreateInviteLinkDto } from './dto/common.dto';
import { formatToUTC8Time } from '@/utils/date';
import { PublicRoute } from '@/common/decorators/publicRoute.decorator';
import { PaginationQuery } from '@/common/types/pagination.types';

@Controller('invite')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('create')
  async create(@Body() body: CreateInviteLinkDto, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    const res = await this.inviteService.generateLink({ ...body, inviteBy: userId });
    return {
      ...res,
      expiresAt: formatToUTC8Time(res.expiresAt),
      createdAt: formatToUTC8Time(res.createdAt),
    };
  }

  @Get('list')
  async list(
    @Query('teamId') teamId: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    const paginationQuery: PaginationQuery = { page, pageSize };
    const result = await this.inviteService.getInviteLinks(teamId, paginationQuery);
    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        expiresAt: formatToUTC8Time(item.expiresAt),
        createdAt: formatToUTC8Time(item.createdAt),
      })),
    };
  }

  @Post('revoke/:id')
  async revoke(@Param('id') id: string, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    await this.inviteService.revokeInviteLink(id, userId);
    return { message: '邀请已撤销' };
  }

  @PublicRoute()
  @Get('validate')
  async validate(@Query('token') token: string) {
    const result = await this.inviteService.validateToken(token);
    return {
      ...result,
      expiresAt: formatToUTC8Time(result.expiresAt),
    };
  }

  @Post('accept')
  async accept(@Body('token') token: string, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    return this.inviteService.acceptInvite(token, userId);
  }
}
