export type BasicCredentials = {
  username: string;
  password: string;
  description: string;
};

export type UserCredentials = {
  username: string;
  password: string;
};

export type BasicCredsRequestParams = {
  credentialDescription?: string;
};

export type RpcRequest = {
  method: string;
  params: BasicCredsRequestParams;
};
