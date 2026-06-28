import { Module } from '@nestjs/common';
import { ArisanService } from './arisan.service';
import { ArisanController } from './arisan.controller';

@Module({ providers: [ArisanService], controllers: [ArisanController] })
export class ArisanModule {}
