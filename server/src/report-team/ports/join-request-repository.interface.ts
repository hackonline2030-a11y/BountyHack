import type {
  CreateEnrollmentRequestInput,
  CreateJoinRequestInput,
  ReportTeamJoinRequestWire,
} from '../models/report-team-api.types';

export interface IJoinRequestRepository {
  findById(id: string): Promise<ReportTeamJoinRequestWire | null>;
  findByUserId(userId: string): Promise<ReportTeamJoinRequestWire[]>;
  findPending(): Promise<ReportTeamJoinRequestWire[]>;
  create(
    userId: string,
    input: CreateJoinRequestInput,
  ): Promise<ReportTeamJoinRequestWire>;
  createEnrollment(
    userId: string,
    input: CreateEnrollmentRequestInput,
  ): Promise<ReportTeamJoinRequestWire>;
  approve(id: string, decidedById: string): Promise<ReportTeamJoinRequestWire>;
  reject(id: string, decidedById: string): Promise<ReportTeamJoinRequestWire>;
}

export const I_JOIN_REQUEST_REPOSITORY = Symbol('I_JOIN_REQUEST_REPOSITORY');
