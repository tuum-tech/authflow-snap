export type BasicCredential = {
  username: string;
  password: string;
};

export type VerifiedCredential = string;

export type CredsRequestParams = {
  credentialDescription?: string;
};

export type SnapCredential = {
  id?: string;
  description: string;
  type: 'Basic' | 'VerifiedCredential' | 'None';
  credentialData: BasicCredential | VerifiedCredential | undefined;
};

export type RpcRequest = {
  method: string;
  params: CredsRequestParams;
};
