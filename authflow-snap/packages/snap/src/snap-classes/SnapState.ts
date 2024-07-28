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
        console.log("No credentials found.");
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
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
      console.error("Error fetching credentials:", error);
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
        console.log("No basic credentials found to clear.");
      }
    }
    catch(error) {
      console.error("Error clearing basic credentials:", error);
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
    }
    catch(error) {

    }

    try {
      await SnapVerifiable.clearAllIdentifyCredentials(['snap', 'googleDrive']);
    }

    catch(Error) {
      try {
        await SnapVerifiable.clearAllIdentifyCredentials(['snap']);
      }
      catch(error) {

      }
    }
  }

  public static async setCredential(credential: SnapCredential) {
    try {
      const credentials = await this.getCredentials();
      const newUUID = uuidv4();

      if (!credentials) {
        throw new Error("Failed to retrieve existing credentials.");
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

      console.log(`Credential of type ${credential.type} added with UUID ${newUUID}`);
    } catch (error) {
      console.error("Error setting credential:", error);
    }
  }

  public static async getBasicCredentialsForDescription(description: string) {
    try {
      const credentials= await this.getCredentials();
      let returnCredentials;

      if (credentials) {
        for (const [key, value] of Object.entries(credentials)) {
          console.log(`Key: ${key}, Value:`, value);
          const snapCredential = value as SnapCredential;

          if (snapCredential && snapCredential.description === description) {
            if (snapCredential.type === 'Basic') {
              const credData = snapCredential.credentialData as BasicCredential;
              returnCredentials = {
                username: credData.username,
                password: credData.password,
              };
              break;
            }
          }
        }
      }

      return returnCredentials;
    } catch (error) {
      console.error("Error getting basic credentials for description:", error);
      return '';
    }
  }

  public static async getIdentityCredentialForDescription(description: string) {
    try {
      const credentials= await this.getCredentials();
      let vcKey;

      if (credentials) {
        for (const [key, value] of Object.entries(credentials)) {
          console.log(`Key: ${key}, Value:`, value);
          const snapCredential = value as SnapCredential;

          if (snapCredential && snapCredential.description === description) {
            if (snapCredential.type === 'Identify') {
              const credData = snapCredential.credentialData as IdentifyCredential;
              vcKey = credData.id;
              break;
            }
          }
        }
      }

      if (vcKey) {
        try {
          const vcJSON = await SnapVerifiable.getVCForKey(['snap', 'googleDrive'], vcKey);
          return vcJSON;
        }
        catch(error) {
          try {
            const vcJSON = await SnapVerifiable.getVCForKey(['snap'], vcKey);
            return vcJSON;
          }
          catch(error) {

          }
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting identity credential for description:", error);
      return null;
    }
  }

  public static async syncCredentials() {
    try {
      const googleResult = await this.syncGoogleCredentials();
      console.log(`googleResult in syncCredentials: ${JSON.stringify(googleResult)}`);

      let identifyCredentialsString: string;
      try {
        identifyCredentialsString = await SnapVerifiable.getVerifiableCredentials(['snap', 'googleDrive']);
        console.log(`identifyCredentialsString after multi-store call: ${identifyCredentialsString}`);
      } catch (error) {
        identifyCredentialsString = await SnapVerifiable.getVerifiableCredentials(['snap']);
        console.log(`identifyCredentialsString after single snap store call: ${identifyCredentialsString}`);
      }

      const identifyCredentials = JSON.parse(identifyCredentialsString);
      const identifyIds = this.getIdsFromIdentifyData(identifyCredentials);
      console.log(`identify ids after getting from identity data: ${JSON.stringify(identifyIds)}`);
      const authflowCredentials = await this.getCredentials();
      console.log(`authflow credentials: ${JSON.stringify(authflowCredentials)}`);

      const identifyIdSet = new Set(identifyIds);
      console.log(`Set from identify ids: ${JSON.stringify(Array.from(identifyIdSet))}`);

      if (identifyCredentials && identifyIds && authflowCredentials) {
        await this.updateCredentials(identifyIds, authflowCredentials, identifyIdSet);
        await this.removeObsoleteCredentials(authflowCredentials, identifyIdSet);
      }

      console.log(`credentials after sync: `);
      await this.outputCredentialsToConsole();
    } catch (error) {
      console.error("Error during syncCredentials:", error);
    }
  }

  static getIdsFromIdentifyData(data: any): string[] {
    try {
      if (Array.isArray(data)) {
        return data.map((item) => {
          if (item && item.metadata && item.metadata.id) {
            return item.metadata.id;
          }
          throw new Error("Invalid item structure");
        });
      } else if (data && typeof data === 'object' && data.metadata && data.metadata.id) {
        return [data.metadata.id];
      }
      return [];
    } catch (error) {
      console.error("Error extracting IDs from identify data:", error);
      return [];
    }
  }

  public static async renameIdentifyCredential(id: any, name: any) {
    try {
      const credentials = await SnapState.getCredentials();
      console.log("Fetched credentials:", JSON.stringify(credentials));

      if (credentials) {
        let isUpdated = false;

        for (const [key, value] of Object.entries(credentials)) {
          const snapCredential = value as SnapCredential;
          console.log("Processing credential:", JSON.stringify(snapCredential));

          if (snapCredential.type === 'Identify') {
            const credentialData = snapCredential.credentialData as IdentifyCredential;
            console.log(`id from argument: ${id}`);
            console.log(`id from credential collection: ${credentialData.id}`);

            if (credentialData.id === id) {
              console.log(`snap credential description: ${snapCredential.description}`);
              console.log(`new name description: ${name}`);

              snapCredential.description = name;
              console.log("Updated snap credential:", JSON.stringify(snapCredential));

              credentials[key] = snapCredential;
              isUpdated = true;
              console.log("Updated credentials:", JSON.stringify(credentials));
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
          console.log("Credentials updated successfully.");
        } else {
          console.log("No matching credential found to update.");
        }
      } else {
        console.log("No credentials found.");
      }
    } catch (error) {
      console.error("Error renaming identify credential:", error);
    }
  }

  public static async getIdentifyIdsForNames(vcNames: string[]) {
    try {
      const credentials = await this.getCredentials();
      const vcIds: string[] = [];

      if (credentials) {
        for (const [key, value] of Object.entries(credentials)) {
          const snapCredential = value as SnapCredential;

          if (
            snapCredential.type === 'Identify' &&
            vcNames.includes(snapCredential.description)
          ) {
            const credentialData = snapCredential.credentialData as IdentifyCredential;
            vcIds.push(credentialData.id);
          }
        }
      }

      return vcIds;
    } catch (error) {
      console.error("Error getting identify IDs for names:", error);
      return [];
    }
  }

  public static async syncGoogleCredentials() {
    try {
      const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(ethereum);
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

      console.log("Sync Google Credentials Result:", result);
      return result;
    } catch (error) {
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error in syncGoogleCredentials: ${errorMessage}`);
      return null;
    }
  }

  static async removeObsoleteCredentials(authflowCredentials: any, identifyIdSet: Set<string>) {
    for (const [key, value] of Object.entries(authflowCredentials)) {
      const snapCredential = value as SnapCredential;
      if (snapCredential.type === 'Identify') {
        const identifyCredentialData = snapCredential.credentialData as IdentifyCredential;
        if (!identifyIdSet.has(identifyCredentialData.id)) {
          console.log(`here we would delete ${identifyCredentialData.id}`);
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

  static async updateCredentials(identifyIds: string[], authflowCredentials: any, identifyIdSet: Set<string>) {
    for (const identifyId of identifyIds) {
      console.log(`identify id in loop: ${identifyId}`);
      const existsInCollection = Object.values(authflowCredentials).some(
        (credential) =>
          (credential as SnapCredential).type === 'Identify' &&
          (
            (credential as SnapCredential)
              .credentialData as IdentifyCredential
          ).id === identifyId,
      );
      console.log(`exists in collection? ${existsInCollection}`);
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

        console.log(`data when it doesn't exist in the collection: ${newUUID} ${JSON.stringify(newCredData)} ${JSON.stringify(newCred)}`);

        await snap.request({
          method: 'snap_manageState',
          params: {
            operation: 'update',
            newState: {
              ...authflowCredentials,
              [newUUID]: newCred,
            },
          },
        });
      }
    }
  }
}
