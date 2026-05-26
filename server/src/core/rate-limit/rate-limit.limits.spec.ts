describe('routeHitLimits', () => {
  const env = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env };
  });

  afterAll(() => {
    process.env = env;
  });

  function loadLimits() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { routeHitLimits } = require('./rate-limit.limits') as typeof import('./rate-limit.limits');
    return routeHitLimits;
  }

  it('uses defaults when env vars are unset', () => {
    delete process.env.RATE_LIMIT_PASSWORD_RESET_REQUEST;
    delete process.env.RATE_LIMIT_PASSWORD_RESET_REQUEST_WINDOW;
    const limits = loadLimits();
    expect(limits.passwordResetRequest).toEqual({ limit: 10, window: '15m' });
  });

  it('reads password reset request from env', () => {
    process.env.RATE_LIMIT_PASSWORD_RESET_REQUEST = '25';
    process.env.RATE_LIMIT_PASSWORD_RESET_REQUEST_WINDOW = '1h';
    const limits = loadLimits();
    expect(limits.passwordResetRequest).toEqual({ limit: 25, window: '1h' });
  });

  it('reads refresh from env', () => {
    process.env.RATE_LIMIT_REFRESH = '50';
    process.env.RATE_LIMIT_REFRESH_WINDOW = '30m';
    const limits = loadLimits();
    expect(limits.refresh).toEqual({ limit: 50, window: '30m' });
  });
});
