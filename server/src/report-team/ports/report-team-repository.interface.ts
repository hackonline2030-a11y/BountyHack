import type {
  CreateReportTeamInput,
  ReportTeamMemberRoleWire,
  ReportTeamWire,
  UpdateReportTeamInput,
} from '../models/report-team-api.types';

export interface IReportTeamRepository {
  findById(id: string): Promise<ReportTeamWire | null>;
  findByReportDraftId(reportDraftId: string): Promise<ReportTeamWire | null>;
  findAll(): Promise<ReportTeamWire[]>;
  findByMemberUserId(userId: string): Promise<ReportTeamWire[]>;
  findJoinableForUserId(userId: string): Promise<ReportTeamWire[]>;
  isMemberOfDraft(userId: string, reportDraftId: string): Promise<boolean>;
  findDraftIdsForMember(userId: string): Promise<string[]>;
  /** Draft exists and has no team — used before attaching a new squad. */
  findOrphanDraftOwnerId(reportDraftId: string): Promise<string | null>;
  create(input: CreateReportTeamInput): Promise<ReportTeamWire>;
  update(id: string, input: UpdateReportTeamInput): Promise<ReportTeamWire>;
  delete(id: string): Promise<void>;
  addMember(
    teamId: string,
    userId: string,
    role: ReportTeamMemberRoleWire,
  ): Promise<ReportTeamWire>;
  removeMember(teamId: string, userId: string): Promise<ReportTeamWire>;
}

export const I_REPORT_TEAM_REPOSITORY = Symbol('I_REPORT_TEAM_REPOSITORY');
