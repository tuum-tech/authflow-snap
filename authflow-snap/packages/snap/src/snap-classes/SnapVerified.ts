import { v4 as uuidv4 } from 'uuid';

import type { SnapCredential } from '../snap-types/SnapTypes';
import { SnapCrypto } from './SnapCrypto';
import { SnapState } from './SnapState';

export class SnapVerified {
  public static async saveDummyVerifiedCredentials() {
    for (let i = 0; i < 4; i++) {
      const newUuid = uuidv4();
      const newCredential: SnapCredential = {
        description: `mycred${i}`,
        type: 'Identify',
        credentialData: {
          id: newUuid,
          store: 'snap',
        },
      };

      await SnapState.setCredential(newCredential);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async saveVerifiedCredential(data: any, stores: string[]) {
    const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
      ethereum,
    );

    const data2 = [
      {
        credentialSubject: {
          profile: {
            name: 'KP',
          },
          id: 'did:pkh:eip155:1:0x2e5ff0267b678a0faf9a9f5b0fbf7ac9638b5b57',
        },
        issuer: {
          id: 'did:pkh:eip155:1:0x2e5ff0267b678a0faf9a9f5b0fbf7ac9638b5b57',
        },
        type: ['VerifiableCredential', 'ProfileNamesCredential'],
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        issuanceDate: '2023-04-05T14:34:47.000Z',
        expirationDate: '2024-04-05T14:34:47.000Z',
        proof: {
          type: 'JwtProof2020',
          jwt: 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3MTIzMjc2ODcsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJQcm9maWxlTmFtZXNDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7InByb2ZpbGUiOnsibmFtZSI6IktQIn19fSwic3ViIjoiZGlkOnBraDplaXAxNTU6MToweDJlNWZmMDI2N2I2NzhhMGZhZjlhOWY1YjBmYmY3YWM5NjM4YjViNTciLCJuYmYiOjE2ODA3MDUyODcsImlzcyI6ImRpZDpwa2g6ZWlwMTU1OjE6MHgyZTVmZjAyNjdiNjc4YTBmYWY5YTlmNWIwZmJmN2FjOTYzOGI1YjU3In0.CR1A_XpG001_PCaAt3VN9G5Lt75gTm2M5YSt6trqhkEoW0wce9rU7SrsZnQ0drmaG2tee4IMrZFx241yi8UsLg',
        },
      },
    ];

    const params = {
      metamaskAddress,
      data: data2,
      store: stores,
    };

    return await snap.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'npm:@tuum-tech/identify',
        request: {
          method: 'saveVC',
          params,
        },
      },
    });
  }

  public static async getVerifiedCredentials(stores: string[]) {
    const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
      ethereum,
    );

    const options = {
      store: stores,
    };

    const filter = undefined;

    const params = {
      metamaskAddress,
      filter,
      options,
    };

    return await snap.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'npm:@tuum-tech/identify',
        request: {
          method: 'getVCs',
          params,
        },
      },
    });
  }

  public static getDummyVerifiedCredential(): string {
    const sampleJSON = {
      data: {
        credentialSubject: {
          profile: {
            name: 'KP',
          },
          id: 'did:pkh:eip155:1:0x2e5ff0267b678a0faf9a9f5b0fbf7ac9638b5b57',
        },
        issuer: {
          id: 'did:pkh:eip155:1:0x2e5ff0267b678a0faf9a9f5b0fbf7ac9638b5b57',
        },
        type: ['VerifiableCredential', 'ProfileNamesCredential'],
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        issuanceDate: '2023-04-06T21:44:28.000Z',
        expirationDate: '2024-04-06T21:44:28.000Z',
        proof: {
          type: 'JwtProof2020',
          jwt: 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJleHAiOjE3MTI0Mzk4NjgsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJQcm9maWxlTmFtZXNDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7InByb2ZpbGUiOnsibmFtZSI6IktQIn19fSwic3ViIjoiZGlkOnBraDplaXAxNTU6MToweDJlNWZmMDI2N2I2NzhhMGZhZjlhOWY1YjBmYmY3YWM5NjM4YjViNTciLCJuYmYiOjE2ODA4MTc0NjgsImlzcyI6ImRpZDpwa2g6ZWlwMTU1OjE6MHgyZTVmZjAyNjdiNjc4YTBmYWY5YTlmNWIwZmJmN2FjOTYzOGI1YjU3In0.2zs9QiJAe2O3AWgOPFKvkwugt9fbiGl564M_E7KZocXFQX_kObciRpPoK10VHHE3RvWu1DoaZJbQhVAxHba6TA',
        },
      },
    };

    return JSON.stringify(sampleJSON);
  }

  public static async createVPFromVCs(vcIds: string[]) {
    const stores = ['snap', 'googleDrive'];
    const metamaskAddress = 'myaddress';

    const options = {
      store: stores,
    };

    const params = {
      metamaskAddress,
      vcIds,
      options,
    };

    return await snap.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'npm:@tuum-tech/identify',
        request: {
          method: 'createVP',
          params,
        },
      },
    });
  }
}
