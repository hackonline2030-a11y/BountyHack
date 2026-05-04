/** Right/left column section titles & fallbacks rendered by templates (localized). */
export interface CvTemplateLabels {
  languages: string;
  interests: string;
  experience: string;
  education: string;
  previousExperience: string;
  placeholderFullName: string;
  placeholderJobTitle: string;
  portfolioFallback: string;
  skillGroupFallback: string;
  roleFallback: string;
  /** `alt` text for the profile image. */
  profilePhotoAlt: string;
}

/** Optional section titles (e.g. Hetic layout). */
export interface CvSectionHeadings {
  profile: string;
  contact: string;
  competencies: string;
  language: string;
  activities: string;
  projects: string;
}

export interface CvContactRow {
  icon: 'mail' | 'phone' | 'map';
  text: string;
}

export interface CvProfileLink {
  label: string;
  url: string;
}

/** Project block for layouts like hetic-squared (right column “Mes projets”). */
export type CvProjectBlock = {
  title: string;
  lines: Array<{ lead?: string; body: string }>;
};

export interface CvGithubFooter {
  text: string;
  url?: string;
}

export interface CvTemplateReadModel {
  /** BCP47 primary language segment for `<html lang>` (`fr`, `en`, …). */
  htmlLang: string;
  /** Localized headings and default name/title placeholders for the CV template. */
  labels: CvTemplateLabels;
  templateName: string;
  templateStylesheetUrl: string;
  bullets: boolean;
  bulletStyle: 'dot' | 'dash' | 'none';
  bulletsColor: string;
  fullName: string;
  jobTitle: string;
  summary: string;
  profileImage: string;
  /** Icons + structured contact lines for dedicated templates */
  headings?: CvSectionHeadings;
  profileLinks?: CvProfileLink[];
  contactRows?: CvContactRow[];
  leftColumn: {
    portfolio: {
      label: string;
      url: string;
    };
    contact: string[];
    skills: Array<{
      title: string;
      items: string[];
    }>;
    languages: string[];
    interests: string[];
  };
  rightColumn: {
    experiences: Array<{
      title: string;
      company: string;
      companyLink: string;
      period: string;
      intro: string;
      items: string[];
    }>;
    formations: Array<{
      degreeName: string;
      degreeLink: string;
      period: string;
      school: string;
      intro: string;
      items: string[];
    }>;
    previousExperiences: Array<{
      title: string;
      period: string;
      company: string;
      companyLink: string;
      intro: string;
      items: string[];
    }>;
    projects?: CvProjectBlock[];
    githubFooter?: CvGithubFooter;
  };
}
