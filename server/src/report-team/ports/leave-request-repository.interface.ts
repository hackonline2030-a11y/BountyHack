import type {
  CreateLeaveRequestInput,
  ReportTeamLeaveRequestWire,
} from '../models/report-team-api.types';

export interface ILeaveRequestRepository {
  findById(id: string): Promise<ReportTeamLeaveRequestWire | null>;
  findByUserId(userId: string): Promise<ReportTeamLeaveRequestWire[]>;
  findPending(): Promise<ReportTeamLeaveRequestWire[]>;
  create(
    userId: string,
    input: CreateLeaveRequestInput,
  ): Promise<ReportTeamLeaveRequestWire>;
  approve(id: string, decidedById: string): Promise<ReportTeamLeaveRequestWire>;
  reject(id: string, decidedById: string): Promise<ReportTeamLeaveRequestWire>;
}

export const I_LEAVE_REQUEST_REPOSITORY = Symbol('I_LEAVE_REQUEST_REPOSITORY');
