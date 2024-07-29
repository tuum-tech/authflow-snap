export type BasicCredential = {
  username: string;
  password: string;
};

export type CredsRequestParams = {
  credentialDescription: string;
};

export type IdentifyCredential = {
  id: string;
};

export type SnapCredential = {
  description: string;
  type: string;
  credentialData: BasicCredential | IdentifyCredential;
};
