export class CidrValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CidrValidationError';
  }
}

function parseIpv4Octets(ipPart: string): number[] {
  const parts = ipPart.split('.');
  if (parts.length !== 4) {
    throw new CidrValidationError('Invalid IPv4 address');
  }
  const octets = parts.map((part) => {
    if (!/^\d{1,3}$/.test(part)) {
      throw new CidrValidationError('Invalid IPv4 address');
    }
    const value = Number(part);
    if (value < 0 || value > 255) {
      throw new CidrValidationError('Invalid IPv4 address');
    }
    return value;
  });
  return octets;
}

function ipv4ToInt(octets: number[]): number {
  return (
    ((octets[0] << 24) |
      (octets[1] << 16) |
      (octets[2] << 8) |
      octets[3]) >>>
    0
  );
}

function intToIpv4(value: number): string {
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join('.');
}

function normalizeIpv4Cidr(ipPart: string, prefix: number): string {
  const octets = parseIpv4Octets(ipPart);
  const ipInt = ipv4ToInt(octets);
  const mask =
    prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & mask) >>> 0;
  return `${intToIpv4(networkInt)}/${prefix}`;
}

function isValidIpv6Literal(ipPart: string): boolean {
  if (!ipPart.includes(':')) {
    return false;
  }
  if (!/^[0-9a-fA-F:]+$/.test(ipPart)) {
    return false;
  }
  const pieces = ipPart.split('::');
  if (pieces.length > 2) {
    return false;
  }
  const segments = ipPart
    .split(':')
    .filter((segment) => segment.length > 0);
  if (segments.length > 8) {
    return false;
  }
  for (const segment of segments) {
    if (segment.length > 4 || !/^[0-9a-fA-F]+$/.test(segment)) {
      return false;
    }
  }
  return true;
}

function normalizeIpv6Cidr(ipPart: string, prefix: number): string {
  if (!isValidIpv6Literal(ipPart)) {
    throw new CidrValidationError('Invalid IPv6 address');
  }
  return `${ipPart.toLowerCase()}/${prefix}`;
}

/**
 * Canonical CIDR string for persistence and uniqueness checks.
 * IPv4 hosts without mask become /32; IPv6 hosts without mask become /128.
 */
export function normalizeCidr(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new CidrValidationError('CIDR is required');
  }

  const slashIndex = trimmed.lastIndexOf('/');
  let ipPart: string;
  let prefix: number | undefined;

  if (slashIndex === -1) {
    ipPart = trimmed;
  } else {
    ipPart = trimmed.slice(0, slashIndex).trim();
    const prefixRaw = trimmed.slice(slashIndex + 1).trim();
    if (!prefixRaw || !/^\d+$/.test(prefixRaw)) {
      throw new CidrValidationError('Invalid CIDR prefix');
    }
    prefix = Number(prefixRaw);
  }

  const looksIpv4 = ipPart.includes('.') && !ipPart.includes(':');
  if (looksIpv4) {
    const resolvedPrefix = prefix ?? 32;
    if (!Number.isInteger(resolvedPrefix) || resolvedPrefix < 0 || resolvedPrefix > 32) {
      throw new CidrValidationError('Invalid CIDR prefix length');
    }
    return normalizeIpv4Cidr(ipPart, resolvedPrefix);
  }

  const resolvedPrefix = prefix ?? 128;
  if (!Number.isInteger(resolvedPrefix) || resolvedPrefix < 0 || resolvedPrefix > 128) {
    throw new CidrValidationError('Invalid CIDR prefix length');
  }
  return normalizeIpv6Cidr(ipPart, resolvedPrefix);
}
