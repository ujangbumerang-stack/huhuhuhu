import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PocketsService } from './pockets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembershipGuard } from '../auth/membership.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('pockets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PocketsController {
  constructor(private svc: PocketsService, private prisma: PrismaService) {}

  @Get('communities/:communityId/pockets')
  @UseGuards(MembershipGuard)
  list(@Param('communityId') communityId: string) {
    return this.svc.list(communityId);
  }

  @Post('communities/:communityId/pockets')
  @UseGuards(AdminGuard)
  create(@Param('communityId') communityId: string, @Body() body: any) {
    return this.svc.create(communityId, body);
  }

  @Get('pockets/:id/transactions')
  async getTransactions(@Param('id') id: string, @Request() req: any) {
    // Verify membership via pocket -> community
    const pocket = await this.svc.findOne(id);
    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: pocket.communityId, userId: req.user.id } },
    });
    if (!m || m.status !== 'active') return [];
    return this.svc.getTransactions(id);
  }

  @Post('pockets/:id/transactions')
  async recordTransaction(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const pocket = await this.svc.findOne(id);
    const m = await this.prisma.membership.findUnique({
      where: { communityId_userId: { communityId: pocket.communityId, userId: req.user.id } },
    });
    if (!m || m.status !== 'active' || m.role !== 'admin') {
      throw new Error('Admin access required');
    }
    return this.svc.recordTransaction(id, req.user.id, body);
  }
}
