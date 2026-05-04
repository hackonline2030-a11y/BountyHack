import { CvTemplateReadModel } from '../../application/read-models/cv-template.read-model';
import { InvalidCvTemplateError } from '../errors/invalid-cv-template.error';
import { LocaleCode } from '../value-objects/locale-code.value-object';
import { TemplateName } from '../value-objects/template-name.value-object';

export class CvTemplate {
  private constructor(private readonly readModel: CvTemplateReadModel) {}

  static create(readModel: CvTemplateReadModel): CvTemplate {
    const templateName = TemplateName.create(readModel.templateName);
    const htmlLang = LocaleCode.create(readModel.htmlLang);

    if (!(readModel.fullName || '').trim()) {
      throw new InvalidCvTemplateError('CvTemplate requires a fullName.');
    }
    if (!(readModel.jobTitle || '').trim()) {
      throw new InvalidCvTemplateError('CvTemplate requires a jobTitle.');
    }
    if (!(readModel.profileImage || '').trim()) {
      throw new InvalidCvTemplateError('CvTemplate requires a profileImage URL.');
    }

    return new CvTemplate({
      ...readModel,
      templateName: templateName.toString(),
      htmlLang: htmlLang.toString(),
    });
  }

  get templateName(): string {
    return this.readModel.templateName;
  }

  toReadModel(): CvTemplateReadModel {
    return this.readModel;
  }
}
