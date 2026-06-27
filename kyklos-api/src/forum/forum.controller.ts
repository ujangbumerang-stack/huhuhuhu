import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ForumService } from './forum.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembershipGuard } from '../auth/membership.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('forum')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ForumController {
  constructor(private svc: ForumService, private prisma: PrismaService) {}

  @Get('communities/:communityId/posts')
  @UseGuards(MembershipGuard)
  getPosts(@Param('communityId') communityId: string) {
    return this.svc.getPosts(communityId);
  }

  @Post('communities/:communityId/posts')
  @UseGuards(MembershipGuard)
  createPost(@Param('communityId') communityId: string, @Request() req: any, @Body() body: any) {
    return this.svc.createPost(communityId, req.user.id, body.body, body.isAnnouncement);
  }

  @Post('posts/:postId/comments')
  async addComment(@Param('postId') postId: string, @Request() req: any, @Body() body: any) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    return this.svc.addComment(postId, post!.communityId, req.user.id, body.body);
  }
}
