export type GetSnapsResponse = Record<string, Snap>;

export type Snap = {
  permissionName: string;
  id: string;
  version: string;
  initialPermissions: Record<string, unknown>;
};

export type UserCredentials = {
  username: string;
  password: string;
};

export type BasicCredsDisplayHandle = {
  setUser: (user: string) => void;
  setPassword: (password: string) => void;
  getDescription: () => string;
};

export type VerifiableCredsDisplayHandle = {
  setVC: (vc: string) => void;
  getDescription: () => string;
};

export type VerifiablePresentationDisplayHandle = {
  setVP: (vp: string) => void;
  getDescription: () => string;
};
