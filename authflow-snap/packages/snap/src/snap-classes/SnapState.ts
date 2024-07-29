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
    try {
      const credentials = await SnapState.getCredentials();

      if (credentials) {
        Object.entries(credentials).forEach(([key, item]) => {
          console.log(`Key: ${key}, Item: ${JSON.stringify(item)}`);
        });
      } else {
        console.log('No credentials found.');
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  }

  public static async getCredentials() {
    try {
      const credentials = await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      return credentials;
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return null;
    }
  }

  public static async clearBasicCredentials() {
    try {
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
      } else {
        console.log('No basic credentials found to clear.');
      }
    } catch (error) {
      console.error('Error clearing basic credentials:', error);
    }
  }

  public static async clearBasicCredential(name: string) {
    try {
      const credentials = await SnapState.getCredentials();

      if (credentials) {
        Object.entries(credentials).forEach(([key, item]) => {
          const snapCredential = item as SnapCredential;
          if (snapCredential.type === 'Basic') {
            if (snapCredential.description === name) {
              delete credentials[key];
            }
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
      } else {
        console.log('No basic credential found to clear.');
      }
    } catch (error) {
      console.error('Error clearing basic credential:', error);
    }
  }

  public static async clearVerifiableCredentials() {
    try {
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
    } catch (error) {

    }

    try {
      await SnapVerifiable.clearAllIdentifyCredentials(['snap', 'googleDrive']);
    } catch (error) {
      try {
        await SnapVerifiable.clearAllIdentifyCredentials(['snap']);
      } catch (errorTwo) {

      }
    }
  }

  public static async deleteVerifiedCredential(name: string) {
    let credentialId;
    try {
      const credentials = await SnapState.getCredentials();


      if (credentials) {
        Object.entries(credentials).forEach(([key, item]) => {
          const snapCredential = item as SnapCredential;
          if (snapCredential.type === 'Identify') {
            if(snapCredential.description === name) {
              const credentialData = snapCredential.credentialData as IdentifyCredential;
              credentialId = credentialData.id;
              delete credentials[key];
            }
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
    } catch (error) {

    }

    if (credentialId) {
      try {
        await SnapVerifiable.clearIdentifyCredential(['snap', 'googleDrive'], credentialId);
      } catch (error) {
        try {
          await SnapVerifiable.clearIdentifyCredential(['snap'], credentialId);
        } catch (errorTwo) {

        }
      }
    }
  }

  public static async setCredential(credential: SnapCredential) {
    try {
      const credentials = await this.getCredentials();
      const newUUID = uuidv4();

      if (!credentials) {
        throw new Error('Failed to retrieve existing credentials.');
      }

      const updatedCredentials = {
        ...credentials,
        [newUUID]: {
          type: credential.type,
          description: credential.description,
          credentialData: credential.credentialData,
        },
      };

      await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: updatedCredentials,
        },
      });

      console.log(
        `Credential of type ${credential.type} added with UUID ${newUUID}`,
      );
    } catch (error) {
      console.error('Error setting credential:', error);
    }
  }

  public static async getBasicCredentialsForDescription(
    description: string,
  ): Promise<BasicCredential> {
    try {
      const credentials = await this.getCredentials();
      let returnCredentials;

      if (credentials) {
        for (const value of Object.values(credentials)) {
          const snapCredential = value as SnapCredential;

          if (snapCredential && snapCredential.description === description) {
            if (snapCredential.type === 'Basic') {
              const credData = snapCredential.credentialData as BasicCredential;
              returnCredentials = {
                username: credData.username,
                password: credData.password,
              };
              break;
            } else {
              throw new Error('Not a basic credential.');
            }
          } else {
            throw new Error('Credential not found.');
          }
        }
      } else {
        throw new Error('Credentials undefined.');
      }

      if (returnCredentials) {
        return returnCredentials;
      }

      return {
        username: '',
        password: '',
      };
    } catch (error) {
      console.error('Error getting basic credentials for description:', error);
      return {
        username: '',
        password: '',
      };
    }
  }

  public static async getIdentityCredentialForDescription(description: string) {
    try {
      const credentials = await this.getCredentials();
      let vcKey;

      if (credentials) {
        for (const value of Object.values(credentials)) {
          const snapCredential = value as SnapCredential;

          if (snapCredential && snapCredential.description === description) {
            if (snapCredential.type === 'Identify') {
              const credData =
                snapCredential.credentialData as IdentifyCredential;
              vcKey = credData.id;
              break;
            }
          }
        }
      }

      if (vcKey) {
        try {
          const vcJSON = await SnapVerifiable.getVCForKey(
            ['snap', 'googleDrive'],
            vcKey,
          );
          return vcJSON;
        } catch (error) {
          try {
            const vcJSON = await SnapVerifiable.getVCForKey(['snap'], vcKey);
            return vcJSON;
          } catch (errorTwo) {}
        }
      }

      return null;
    } catch (error) {
      console.error(
        'Error getting identity credential for description:',
        error,
      );
      return null;
    }
  }

  public static async syncCredentials() {
    try {
      const googleResult = await this.syncGoogleCredentials();

      let identifyCredentialsString: string;
      try {
        identifyCredentialsString =
          await SnapVerifiable.getVerifiableCredentials([
            'snap',
            'googleDrive',
          ]);
      } catch (error) {
        identifyCredentialsString =
          await SnapVerifiable.getVerifiableCredentials(['snap']);
      }

      const identifyCredentials = JSON.parse(identifyCredentialsString);
      const identifyIds = this.getIdsFromIdentifyData(identifyCredentials);
      let authflowCredentials = await this.getCredentials();

      const identifyIdSet = new Set(identifyIds);

      if (identifyCredentials && identifyIds && authflowCredentials) {
        await this.updateCredentials(identifyIds, authflowCredentials);
        await this.outputCredentialsToConsole();
        authflowCredentials = await this.getCredentials();
        await this.removeObsoleteCredentials(
          authflowCredentials,
          identifyIdSet,
        );
      }

      await this.outputCredentialsToConsole();
    } catch (error) {
      console.error('Error during syncCredentials:', error);
    }
  }

  static getIdsFromIdentifyData(data: any): string[] {
    try {
      if (Array.isArray(data)) {
        return data.map((item) => {
          if (item?.metadata?.id) {
            return item.metadata.id;
          }
          throw new Error('Invalid item structure');
        });
      } else if (
        data &&
        typeof data === 'object' &&
        data.metadata &&
        data.metadata.id
      ) {
        return [data.metadata.id];
      }
      return [];
    } catch (error) {
      console.error('Error extracting IDs from identify data:', error);
      return [];
    }
  }

  public static async renameIdentifyCredential(id: string, name: string) {
    try {
      const credentials = await SnapState.getCredentials();

      if (credentials) {
        let isUpdated = false;

        for (const [key, value] of Object.entries(credentials)) {
          const snapCredential = value as SnapCredential;

          if (snapCredential.type === 'Identify') {
            const credentialData =
              snapCredential.credentialData as IdentifyCredential;

            if (credentialData.id === id) {
              snapCredential.description = name;

              credentials[key] = snapCredential;
              isUpdated = true;
            }
          }
        }

        if (isUpdated) {
          await snap.request({
            method: 'snap_manageState',
            params: {
              operation: 'update',
              newState: { ...credentials },
            },
          });
          console.log('Credentials updated successfully.');
        } else {
          console.log('No matching credential found to update.');
        }
      } else {
        console.log('No credentials found.');
      }
    } catch (error) {
      console.error('Error renaming identify credential:', error);
    }
  }

  public static async getIdentifyIdsForNames(vcNames: string[]) {
    try {
      const credentials = await this.getCredentials();
      const vcIds: string[] = [];

      if (credentials) {
        for (const value of Object.values(credentials)) {
          const snapCredential = value as SnapCredential;

          if (
            snapCredential.type === 'Identify' &&
            vcNames.includes(snapCredential.description)
          ) {
            const credentialData =
              snapCredential.credentialData as IdentifyCredential;
            vcIds.push(credentialData.id);
          }
        }
      }

      return vcIds;
    } catch (error) {
      console.error('Error getting identify IDs for names:', error);
      return [];
    }
  }

  public static async syncGoogleCredentials() {
    try {
      const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
        ethereum,
      );
      const params = {
        metamaskAddress,
      };

      const result = await snap.request({
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
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error in syncGoogleCredentials: ${errorMessage}`);
      return null;
    }
  }

  static async removeObsoleteCredentials(
    authflowCredentials: any,
    identifyIdSet: Set<string>,
  ) {
    for (const [key, value] of Object.entries(authflowCredentials)) {
      const snapCredential = value as SnapCredential;
      if (snapCredential.type === 'Identify') {
        const identifyCredentialData =
          snapCredential.credentialData as IdentifyCredential;
        if (!identifyIdSet.has(identifyCredentialData.id)) {
          delete authflowCredentials[key];
        }
      }
    }

    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: authflowCredentials,
      },
    });
  }

  static async updateCredentials(
    identifyIds: string[],
    authflowCredentials: any,
  ) {
    for (const identifyId of identifyIds) {
      const existsInCollection = Object.values(authflowCredentials).some(
        (credential) =>
          (credential as SnapCredential).type === 'Identify' &&
          ((credential as SnapCredential).credentialData as IdentifyCredential)
            .id === identifyId,
      );

      if (!existsInCollection) {
        const newUUID = uuidv4();
        const newCredData: IdentifyCredential = {
          id: identifyId,
        };
        const newCred: SnapCredential = {
          description: identifyId,
          type: 'Identify',
          credentialData: newCredData,
        };

        await this.setCredential(newCred);
      }
    }
  }
}
