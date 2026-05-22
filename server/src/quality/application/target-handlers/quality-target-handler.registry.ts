import { BadRequestException, Injectable } from '@nestjs/common';
import type { QualityTargetHandler } from './quality-target-handler.interface';
import { PathCourseQualityTargetHandler } from './path-course-target.handler';
import { ReportQualityTargetHandler } from './report-target.handler';

@Injectable()
export class QualityTargetHandlerRegistry {
  private readonly byCode: Map<string, QualityTargetHandler>;

  constructor(
    reportHandler: ReportQualityTargetHandler,
    pathCourseHandler: PathCourseQualityTargetHandler,
  ) {
    const handlers: QualityTargetHandler[] = [
      reportHandler,
      pathCourseHandler,
    ];
    this.byCode = new Map(handlers.map((h) => [h.code, h]));
  }

  get(code: string): QualityTargetHandler {
    const handler = this.byCode.get(code.trim());
    if (!handler) {
      throw new BadRequestException(`Unknown quality target type: ${code}`);
    }
    return handler;
  }

  assertValidCheckContext(targetTypeCode: string, context: string): void {
    const handler = this.get(targetTypeCode);
    if (targetTypeCode === 'report') {
      (handler as ReportQualityTargetHandler).assertValidCheckContext(context);
      return;
    }
    if (targetTypeCode === 'path_course') {
      (handler as PathCourseQualityTargetHandler).assertValidCheckContext(
        context,
      );
      return;
    }
    if (!handler.supportedCheckContexts().includes(context)) {
      throw new BadRequestException(
        `Invalid check context for ${targetTypeCode}`,
      );
    }
  }
}
