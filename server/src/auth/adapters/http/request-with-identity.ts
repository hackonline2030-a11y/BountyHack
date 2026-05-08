import { Request } from 'express';
import { Identity } from '../../domain/models/identity';

export interface RequestWithIdentity extends Request {
  user: Identity;
}
