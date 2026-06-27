import { BlockList, isIPv4, isIPv6 } from 'node:net';

/**
 * Returns true when `clientIp` falls inside any canonical CIDR in `cidrs`.
 */
export function isClientIpInCidrList(
  clientIp: string,
  cidrs: readonly string[],
): boolean {
  if (!cidrs.length) {
    return false;
  }

  const version = isIPv4(clientIp)
    ? 'ipv4'
    : isIPv6(clientIp)
      ? 'ipv6'
      : null;
  if (!version) {
    return false;
  }

  const blockList = new BlockList();
  for (const cidr of cidrs) {
    const slashIndex = cidr.lastIndexOf('/');
    if (slashIndex === -1) {
      continue;
    }
    const ipPart = cidr.slice(0, slashIndex);
    const prefix = Number(cidr.slice(slashIndex + 1));
    if (!Number.isInteger(prefix)) {
      continue;
    }
    try {
      blockList.addSubnet(ipPart, prefix, version);
    } catch {
      continue;
    }
  }

  return blockList.check(clientIp, version);
}
