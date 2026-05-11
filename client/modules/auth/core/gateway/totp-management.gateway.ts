export type TotpStartResult = {
  secret: string;
  otpauthUri: string;
  secretQrCode: string;
};

export interface ITotpManagementGateway {
  startEnable(): Promise<Response>;
  confirmEnable(code: string): Promise<Response>;
  disable(code: string): Promise<Response>;
}
