import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateProjectDto, DeleteProjectDto, EditProjectDto } from './dto';
import { PaginationQuery } from '@/common/types/pagination.types';
import { formatToUTC8Time } from '@/utils/date';

@ApiTags('项目')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post('create')
  @ApiOperation({ summary: '创建项目' })
  async create(@Body() body: CreateProjectDto) {
    const project = await this.projectsService.create(body);
    return {
      ...project,
      createdAt: formatToUTC8Time(project.createdAt),
      updatedAt: formatToUTC8Time(project.updatedAt),
    };
  }

  @Get('list')
  @ApiOperation({ summary: '获取项目列表' })
  async list(
    @Query('teamSlug') teamSlug: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('search') search?: string
  ) {
    const paginationQuery: PaginationQuery & { search?: string } = {
      page,
      pageSize,
      search: search || undefined,
    };
    const projects = await this.projectsService.list(teamSlug, paginationQuery);
    return {
      ...projects,
      items: projects.items.map((project) => ({
        ...project,
        createdAt: formatToUTC8Time(project.createdAt),
        updatedAt: formatToUTC8Time(project.updatedAt),
      })),
    };
  }

  @Get('project-by-slug')
  @ApiOperation({ summary: '根据 slug 获取项目' })
  async getProjectBySlug(@Query('teamSlug') teamSlug: string, @Query('slug') slug: string) {
    const project = await this.projectsService.getProjectBySlug(teamSlug, slug);
    return {
      ...project.project,
      createdAt: formatToUTC8Time(project.project.createdAt),
      updatedAt: formatToUTC8Time(project.project.updatedAt),
    };
  }

  @Post('edit')
  @ApiOperation({ summary: '编辑项目' })
  async edit(@Body() body: EditProjectDto) {
    if (body.targetLanguages && body.targetLanguages.length === 0) {
      throw new BadRequestException('项目至少需要一个目标语言');
    }
    return this.projectsService.editProject(body);
  }

  @Post('delete')
  @ApiOperation({ summary: '删除项目' })
  async delete(@Body() body: DeleteProjectDto) {
    const project = await this.projectsService.getProjectById(body.id);
    if (!project) {
      throw new NotFoundException('项目不存在');
    }
    return this.projectsService.deleteProject(body.id);
  }
}
