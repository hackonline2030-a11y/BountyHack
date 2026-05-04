import { EmailTemplate } from '@/app/_components/molecules/EmailTemplate';
import { Resend } from 'resend';

export async function POST() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      console.warn(
        '[api/send] RESEND_API_KEY is missing or empty. Email sending is disabled.'
      );
      return Response.json(
        { error: 'RESEND_API_KEY is missing or empty' },
        { status: 503 }
      );
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['delivered@resend.dev'],
      subject: 'Hello world',
      react: EmailTemplate({ firstName: 'John' }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}

