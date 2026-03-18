import { IsArray, IsEnum, IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ImportFileDto {
  @ApiProperty({ description: '语言代码，如 zh-CN、en' })
  @IsString()
  @IsNotEmpty()
  lang: string;

  @ApiProperty({ description: '翻译内容，支持嵌套 JSON', example: { common: { submit: '提交' } } })
  @IsObject()
  @IsNotEmpty()
  translations: Record<string, any>;
}

export class ImportDto {
  @ApiProperty({ description: '项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: '冲突策略', enum: ['skip', 'overwrite'] })
  @IsEnum(['skip', 'overwrite'])
  strategy: 'skip' | 'overwrite';

  @ApiProperty({ description: '导入文件列表', type: [ImportFileDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportFileDto)
  files: ImportFileDto[];
}
