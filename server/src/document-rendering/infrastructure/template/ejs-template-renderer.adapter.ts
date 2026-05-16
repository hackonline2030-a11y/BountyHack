import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import { readFile } from 'fs/promises';
import * as path from 'path';
import {
  ITemplateRenderer,
} from '../../application/ports/template-renderer.port';
import { ReportTemplate } from '../../domain/entities/report-template.entity';
import { TemplateNotFoundError } from '../../application/errors/pdf-application.errors';

@Injectable()
export class EjsTemplateRendererAdapter implements ITemplateRenderer {
  private readonly templatesRootPath = path.resolve(process.cwd(), 'templates');

  async renderReport(data: ReportTemplate): Promise<string> {
    return this.renderTemplate(data.toReadModel(), data.templateName);
  }

  private async renderTemplate(
    /** Read models are plain objects for EJS locals; avoid `Record<string, unknown>` (no index signature on interfaces). */
    data: object,
    templateName: string,
  ): Promise<string> {
    const templatePath = path.resolve(
      this.templatesRootPath,
      templateName,
      'index.ejs',
    );
    let template: string;
    try {
      template = await readFile(templatePath, 'utf-8');
    } catch {
      throw new TemplateNotFoundError(templatePath);
    }

    return ejs.render(template, { data });
  }
}
