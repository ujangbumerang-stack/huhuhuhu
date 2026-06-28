import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name);

  constructor(private prisma: PrismaService) {}

  getPosts(communityId: string) {
    this.logger.debug(`Fetching posts for community ${communityId}`);
    return this.prisma.post.findMany({
      where: { communityId },
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPost(communityId: string, authorId: string, body: string, isAnnouncement = false) {
    this.logger.log(`New post by ${authorId} in community ${communityId} (announcement=${isAnnouncement})`);
    return this.prisma.post.create({
      data: { communityId, authorId, body, isAnnouncement },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  getComments(postId: string) {
    this.logger.debug(`Fetching comments for post ${postId}`);
    return this.prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  addComment(postId: string, communityId: string, authorId: string, body: string) {
    this.logger.log(`New comment by ${authorId} on post ${postId}`);
    return this.prisma.comment.create({
      data: { postId, communityId, authorId, body },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new Error('Post not found');
    // admin of community OR author can delete
    const isAuthor = post.authorId === userId;
    const isAdmin = await this.prisma.membership.findFirst({
      where: { communityId: post.communityId, userId, role: 'admin' },
    });
    if (!isAuthor && !isAdmin) throw new Error('Forbidden');
    this.logger.log(`Deleting post ${postId} by user ${userId}`);
    return this.prisma.post.delete({ where: { id: postId } });
  }
}
