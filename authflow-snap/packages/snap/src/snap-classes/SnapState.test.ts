import { SnapCrypto } from './SnapCrypto';
import { SnapState } from './SnapState';
import { SnapVerifiable } from './SnapVerifiable';
import { v4 as uuidv4 } from 'uuid';

jest.mock('./SnapCrypto');
jest.mock('./SnapVerifiable');
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

(global as any).snap = {
  request: jest.fn(),
};

(global as any).ethereum = {
  request: jest.fn(),
};

describe('SnapState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('outputCredentialsToConsole', () => {
    it('should output credentials to console if credentials exist', async () => {
      const credentials = {
        credential1: {
          type: 'Basic',
          description: 'desc1',
          credentialData: {},
        },
      };
      snap.request.mockResolvedValue(credentials);

      jest.spyOn(console, 'log').mockImplementation();

      await SnapState.outputCredentialsToConsole();

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(console.log).toHaveBeenCalledWith(
        `Key: credential1, Item: ${JSON.stringify(credentials.credential1)}`,
      );
    });

    it('should log "No credentials found." if no credentials exist', async () => {
      snap.request.mockResolvedValue(null);

      jest.spyOn(console, 'log').mockImplementation();

      await SnapState.outputCredentialsToConsole();

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(console.log).toHaveBeenCalledWith('No credentials found.');
    });

    it('should log an error if something goes wrong', async () => {
      snap.request.mockRejectedValue(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      await SnapState.outputCredentialsToConsole();

      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('getCredentials', () => {
    it('should return credentials if successful', async () => {
      const credentials = { credential1: { type: 'Basic' } };
      snap.request.mockResolvedValue(credentials);

      const result = await SnapState.getCredentials();

      expect(result).toEqual(credentials);
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
    });

    it('should return null and log an error if something goes wrong', async () => {
      snap.request.mockRejectedValue(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      const result = await SnapState.getCredentials();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('clearBasicCredentials', () => {
    it('should clear basic credentials', async () => {
      const credentials = {
        basic1: { type: 'Basic', description: 'desc1', credentialData: {} },
        identify1: {
          type: 'Identify',
          description: 'desc2',
          credentialData: {},
        },
      };
      snap.request.mockResolvedValueOnce(credentials);

      await SnapState.clearBasicCredentials();

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            identify1: {
              type: 'Identify',
              description: 'desc2',
              credentialData: {},
            },
          },
        },
      });
    });

    it('should log an error if something goes wrong', async () => {
      snap.request.mockRejectedValue(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      await SnapState.clearBasicCredentials();

      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('clearBasicCredential', () => {
    it('should clear a specific basic credential', async () => {
      const credentials = {
        basic1: { type: 'Basic', description: 'name1', credentialData: {} },
        basic2: { type: 'Basic', description: 'name2', credentialData: {} },
      };
      snap.request.mockResolvedValueOnce(credentials);

      await SnapState.clearBasicCredential('name1');

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            basic2: { type: 'Basic', description: 'name2', credentialData: {} },
          },
        },
      });
    });

    it('should log an error if something goes wrong', async () => {
      snap.request.mockRejectedValue(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      await SnapState.clearBasicCredential('name1');

      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('clearVerifiableCredentials', () => {
    it('should clear verifiable credentials', async () => {
      const credentials = {
        identify1: {
          type: 'Identify',
          description: 'desc1',
          credentialData: {},
        },
        basic1: { type: 'Basic', description: 'desc2', credentialData: {} },
      };
      snap.request.mockResolvedValueOnce(credentials);
      (
        SnapVerifiable.clearAllIdentifyCredentials as jest.Mock
      ).mockResolvedValueOnce('done');

      await SnapState.clearVerifiableCredentials();

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            basic1: { type: 'Basic', description: 'desc2', credentialData: {} },
          },
        },
      });
      expect(SnapVerifiable.clearAllIdentifyCredentials).toHaveBeenCalledWith([
        'snap',
        'googleDrive',
      ]);
    });

    it('should handle errors during verifiable credential clearing', async () => {
      snap.request.mockRejectedValueOnce(new Error('Test error'));
      (
        SnapVerifiable.clearAllIdentifyCredentials as jest.Mock
      ).mockRejectedValueOnce(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      await SnapState.clearVerifiableCredentials();

      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('deleteVerifiedCredential', () => {
    it('should delete a verified credential and clear it from stores', async () => {
      const credentials = {
        identify1: {
          type: 'Identify',
          description: 'name1',
          credentialData: { id: 'id1' },
        },
      };
      snap.request.mockResolvedValueOnce(credentials);
      (SnapVerifiable.clearIdentifyCredential as jest.Mock).mockResolvedValue(
        'done',
      );

      await SnapState.deleteVerifiedCredential('name1');

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {},
        },
      });
      expect(SnapVerifiable.clearIdentifyCredential).toHaveBeenCalledWith(
        ['snap', 'googleDrive'],
        'id1',
      );
    });

    it('should log an error if something goes wrong', async () => {
      snap.request.mockRejectedValueOnce(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      await SnapState.deleteVerifiedCredential('name1');

      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('setCredential', () => {
    it('should set a credential', async () => {
      const credentials = {
        existingCredential: { type: 'Basic', description: 'desc' },
      };
      const newCredential = {
        type: 'Basic',
        description: 'newDesc',
        credentialData: {},
      };
      const newUUID = 'uuid-1234';

      (uuidv4 as jest.Mock).mockReturnValue(newUUID);
      snap.request.mockResolvedValueOnce(credentials);

      await SnapState.setCredential(newCredential as any);

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            ...credentials,
            [newUUID]: {
              type: newCredential.type,
              description: newCredential.description,
              credentialData: newCredential.credentialData,
            },
          },
        },
      });
    });

    it('should log an error if something goes wrong', async () => {
      const newCredential = {
        type: 'Basic',
        description: 'newDesc',
        credentialData: {},
      };
      snap.request.mockRejectedValueOnce(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      await SnapState.setCredential(newCredential as any);

      expect(console.error).toHaveBeenCalledWith(
        'Error in setCredential: Test error',
      );
    });
  });

  describe('getBasicCredentialsForDescription', () => {
    it('should return basic credentials for a given description', async () => {
      const credentials = {
        credential1: {
          type: 'Basic',
          description: 'desc1',
          credentialData: { username: 'user', password: 'pass' },
        },
      };
      snap.request.mockResolvedValueOnce(credentials);

      const result = await SnapState.getBasicCredentialsForDescription('desc1');

      expect(result).toEqual({ username: 'user', password: 'pass' });
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
    });

    it('should return empty credentials if not found', async () => {
      const credentials = {
        credential1: {
          type: 'Basic',
          description: 'desc2',
          credentialData: { username: 'user', password: 'pass' },
        },
      };
      snap.request.mockResolvedValueOnce(credentials);

      const result = await SnapState.getBasicCredentialsForDescription('desc1');

      expect(result).toEqual({ username: '', password: '' });
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
    });

    it('should log an error if something goes wrong', async () => {
      snap.request.mockRejectedValueOnce(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      const result = await SnapState.getBasicCredentialsForDescription('desc1');

      expect(result).toEqual({ username: '', password: '' });
      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('getIdentityCredentialForDescription', () => {
    it('should return identity credential for a given description', async () => {
      const credentials = {
        credential1: {
          type: 'Identify',
          description: 'desc1',
          credentialData: { id: 'id1' },
        },
      };
      const vcResponse = { vc: 'verifiableCredential' };
      snap.request.mockResolvedValueOnce(credentials);
      (SnapVerifiable.getVCForKey as jest.Mock).mockResolvedValueOnce(
        vcResponse,
      );

      const result = await SnapState.getIdentityCredentialForDescription(
        'desc1',
      );

      expect(result).toEqual(vcResponse);
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(SnapVerifiable.getVCForKey).toHaveBeenCalledWith(
        ['snap', 'googleDrive'],
        'id1',
      );
    });

    it('should return null if no matching credential is found', async () => {
      const credentials = {
        credential1: {
          type: 'Identify',
          description: 'desc2',
          credentialData: { id: 'id1' },
        },
      };
      snap.request.mockResolvedValueOnce(credentials);

      const result = await SnapState.getIdentityCredentialForDescription(
        'desc1',
      );

      expect(result).toBeNull();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
    });

    it('should log an error if something goes wrong', async () => {
      snap.request.mockRejectedValueOnce(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      const result = await SnapState.getIdentityCredentialForDescription(
        'desc1',
      );

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('syncCredentials', () => {
    it('should sync credentials', async () => {
      jest.spyOn(SnapState, 'syncGoogleCredentials').mockResolvedValueOnce('done');
      const vcsResponse = JSON.stringify([{ metadata: { id: 'id1' } }]);
      jest.spyOn(SnapVerifiable, 'getVerifiableCredentials').mockResolvedValueOnce(vcsResponse);
      const credentials = { credential1: { type: 'Identify', description: 'desc1', credentialData: { id: 'id1' } } };
      (snap.request as jest.Mock).mockResolvedValueOnce(credentials);
      jest.spyOn(SnapState, 'outputCredentialsToConsole').mockImplementationOnce(jest.fn());
      jest.spyOn(SnapState, 'updateCredentials').mockImplementationOnce(jest.fn());
      jest.spyOn(SnapState, 'removeObsoleteCredentials').mockImplementationOnce(jest.fn());

      await SnapState.syncCredentials();

      expect(SnapState.syncGoogleCredentials).toHaveBeenCalled();
      expect(SnapVerifiable.getVerifiableCredentials).toHaveBeenCalledWith(['snap', 'googleDrive']);
      expect(SnapState.updateCredentials).toHaveBeenCalled();
      expect(SnapState.outputCredentialsToConsole).toHaveBeenCalled();
      expect(SnapState.removeObsoleteCredentials).toHaveBeenCalled();
    });

    it('should log an error if something goes wrong', async () => {
      (SnapState.syncGoogleCredentials as jest.Mock).mockRejectedValueOnce(
        new Error('Test error'),
      );

      jest.spyOn(console, 'error').mockImplementation();

      await SnapState.syncCredentials();

      expect(console.error).toHaveBeenCalledWith(
        'Error in syncCredentials: Test error',
      );
    });
  });

  describe('getIdsFromIdentifyData', () => {
    it('should return ids from identify data', () => {
      const data = [{ metadata: { id: 'id1' } }, { metadata: { id: 'id2' } }];
      const result = SnapState.getIdsFromIdentifyData(data);
      expect(result).toEqual(['id1', 'id2']);
    });

    it('should log an error if something goes wrong', () => {
      jest.spyOn(console, 'error').mockImplementation();
      const result = SnapState.getIdsFromIdentifyData(null);
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error in getIdsFromIdentifyData: Not a valid input object',
      );
    });
  });

  describe('renameIdentifyCredential', () => {
    it('should rename an identify credential', async () => {
      const credentials = {
        identify1: {
          type: 'Identify',
          description: 'oldName',
          credentialData: { id: 'id1' },
        },
      };
      snap.request.mockResolvedValueOnce(credentials);

      await SnapState.renameIdentifyCredential('id1', 'newName');

      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: {
            identify1: {
              type: 'Identify',
              description: 'newName',
              credentialData: { id: 'id1' },
            },
          },
        },
      });
    });

    it('should log an error if something goes wrong', async () => {
      snap.request.mockRejectedValueOnce(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      await SnapState.renameIdentifyCredential('id1', 'newName');

      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('getIdentifyIdsForNames', () => {
    it('should return identify ids for names', async () => {
      const credentials = {
        identify1: {
          type: 'Identify',
          description: 'name1',
          credentialData: { id: 'id1' },
        },
      };
      snap.request.mockResolvedValueOnce(credentials);

      const result = await SnapState.getIdentifyIdsForNames(['name1']);

      expect(result).toEqual(['id1']);
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
    });

    it('should return an empty array if no matching credentials are found', async () => {
      const credentials = {
        identify1: {
          type: 'Identify',
          description: 'name2',
          credentialData: { id: 'id2' },
        },
      };
      snap.request.mockResolvedValueOnce(credentials);

      const result = await SnapState.getIdentifyIdsForNames(['name1']);

      expect(result).toEqual([]);
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'get' },
      });
    });

    it('should log an error if something goes wrong', async () => {
      snap.request.mockRejectedValueOnce(new Error('Test error'));

      jest.spyOn(console, 'error').mockImplementation();

      const result = await SnapState.getIdentifyIdsForNames(['name1']);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Error in getCredentials: Test error',
      );
    });
  });

  describe('syncGoogleCredentials', () => {
    it('should sync google credentials', async () => {
      const metamaskAddress = '0x1234567890abcdef1234567890abcdef12345678';
      (SnapCrypto.getCurrentMetamaskAccount as jest.Mock).mockResolvedValueOnce(
        metamaskAddress,
      );
      const result = { synced: true };
      snap.request.mockResolvedValueOnce(result);

      const response = await SnapState.syncGoogleCredentials();

      expect(response).toEqual(result);
      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'syncGoogleVCs',
            params: { metamaskAddress },
          },
        },
      });
    });

    it('should log an error if something goes wrong', async () => {
      (SnapCrypto.getCurrentMetamaskAccount as jest.Mock).mockRejectedValueOnce(
        new Error('Test error'),
      );

      jest.spyOn(console, 'error').mockImplementation();

      const result = await SnapState.syncGoogleCredentials();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error in syncGoogleCredentials: Test error',
      );
    });
  });

  describe('updateCredentials', () => {
    it('should update credentials', async () => {
      const identifyIds = ['id1'];
      const authflowCredentials = {};

      jest.spyOn(SnapState, 'setCredential').mockImplementationOnce(jest.fn());

      await SnapState.updateCredentials(identifyIds, authflowCredentials);

      expect(SnapState.setCredential).toHaveBeenCalled();
    });
  });
});
