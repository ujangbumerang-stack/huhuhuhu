import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { CommunitiesModule } from './communities/communities.module';
import { PocketsModule } from './pockets/pockets.module';
import { ContributionsModule } from './contributions/contributions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ArisanModule } from './arisan/arisan.module';
import { ForumModule } from './forum/forum.module';
import { EventsModule } from './events/events.module';
import { PaymentsModule } from './payments/payments.module';
import { WalletModule } from './wallet/wallet.module';
import { UploadModule } from './upload/upload.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FirebaseModule,
    AuthModule,
    CommunitiesModule,
    PocketsModule,
    ContributionsModule,
    DashboardModule,
    ArisanModule,
    ForumModule,
    EventsModule,
    PaymentsModule,
    WalletModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
