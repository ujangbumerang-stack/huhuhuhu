import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  getPosts(communityId: string) {
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
    return this.prisma.post.create({
      data: { communityId, authorId, body, isAnnouncement },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  addComment(postId: string, communityId: string, authorId: string, body: string) {
    return this.prisma.comment.create({
      data: { postId, communityId, authorId, body },
      include: { author: { select: { id: true, name: true } } },
    });
  }
}
