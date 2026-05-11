const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ?? '3000';

export const defaultUrl = `http://${host}:${port}`;
