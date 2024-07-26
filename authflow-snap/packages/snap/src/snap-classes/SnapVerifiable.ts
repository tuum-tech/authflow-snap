import type {
  IdentifyCredential,
  SnapCredential,
} from '../snap-types/SnapTypes';
import { SnapCrypto } from './SnapCrypto';
import { SnapState } from './SnapState';

export class SnapVerifiable {
  public static async getVerifiableCredentials(stores: string[]) {
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

  public static async createVPFromVCs(vcNamesCSV: any) {
    const vcNames = vcNamesCSV.split(',');
    const vcIds = await SnapState.getIdentifyIdsForNames(vcNames);
    const stores = ['snap'];
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
  }

  public static async getVCForKey(stores: string[], key: string) {
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

  public static async seedVerifiableCredentials() {
    const metamaskAddress = await SnapCrypto.getCurrentMetamaskAccount(
      ethereum,
    );

    const options = {
      store: ['snap'],
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
      store: 'snap',
    };

    const newIdentifyCredential: SnapCredential = {
      description: vcId,
      type: 'Identify',
      credentialData: newIdentifyCredentialData,
    };

    await SnapState.setCredential(newIdentifyCredential);
  }

  public static async clearAllIdentifyCredentials(stores: string[]) {
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
}
