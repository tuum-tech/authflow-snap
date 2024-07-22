import { v4 as uuidv4 } from 'uuid';

import type {
  BasicCredential,
  IdentifyCredential,
  SnapCredential,
} from '../snap-types/SnapTypes';
import { SnapVerified } from './SnapVerified';

export class SnapState {
  public static async getCredentials() {
    return await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });
  }

  public static async setCredential(credential: SnapCredential) {
    const credentials = await SnapState.getCredentials();

    const newUUID = uuidv4();

    if (credential.type === 'Basic') {
      const basicCredentialData = credential.credentialData as BasicCredential;
      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            ...credentials,
            [newUUID]: {
              type: credential.type,
              description: credential.description,
              username: basicCredentialData.username,
              password: basicCredentialData.password,
            },
          },
        },
      });
    } else if (credential.type === 'Identify') {
      const identifyCredentialData =
        credential.credentialData as IdentifyCredential;

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            ...credentials,
            [newUUID]: {
              type: credential.type,
              description: credential.description,
              credentialData: identifyCredentialData,
            },
          },
        },
      });
    }
  }

  public static async clearCredentials() {
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'clear',
      },
    });
  }

  // eslint-disable-next-line consistent-return
  public static async getCredentialsForDescription(description: string) {
    const credentials = await SnapState.getCredentials();

    if (credentials !== null) {
      // eslint-disable-next-line consistent-return
      Object.entries(credentials).forEach(([key, value]) => {
        console.log(`Key: ${key}, Value:`, value);
        const snapCredential = value as SnapCredential;

        if (value !== null && snapCredential.description === description) {
          if (snapCredential.type === 'Basic') {
            return snapCredential.credentialData;
          } else if (snapCredential.type === 'Identify') {
            // for now just return our dummy JSON
            return SnapVerified.getDummyVerifiedCredential();
          }
        }
      });
    }
  }
}
