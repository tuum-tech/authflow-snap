import type {
  IdentifyCredential,
  SnapCredential,
} from '../snap-types/SnapTypes';
import { SnapCrypto } from './SnapCrypto';
import { SnapState } from './SnapState';

export class SnapVerifiable {
  public static async getVerifiableCredentials(stores: string[]) {
    try {
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

      return JSON.stringify(
        await snap.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: 'npm:@tuum-tech/identify',
            request: {
              method: 'getVCs',
              params,
            },
          },
        }),
      );
    }
    catch(error:unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error(`Error in getVerifiableCredentials: ${errorMessage}`);
      throw new Error('Error in identify: likely google not configured');
    }
  }

  public static async createVPFromVCs(vcNamesCSV: any, stores: string[]) {
    try {
      const vcNames = vcNamesCSV.split(',');
      const vcIds = await SnapState.getIdentifyIdsForNames(vcNames);
      const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
        ethereum,
      );

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new Error('unknown error: likely google not configured');
    }
  }

  public static async getVCForKey(stores: string[], key: string) {
    try {
      const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
        ethereum,
      );

      const options = {
        store: stores,
      };

      const filter = {
        type: 'id',
        filter: key,
      };

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
    catch (error:unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new Error('unknown error: likely google not configured');
    }
  }

  public static async seedVerifiableCredentials(stores: string[]) {
    try {
      const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
        ethereum,
      );

      const options = {
        store: stores,
      };

      const vcKey = 'Sample Authflow Credential';
      const vcValue = {
        name: `My Sample Authflow Credential`,
      };

      const params = {
        metamaskAddress,
        vcKey,
        vcValue,
        options,
      };

      const identifyReturn = await snap.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'createVC',
            params,
          },
        },
      });

      const vcJSON = JSON.parse(JSON.stringify(identifyReturn));
      const vcId = vcJSON.metadata.id;

      const newIdentifyCredentialData: IdentifyCredential = {
        id: vcId,
      };

      const newIdentifyCredential: SnapCredential = {
        description: vcId,
        type: 'Identify',
        credentialData: newIdentifyCredentialData,
      };

      await SnapState.setCredential(newIdentifyCredential);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new Error('unknown error: likely google not configured');
    }
  }

  public static async clearAllIdentifyCredentials(stores: string[]) {
    try {
      const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
        ethereum,
      );

      const options = {
        store: stores,
      };

      const params = {
        metamaskAddress,
        options,
      };

      return JSON.stringify(
        await snap.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: 'npm:@tuum-tech/identify',
            request: {
              method: 'deleteAllVCs',
              params,
            },
          },
        }),
      );
    }
    catch(error:unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new Error('unknown error: likely google not configured');
    }
  }

  public static async clearIdentifyCredential(stores: string[], vcId: string) {
    try {
      const id = [vcId];
      const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
        ethereum,
      );

      const options = {
        store: stores,
      };

      const params = {
        metamaskAddress,
        id,
        options,
      };

      return JSON.stringify(
        await snap.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: 'npm:@tuum-tech/identify',
            request: {
              method: 'removeVC',
              params,
            },
          },
        }),
      );
    }
    catch(error:unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      throw new Error('unknown error: likely google not configured');
    }
  }
}
