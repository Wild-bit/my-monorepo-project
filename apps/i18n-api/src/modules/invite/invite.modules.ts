import { Module } from '@nestjs/common';
import { InviteService } from '@/modules/invite/invite.service';
import { InviteController } from '@/modules/invite/invite.controller';
import { TeamMemberModule } from '../team-member/team-member.modules';

@Module({
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
  imports: [TeamMemberModule],
})
export class InviteModules {}
