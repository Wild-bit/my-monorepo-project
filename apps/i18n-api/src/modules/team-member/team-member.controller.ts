import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { TeamMemberService } from './team-member.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FindTeamMembersDto, UpdateMemberRoleDto, RemoveMemberDto } from './dto';
import { formatToUTC8Time } from '@/utils/date';
import { FastifyRequest } from 'fastify';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('团队成员')
@ApiBearerAuth()
@Controller('team-members')
export class TeamMemberController {
  constructor(private readonly teamMemberService: TeamMemberService) {}

  @Get('my-role')
  @ApiOperation({ summary: '获取当前用户在团队中的角色' })
  async getMyRole(@Query('teamId') teamId: string, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    return this.teamMemberService.getMyRole(teamId, userId);
  }

  @Get('list')
  @ApiOperation({ summary: '查询团队所有成员' })
  async findAllMembers(@Query() query: FindTeamMembersDto) {
    const res = await this.teamMemberService.findAll(query);
    return res.map((item) => ({
      ...item,
      joinedAt: formatToUTC8Time(item.joinedAt),
      user: {
        ...item.user,
        lastLoginAt: item.user.lastLoginAt && formatToUTC8Time(item.user.lastLoginAt),
      },
    }));
  }

  @Post('role')
  @Roles('ADMIN')
  @ApiOperation({ summary: '修改成员角色' })
  async updateRole(@Body() dto: UpdateMemberRoleDto, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    return this.teamMemberService.updateRole(dto, userId);
  }

  @Post('remove')
  @Roles('ADMIN')
  @ApiOperation({ summary: '移除团队成员' })
  async removeMember(@Body() dto: RemoveMemberDto, @Req() req: FastifyRequest) {
    const userId = req.user?.sub as string;
    return this.teamMemberService.removeMember(dto, userId);
  }
}
