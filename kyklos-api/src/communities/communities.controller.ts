import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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

  @ApiBody({ schema: { type: 'object', example: { name: 'My Community', type: 'Arisan', description: 'Deskripsi', themeColor: '#FFFFFF', requiresApproval: false } } })
  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.svc.create(req.user.id, body);
  }

  // by-slug BEFORE :id to avoid conflict
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.svc.findBySlug(slug);
  }


  @Get('users/search')
  searchUsers(@Query('q') q: string) {
    return this.svc.searchUsers(q ?? '');
  }

  // Sub-routes BEFORE :communityId to avoid conflict
  @Get(':communityId/members')
  @UseGuards(MembershipGuard)
  getMembers(@Param('communityId') id: string) {
    return this.svc.getMembers(id);
  }

  @ApiBody({ schema: { type: 'object', example: { userId: '123', role: 'member' } } })
  @Post(':communityId/members')
  @UseGuards(AdminGuard)
  addMember(@Param('communityId') id: string, @Body() body: any) {
    return this.svc.addMember(id, body);
  }

  @ApiBody({ schema: { type: 'object', example: { role: 'admin', status: 'active' } } })
  @Patch(':communityId/members/:mid')
  @UseGuards(AdminGuard)
  updateMember(@Param('communityId') id: string, @Param('mid') mid: string, @Body() body: any) {
    return this.svc.updateMember(id, mid, body);
  }

  @Delete(':communityId/members/:mid')
  @UseGuards(AdminGuard)
  removeMember(@Param('communityId') id: string, @Param('mid') mid: string) {
    return this.svc.removeMember(id, mid);
  }

  // Self-join via invite (no AdminGuard — any authed user)
  @Post(':communityId/join')
  join(@Param('communityId') id: string, @Request() req: any) {
    return this.svc.join(id, req.user.id);
  }

  @Get(':communityId')
  @UseGuards(MembershipGuard)
  findOne(@Param('communityId') id: string) {
    return this.svc.findOne(id);
  }

  @ApiBody({ schema: { type: 'object', example: { name: 'Updated Name', description: 'Updated Description', themeColor: '#000000', rules: 'No spam', requiresApproval: true } } })
  @Patch(':communityId')
  @UseGuards(AdminGuard)
  update(@Param('communityId') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }
}
