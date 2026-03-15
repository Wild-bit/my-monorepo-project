import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKeyDto {
  @ApiProperty({ description: '项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'Key 路径，如 common.button.submit' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '翻译内容，key 为语言代码，value 为翻译文本',
    example: { 'zh-CN': '提交', en: 'Submit' },
  })
  @IsObject()
  @IsNotEmpty()
  translations: Record<string, string>;
}

export class EditKeyDto extends CreateKeyDto {
  @ApiProperty({ description: 'Key ID' })
  @IsString()
  @IsNotEmpty()
  id: string;
}
