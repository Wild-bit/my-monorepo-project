import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateInviteLinkDto {
  @ApiPropertyOptional({ description: '团队Id' })
  @IsString()
  @IsNotEmpty()
  teamId: string;
}
