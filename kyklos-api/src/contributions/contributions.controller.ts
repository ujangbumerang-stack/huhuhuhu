import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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

  @ApiBody({ schema: { type: 'object', example: { title: 'Uang Kas', amount: 50000, dueDate: '2026-07-10', frequency: 'monthly', isMandatory: true } } })
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

  @Get('communities/:communityId/contributions/mine')
  @UseGuards(MembershipGuard)
  mine(@Param('communityId') communityId: string, @Request() req: any) {
    return this.svc.myContributions(req.user.id, communityId);
  }

  @ApiBody({ schema: { type: 'object', example: { title: 'Uang Kas Revisi', amount: 75000 } } })
  @Patch('dues/:id')
  @UseGuards(AdminGuard)
  updateDues(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateDues(id, body);
  }

  @Post('dues/:id/generate')
  generate(@Param('id') id: string, @Request() req: any) {
    // service validates admin role internally
    return this.svc.generateContributions(id, req.user.id);
  }

  @ApiBody({ schema: { type: 'object', example: { proofUrl: 'https://example.com/receipt.jpg' } } })
  @Post('contributions/:id/report')
  report(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.svc.reportPayment(id, req.user.id, body.proofUrl);
  }

  @Post('contributions/:id/verify')
  verify(@Param('id') id: string, @Request() req: any) {
    return this.svc.verifyPayment(id, req.user.id);
  }

  @Post('contributions/:id/simulate-pay')
  simulatePay(@Param('id') id: string, @Request() req: any) {
    return this.svc.simulatePayment(id, req.user.id);
  }
}
