import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateInviteLinkDto } from './dto/common.dto';
import { nanoid } from 'nanoid';
import { TeamRole } from '@/generated/prisma/enums';
import { generateUUID } from '@/utils/uuid';
import { PaginationQuery } from '@/common/types/pagination.types';
import { toPaginatedResult, toPaginationOptions } from '@/common/utils/pagination.util';

@Injectable()
export class InviteService {
  private readonly inviteExpireAt = 1000 * 60 * 60 * 24 * 1; // 30 days
  constructor(private readonly prismaService: PrismaService) {}

  /**
   *
   * @description 生成邀请链接
   * @param createInviteLinkDto
   * @returns
   */
  async generateLink(dto: CreateInviteLinkDto & { inviteBy: string }) {
    const member = await this.prismaService.teamMember.findFirst({
      where: {
        teamId: dto.teamId,
        userId: dto.inviteBy,
      },
    });
    if (!member || member?.role !== TeamRole.ADMIN) {
      throw new ForbiddenException('无权邀请成员,请联系管理员或者团队拥有者申请权限');
    }

    const token = nanoid();
    const res = await this.prismaService.inviteLink.create({
      data: {
        id: generateUUID(),
        token,
        teamId: dto.teamId,
        inviteBy: dto.inviteBy,
        role: TeamRole.READER,
        expiresAt: new Date(Date.now() + this.inviteExpireAt), // 30 days
        createdAt: new Date(),
      },
    });
    return res;
  }

  /**
   * @description 获取团队邀请链接列表（分页）
   */
  async getInviteLinks(teamId: string, options: PaginationQuery) {
    const paginationOptions = toPaginationOptions(options);
    const where = { teamId };
    const [items, total] = await Promise.all([
      this.prismaService.inviteLink.findMany({
        where,
        include: {
          inviter: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: paginationOptions.skip,
        take: paginationOptions.take,
      }),
      this.prismaService.inviteLink.count({ where }),
    ]);
    return toPaginatedResult(items, total, paginationOptions);
  }

  /**
   * @description 撤销邀请链接
   */
  async revokeInviteLink(id: string, userId: string) {
    const invite = await this.prismaService.inviteLink.findUnique({
      where: { id },
    });
    if (!invite) {
      throw new ForbiddenException('邀请链接不存在');
    }

    const member = await this.prismaService.teamMember.findFirst({
      where: { teamId: invite.teamId, userId },
    });
    if (!member || member.role !== TeamRole.ADMIN) {
      throw new ForbiddenException('无权撤销邀请链接');
    }

    if (invite.status !== 'ACTIVE') {
      throw new ForbiddenException('该邀请链接无法撤销');
    }

    return this.prismaService.inviteLink.update({
      where: { id },
      data: { status: 'REVOKED' },
    });
  }

  /**
   * @description 校验邀请链接 token
   */
  async validateToken(token: string) {
    const invite = await this.prismaService.inviteLink.findUnique({
      where: { token },
      include: {
        team: { select: { id: true, name: true, logo: true } },
        inviter: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (!invite) {
      throw new BadRequestException('邀请链接不存在');
    }

    if (invite.status !== 'ACTIVE') {
      throw new BadRequestException('邀请链接已失效');
    }

    if (new Date() > invite.expiresAt) {
      // 自动标记过期
      await this.prismaService.inviteLink.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('邀请链接已过期');
    }

    return {
      token: invite.token,
      role: invite.role,
      team: invite.team,
      inviter: invite.inviter,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * @description 接受邀请，加入团队
   */
  async acceptInvite(token: string, userId: string) {
    return this.prismaService.$transaction(async (tx) => {
      // 1. 校验邀请
      const invite = await tx.inviteLink.findUnique({
        where: { token },
        include: { team: { select: { slug: true } } },
      });

      if (!invite || invite.status !== 'ACTIVE') {
        throw new BadRequestException('邀请链接无效');
      }

      if (new Date() > invite.expiresAt) {
        await tx.inviteLink.update({
          where: { id: invite.id },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('邀请链接已过期');
      }

      // 2. 检查是否已是团队成员
      const existingMember = await tx.teamMember.findUnique({
        where: {
          userId_teamId: { userId, teamId: invite.teamId },
        },
      });

      if (existingMember) {
        throw new BadRequestException('你已经是该团队成员');
      }

      // 3. 写入团队成员
      await tx.teamMember.create({
        data: {
          userId,
          teamId: invite.teamId,
          role: invite.role,
        },
      });

      // 4. 更新邀请状态
      await tx.inviteLink.update({
        where: { id: invite.id },
        data: {
          status: 'USED',
          acceptedBy: userId,
        },
      });

      return { teamId: invite.teamId, teamSlug: invite.team.slug };
    });
  }
}
