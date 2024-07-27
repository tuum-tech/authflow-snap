import { v4 as uuidv4 } from 'uuid';

import type {
  BasicCredential,
  IdentifyCredential,
  SnapCredential,
} from '../snap-types/SnapTypes';
import { SnapCrypto } from './SnapCrypto';
import { SnapVerifiable } from './SnapVerifiable';

export class SnapState {
  public static async outputCredentialsToConsole() {
    const credentials = await SnapState.getCredentials();

    if (credentials) {
      Object.entries(credentials).forEach(([key, item]) => {
        console.log(`Key: ${key}, Item: ${JSON.stringify(item)}`);
      });
    }
  }

  public static async getCredentials() {
    return await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });
  }

  public static async clearBasicCredentials() {
    const credentials = await SnapState.getCredentials();

    if (credentials) {
      Object.entries(credentials).forEach(([key, item]) => {
        const snapCredential = item as SnapCredential;
        if (snapCredential.type === 'Basic') {
          delete credentials[key];
        }
      });

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            ...credentials,
          },
        },
      });
    }
  }

  public static async clearVerifiableCredentials() {
    const credentials = await SnapState.getCredentials();

    if (credentials) {
      Object.entries(credentials).forEach(([key, item]) => {
        const snapCredential = item as SnapCredential;
        if (snapCredential.type === 'Identify') {
          delete credentials[key];
        }
      });

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            ...credentials,
          },
        },
      });
    }

    try {
      await SnapVerifiable.clearAllIdentifyCredentials(['snap', 'googleDrive']);
    }

    catch(Error) {
      await SnapVerifiable.clearAllIdentifyCredentials(['snap']);
    }
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
              credentialData: basicCredentialData,
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

  public static async getBasicCredentialsForDescription(description: string) {
    const credentials = await SnapState.getCredentials();
    let returnCredentials: string | BasicCredential = '';

    if (credentials !== null) {
      // eslint-disable-next-line consistent-return
      Object.entries(credentials).forEach(([key, value]) => {
        console.log(`Key: ${key}, Value:`, value);
        const snapCredential = value as SnapCredential;

        if (value !== null && snapCredential.description === description) {
          if (snapCredential.type === 'Basic') {
            const credData = snapCredential.credentialData as BasicCredential;

            returnCredentials = {
              username: credData.username,
              password: credData.password,
            };
          }
        }
      });
    }

    return returnCredentials;
  }

  public static async getIdentityCredentialForDescription(description: string) {
    const credentials = await SnapState.getCredentials();
    let vcKey;

    if (credentials !== null) {
      // eslint-disable-next-line consistent-return
      Object.entries(credentials).forEach(([key, value]) => {
        console.log(`Key: ${key}, Value:`, value);
        const snapCredential = value as SnapCredential;

        if (value !== null && snapCredential.description === description) {
          if (snapCredential.type === 'Identify') {
            const credData =
              snapCredential.credentialData as IdentifyCredential;
            vcKey = credData.id;
          }
        }
      });
    }

    if (vcKey) {
      const vcJSON = await SnapVerifiable.getVCForKey(
        ['snap', 'googleDrive'],
        vcKey,
      );
      return vcJSON;
    }

    return null;
  }

  public static async syncCredentials() {
    const identifyCredentialsString =
      await SnapVerifiable.getVerifiableCredentials(['snap', 'googleDrive']);
    const identifyCredentials: any[] = JSON.parse(identifyCredentialsString);
    const identifyIds = this.getIdsFromIdentifyData(identifyCredentials);
    const authflowCredentials = await SnapState.getCredentials();

    const identifyIdSet = new Set(identifyIds);

    const googleResult = await this.syncGoogleCredentials();

    if (identifyCredentials && identifyIds && authflowCredentials) {
      for (const identifyId of identifyIds) {
        const existsInCollection = Object.values(authflowCredentials).some(
          (credential) =>
            (credential as SnapCredential).type === 'Identify' &&
            (
              (credential as SnapCredential)
                .credentialData as IdentifyCredential
            ).id === identifyId,
        );
        if (!existsInCollection) {
          const newUUID = uuidv4();
          const newCredData: IdentifyCredential = {
            id: identifyId,
            store: 'snap',
          };
          const newCred: SnapCredential = {
            description: identifyId,
            type: 'Identify',
            credentialData: newCredData,
          };

          await snap.request({
            method: 'snap_manageState',
            params: {
              operation: 'update',
              newState: {
                ...authflowCredentials,
                [newUUID]: {
                  type: newCred.type,
                  description: newCred.description,
                  credentialData: newCredData,
                },
              },
            },
          });
        }
      }

      for (const id of identifyIds) {
        Object.entries(authflowCredentials).forEach(([key, value]) => {
          const snapCredential = value as SnapCredential;

          if (snapCredential.type === 'Identify') {
            const identifyCredentialData =
              snapCredential.credentialData as IdentifyCredential;
            if (!identifyIdSet.has(identifyCredentialData.id)) {
              // delete this entry from AuthFlow's metamask data collection
            }
          }
        });
      }
    }

    await SnapState.outputCredentialsToConsole();
  }

  static getIdsFromIdentifyData(data: any): string[] {
    if (Array.isArray(data)) {
      return data.map((item) => item.metadata.id);
    } else if (data && typeof data === 'object') {
      return [data.metadata.id];
    }
    return [];
  }

  public static async renameIdentifyCredential(id: any, name: any) {
    const credentials = await SnapState.getCredentials();
    console.log(JSON.stringify(credentials));

    if (credentials !== null) {
      Object.entries(credentials).forEach(([key, value]) => {
        const snapCredential = value as SnapCredential;
        console.log(JSON.stringify(snapCredential));
        if (snapCredential.type === 'Identify') {
          console.log(`id from argument: ${id}`);
          console.log(
            `id from credential collection: ${
              (snapCredential.credentialData as IdentifyCredential).id
            }`,
          );
          if ((snapCredential.credentialData as IdentifyCredential).id === id) {
            console.log(
              `snap credential description: ${snapCredential.description}`,
            );
            console.log(`name description: ${name}`);
            snapCredential.description = name;
            console.log(JSON.stringify(snapCredential));

            credentials[key] = snapCredential;
            console.log(JSON.stringify(credentials));
          }
        }
      });

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: { ...credentials },
        },
      });
    }
  }

  public static async getIdentifyIdsForNames(vcNames: string[]) {
    const credentials = await this.getCredentials();
    const vcIds: string[] = [];

    if (credentials) {
      Object.entries(credentials).forEach(([key, value]) => {
        const snapCredential = value as SnapCredential;

        if (
          snapCredential.type === 'Identify' &&
          vcNames.includes(snapCredential.description)
        ) {
          const credentialData =
            snapCredential.credentialData as IdentifyCredential;
          vcIds.push(credentialData.id);
        }
      });
    }

    return vcIds;
  }

  public static async configureGoogleAccount(accessToken: any) {
    const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
      ethereum,
    );
    const params = {
      metamaskAddress,
      accessToken,
    };

    const result = await snap.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId: 'npm:@tuum-tech/identify',
        request: {
          method: 'configureGoogleAccount',
          params,
        },
      },
    });

    return result;
  }

  public static async syncGoogleCredentials() {
    const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
      ethereum,
    );
    const params = {
      metamaskAddress,
    };

    let result = null;

    try {
      result = await snap.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'syncGoogleVCs',
            params,
          },
        },
      });

      return result;
    } catch (error) {
      console.error(`Error in syncGoogleCredentials: ${error.message}`);
      return result;
    }
  }
}
