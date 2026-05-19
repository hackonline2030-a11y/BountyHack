import { Module } from '@nestjs/common';
import { ReportDraftModule } from '../report-draft.module';
import { ReportDraftDevController } from './report-draft-dev.controller';

/**
 * Dev-only report-draft JSON inspector — not loaded when NODE_ENV=production.
 * Remove this module before production deploy.
 */
@Module({
  imports: [ReportDraftModule],
  controllers: [ReportDraftDevController],
})
export class ReportDraftDevModule {}
