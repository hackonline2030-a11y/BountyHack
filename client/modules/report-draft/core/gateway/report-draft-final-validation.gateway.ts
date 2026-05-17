export interface IReportDraftFinalValidationGateway {
  listFinalValidationQueue(bearerToken: string): Promise<Response>;
}
