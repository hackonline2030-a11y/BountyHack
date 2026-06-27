import { normalizeCidr, CidrValidationError } from './cidr-normalize.util';
import { isClientIpInCidrList } from './match-client-ip.util';

describe('normalizeCidr (CA-CIDR)', () => {
  it('CA-CIDR-01: host IPv4 and /32 are equivalent', () => {
    expect(normalizeCidr('203.0.113.10')).toBe('203.0.113.10/32');
    expect(normalizeCidr('203.0.113.10/32')).toBe('203.0.113.10/32');
  });

  it('CA-CIDR-02: canonical IPv4 always includes a prefix', () => {
    const canonical = normalizeCidr('10.0.0.1');
    expect(canonical).toMatch(/\/\d+$/);
  });

  it('normalizes IPv4 network prefixes', () => {
    expect(normalizeCidr('203.0.113.10/24')).toBe('203.0.113.0/24');
  });

  it('rejects invalid IPv4', () => {
    expect(() => normalizeCidr('999.999.999.999')).toThrow(CidrValidationError);
    expect(() => normalizeCidr('')).toThrow(CidrValidationError);
  });

  it('rejects out-of-range prefix', () => {
    expect(() => normalizeCidr('10.0.0.1/33')).toThrow(CidrValidationError);
  });
});

describe('isClientIpInCidrList (CA-CIDR-04)', () => {
  it('matches client IP against stored network CIDR', () => {
    expect(isClientIpInCidrList('203.0.113.10', ['203.0.113.0/24'])).toBe(true);
    expect(isClientIpInCidrList('203.0.114.1', ['203.0.113.0/24'])).toBe(false);
  });
});
