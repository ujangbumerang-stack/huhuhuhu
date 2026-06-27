import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContributionsService } from './contributions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembershipGuard } from '../auth/membership.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('contributions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ContributionsController {
  constructor(private svc: ContributionsService) {}

  @Get('communities/:communityId/dues')
  @UseGuards(MembershipGuard)
  listDues(@Param('communityId') communityId: string) {
    return this.svc.listDues(communityId);
  }

  @Post('communities/:communityId/dues')
  @UseGuards(AdminGuard)
  createDues(@Param('communityId') communityId: string, @Body() body: any) {
    return this.svc.createDues(communityId, body);
  }

  @Get('communities/:communityId/contributions')
  @UseGuards(MembershipGuard)
  list(@Param('communityId') communityId: string) {
    return this.svc.listContributions(communityId);
  }

  @Post('contributions/:id/report')
  report(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.svc.reportPayment(id, req.user.id, body.proofUrl);
  }

  @Post('contributions/:id/verify')
  verify(@Param('id') id: string, @Request() req: any) {
    return this.svc.verifyPayment(id, req.user.id);
  }
}
