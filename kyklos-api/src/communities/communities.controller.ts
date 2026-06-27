import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembershipGuard } from '../auth/membership.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('communities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private svc: CommunitiesService) {}

  @Get()
  mine(@Request() req: any) {
    return this.svc.findMine(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.svc.create(req.user.id, body);
  }

  @Get(':id')
  @UseGuards(MembershipGuard)
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Get(':communityId/members')
  @UseGuards(MembershipGuard)
  getMembers(@Param('communityId') communityId: string) {
    return this.svc.getMembers(communityId);
  }

  @Post(':communityId/members')
  @UseGuards(AdminGuard)
  addMember(@Param('communityId') communityId: string, @Body() body: any) {
    return this.svc.addMember(communityId, body);
  }

  @Patch(':communityId/members/:mid')
  @UseGuards(AdminGuard)
  updateMember(@Param('communityId') communityId: string, @Param('mid') mid: string, @Body() body: any) {
    return this.svc.updateMember(communityId, mid, body);
  }
}
