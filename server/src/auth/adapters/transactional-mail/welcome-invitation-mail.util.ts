import type { SupportedPasswordResetLocale } from '../../config/account-setup-public-url';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildWelcomeInvitationEmail(
  locale: SupportedPasswordResetLocale,
  plainUsername: string,
  link: string,
): { subject: string; text: string; html: string } {
  const htmlSafeUsername = escapeHtml(plainUsername);
  const href = escapeHtml(link);
  if (locale === 'fr') {
    return {
      subject: 'Bienvenue sur BugBountyApp — activez votre compte',
      text: [
        `Bonjour ${plainUsername},`,
        '',
        'Un compte BugBountyApp a été créé pour vous.',
        'Pour vous connecter, définissez votre mot de passe via le lien ci-dessous (valide un temps limité) :',
        '',
        link,
      ].join('\n'),
      html: `<p>Bonjour ${htmlSafeUsername},</p><p>Un compte BugBountyApp a été créé pour vous.</p><p><a href="${href}">Définir mon mot de passe</a></p>`,
    };
  }
  return {
    subject: 'Welcome to BugBountyApp — activate your account',
    text: [
      `Hello ${plainUsername},`,
      '',
      'A BugBountyApp account has been created for you.',
      'To sign in, set your password using the link below (valid for a limited time):',
      '',
      link,
    ].join('\n'),
    html: `<p>Hello ${htmlSafeUsername},</p><p>A BugBountyApp account has been created for you.</p><p><a href="${href}">Set my password</a></p>`,
  };
}
