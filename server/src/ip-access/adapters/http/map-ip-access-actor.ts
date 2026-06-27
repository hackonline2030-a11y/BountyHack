import type { Identity } from '../../../auth/domain/models/identity';
import type { IpAccessActor } from '../../models/ip-access-actor';

/** Maps auth `Identity` to ip-access actor at the HTTP boundary only. */
export function toIpAccessActor(identity: Identity): IpAccessActor {
  return { userId: identity.uid };
}
