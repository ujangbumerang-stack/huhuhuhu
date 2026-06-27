import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembershipGuard } from '../auth/membership.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MembershipGuard)
@Controller('communities/:communityId/dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get()
  get(@Param('communityId') communityId: string) {
    return this.svc.getDashboard(communityId);
  }
}
