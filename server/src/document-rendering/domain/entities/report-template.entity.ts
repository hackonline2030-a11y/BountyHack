import { ReportTemplateReadModel } from '../../application/read-models/report-template.read-model';
import { InvalidReportTemplateError } from '../errors/invalid-report-template.error';
import { LocaleCode } from '../value-objects/locale-code.value-object';
import { TemplateName } from '../value-objects/template-name.value-object';

export class ReportTemplate {
  private constructor(private readonly readModel: ReportTemplateReadModel) {}

  static create(readModel: ReportTemplateReadModel): ReportTemplate {
    const templateName = TemplateName.create(readModel.templateName);
    const htmlLang = LocaleCode.create(readModel.htmlLang);

    if (!(readModel.templateStylesheetUrl || '').trim()) {
      throw new InvalidReportTemplateError(
        'ReportTemplate requires a templateStylesheetUrl.',
      );
    }

    return new ReportTemplate({
      ...readModel,
      templateName: templateName.toString(),
      htmlLang: htmlLang.toString(),
    });
  }

  get templateName(): string {
    return this.readModel.templateName;
  }

  toReadModel(): ReportTemplateReadModel {
    return this.readModel;
  }
}
