import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/prisma/prisma.service';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '@/common/decorators/publicRoute.decorator';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 公开接口跳过
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // 没有 @Roles 装饰器的接口不拦截
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const userId = (request as any).user?.sub as string;
    if (!userId) throw new ForbiddenException('未登录');

    const teamId = await this.resolveTeamId(request);
    if (!teamId) throw new ForbiddenException('无法确定团队上下文');

    // 团队 Owner 始终放行
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });
    if (team?.ownerId === userId) return true;

    // 查询用户在团队中的角色
    const member = await this.prisma.teamMember.findFirst({
      where: { teamId, userId },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('你不是该团队的成员');

    if (!requiredRoles.includes(member.role)) {
      throw new ForbiddenException('权限不足，当前角色无法执行此操作');
    }

    return true;
  }

  private async resolveTeamId(request: FastifyRequest): Promise<string | null> {
    const body = (request.body as any) || {};
    const query = (request.query as any) || {};
    const params = (request.params as any) || {};

    // 1. 直接提供 teamId
    if (body.teamId) return body.teamId;
    if (query.teamId) return query.teamId;

    // 2. 通过 projectId 反查
    const projectId = body.projectId || query.projectId;
    if (projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { teamId: true },
      });
      return project?.teamId || null;
    }

    // 3. 通过 body.id 反查（项目 ID 或成员 ID）
    if (body.id) {
      // 先尝试作为项目 ID
      const project = await this.prisma.project.findUnique({
        where: { id: body.id },
        select: { teamId: true },
      });
      if (project) return project.teamId;

      // 再尝试作为团队成员 ID
      const member = await this.prisma.teamMember.findUnique({
        where: { id: body.id },
        select: { teamId: true },
      });
      if (member) return member.teamId;
    }

    // 4. URL params 中的 :id（teams controller）
    if (params.id) {
      const team = await this.prisma.team.findUnique({
        where: { id: params.id },
        select: { id: true },
      });
      if (team) return team.id;

      // 也可能是 invite link id
      const invite = await this.prisma.inviteLink.findUnique({
        where: { id: params.id },
        select: { teamId: true },
      });
      if (invite) return invite.teamId;
    }

    return null;
  }
}