import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import { readFile } from 'fs/promises';
import * as path from 'path';
import {
  ITemplateRenderer,
} from '../../application/ports/template-renderer.port';
import { CvTemplate } from '../../domain/entities/cv-template.entity';
import { TemplateNotFoundError } from '../../application/errors/pdf-application.errors';

@Injectable()
export class EjsTemplateRendererAdapter implements ITemplateRenderer {
  private readonly templatesRootPath = path.resolve(process.cwd(), 'templates');

  async renderCv(data: CvTemplate): Promise<string> {
    const templatePath = path.resolve(
      this.templatesRootPath,
      data.templateName,
      'index.ejs',
    );
    let template: string;
    try {
      template = await readFile(templatePath, 'utf-8');
    } catch {
      throw new TemplateNotFoundError(templatePath);
    }

    return ejs.render(template, { data: data.toReadModel() });
  }
}
