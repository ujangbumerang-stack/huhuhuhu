import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { name: string; slug?: string; description?: string; logoUrl?: string; themeColor?: string }) {
    const community = await this.prisma.community.create({
      data: { ...data, createdById: userId },
    });
    // Creator becomes admin
    await this.prisma.membership.create({
      data: { communityId: community.id, userId, role: 'admin', status: 'active' },
    });
    // Default payment config
    await this.prisma.paymentConfig.create({
      data: { communityId: community.id },
    });
    return community;
  }

  findMine(userId: string) {
    return this.prisma.community.findMany({
      where: { memberships: { some: { userId, status: 'active' } } },
      include: { _count: { select: { memberships: true } } },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.community.findUnique({
      where: { id },
      include: { paymentConfig: { select: { method: true, bankName: true, accountNumber: true, accountHolder: true, isActive: true } } },
    });
    if (!c) throw new NotFoundException('Community not found');
    return c;
  }

  async update(id: string, data: Partial<{ name: string; description: string; logoUrl: string; themeColor: string }>) {
    return this.prisma.community.update({ where: { id }, data });
  }

  // Members
  getMembers(communityId: string) {
    return this.prisma.membership.findMany({
      where: { communityId },
      include: { user: { select: { id: true, email: true, name: true, avatarUrl: true } } },
    });
  }

  addMember(communityId: string, data: { userId?: string; email?: string; role?: 'admin' | 'member' }) {
    // ponytail: simplified — real invite flow would look up by email first
    return this.prisma.membership.create({
      data: { communityId, userId: data.userId!, role: data.role ?? 'member', status: 'active' },
    });
  }

  updateMember(communityId: string, membershipId: string, data: { role?: 'admin' | 'member'; status?: 'active' | 'inactive' }) {
    return this.prisma.membership.update({
      where: { id: membershipId, communityId },
      data,
    });
  }
}
