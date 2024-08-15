import { v4 as uuidv4 } from 'uuid';

import type {
  BasicCredential,
  IdentifyCredential,
  SnapCredential,
} from '../snap-types/SnapTypes';
import { SnapCrypto } from './SnapCrypto';
import { SnapVerifiable } from './SnapVerifiable';

export class SnapState {
  public static async getCredentials() {
    try {
      const credentials = await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      return credentials;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in getCredentials: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in clearBasicCredentials: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in clearBasicCredential ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in clearVerifiableCredentials: ${errorMessage}`);
    }

    try {
      await SnapVerifiable.clearAllIdentifyCredentials(['snap', 'googleDrive']);
    } catch (error) {
      try {
        await SnapVerifiable.clearAllIdentifyCredentials(['snap']);
      } catch (errorTwo: unknown) {
        const errorMessage =
          errorTwo instanceof Error
            ? errorTwo.message
            : 'An unknown error occurred';
        console.error(`Error in clearVerifiableCredentials: ${errorMessage}`);
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
            if (snapCredential.description === name) {
              const credentialData =
                snapCredential.credentialData as IdentifyCredential;
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in deleteVerifiedCredential: ${errorMessage}`);
    }

    if (credentialId) {
      try {
        await SnapVerifiable.clearIdentifyCredential(
          ['snap', 'googleDrive'],
          credentialId,
        );
      } catch (error) {
        try {
          await SnapVerifiable.clearIdentifyCredential(['snap'], credentialId);
        } catch (errorTwo: unknown) {
          const errorMessage =
            errorTwo instanceof Error
              ? errorTwo.message
              : 'An unknown error occurred';
          console.error(`Error in deleteVerifiedCredential: ${errorMessage}`);
        }
      }
    }
  }

  public static async setCredential(credential: SnapCredential) {
    try {
      const credentials = await this.getCredentials();
      const newUUID = uuidv4();

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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in setCredential: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(
        `Error in getBasicCredentialsForDescription: ${errorMessage}`,
      );
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
          } catch (errorTwo: unknown) {
            const errorMessage =
              errorTwo instanceof Error
                ? errorTwo.message
                : 'An unknown error occurred';
            console.error(
              `Error in getIdentityCredentialForDescription: ${errorMessage}`,
            );
          }
        }
      }

      return null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(
        `Error in getIdentityCredentialForDescription: ${errorMessage}`,
      );
      return null;
    }
  }

  public static async syncCredentials() {
    try {
      const googleResult = await this.syncGoogleCredentials();

      let identifyCredentialsString = '';
      try {
        identifyCredentialsString =
          await SnapVerifiable.getVerifiableCredentials([
            'snap',
            'googleDrive',
          ]);
      } catch (error) {
        try {
          identifyCredentialsString =
            await SnapVerifiable.getVerifiableCredentials(['snap']);
        } catch (errorTwo: unknown) {
          const errorMessage =
            errorTwo instanceof Error
              ? errorTwo.message
              : 'An unknown error occurred';
          console.error(`Error in syncCredentials: ${errorMessage}`);
        }
      }

      const identifyCredentials = JSON.parse(identifyCredentialsString);
      const identifyIds = this.getIdsFromIdentifyData(identifyCredentials);
      let authflowCredentials = await this.getCredentials();

      const identifyIdSet = new Set(identifyIds);

      if (identifyCredentials && identifyIds && authflowCredentials) {
        await this.updateCredentials(identifyIds, authflowCredentials);
        authflowCredentials = await this.getCredentials();
        await this.removeObsoleteCredentials(
          authflowCredentials,
          identifyIdSet,
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in syncCredentials: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in getIdsFromIdentifyData: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in renameIdentifyCredential: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      console.error(`Error in getIdentifyIdsForNames: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
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
