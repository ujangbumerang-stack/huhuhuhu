import { Global, Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Global()
@Module({})
export class FirebaseModule implements OnModuleInit {
  private readonly logger = new Logger(FirebaseModule.name);

  constructor(private cfg: ConfigService) { }

  onModuleInit() {
    if (admin.apps.length) return; // already initialized

    const projectId = this.cfg.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.cfg.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.cfg.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase env vars missing — Google login disabled');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });

    this.logger.log('Firebase Admin initialized');
  }
}

export { admin as firebaseAdmin };
