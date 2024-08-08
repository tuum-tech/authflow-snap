import { SnapCrypto } from './SnapCrypto';
import { SnapState } from './SnapState';
import { SnapVerifiable } from './SnapVerifiable';

jest.mock('./SnapCrypto');
jest.mock('./SnapState');

// Mock the snap object globally
// eslint-disable-next-line no-restricted-globals
(global as any).snap = {
  request: jest.fn(),
};

// Mock the ethereum object globally
// eslint-disable-next-line no-restricted-globals
(global as any).ethereum = {
  request: jest.fn(),
};

describe('SnapVerifiable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVerifiableCredentials', () => {
    it('should retrieve verifiable credentials', async () => {
      const stores = ['snap'];
      const metamaskAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const vcResponse = [{ id: 'vc1' }];

      (SnapCrypto.getCurrentMetamaskAccount as jest.Mock).mockResolvedValue(
        metamaskAddress,
      );
      snap.request.mockResolvedValue(vcResponse);

      const result = await SnapVerifiable.getVerifiableCredentials(stores);

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'getVCs',
            params: {
              filter: null,
              metamaskAddress,
              options: { store: stores },
            },
          },
        },
      });
      expect(result).toStrictEqual(JSON.stringify(vcResponse));
    });

    it('should throw an error if retrieval fails', async () => {
      (SnapCrypto.getCurrentMetamaskAccount as jest.Mock).mockRejectedValue(
        new Error('Metamask error'),
      );

      await expect(SnapVerifiable.getVerifiableCredentials([])).rejects.toThrow(
        'Error in identify: Metamask error, likely google not configured',
      );

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
    });
  });

  describe('createVPFromVCs', () => {
    it('should create a verifiable presentation from VCs', async () => {
      const stores = ['snap'];
      const vcNamesCSV = 'vc1,vc2';
      const vcIds = ['vcId1', 'vcId2'];
      const metamaskAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const vpResponse = { vp: 'presentation' };
      jest
        .spyOn(SnapState, 'getIdentifyIdsForNames')
        .mockImplementation()
        .mockResolvedValue(vcIds);
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockResolvedValue(metamaskAddress);
      jest
        .spyOn(snap, 'request')
        .mockImplementation()
        .mockResolvedValue(vpResponse);

      const result = await SnapVerifiable.createVPFromVCs(vcNamesCSV, stores);

      expect(SnapState.getIdentifyIdsForNames).toHaveBeenCalledWith([
        'vc1',
        'vc2',
      ]);
      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'createVP',
            params: {
              metamaskAddress,
              vcIds,
              options: { store: stores },
            },
          },
        },
      });
      expect(result).toStrictEqual(vpResponse);
    });

    it('should throw an error if creation fails', async () => {
      jest
        .spyOn(SnapState, 'getIdentifyIdsForNames')
        .mockImplementation()
        .mockRejectedValue(new Error('VC error'));

      await expect(SnapVerifiable.createVPFromVCs('vc1', [])).rejects.toThrow(
        'unknown error: likely google not configured',
      );

      expect(SnapState.getIdentifyIdsForNames).toHaveBeenCalled();
    });
  });

  describe('getVCForKey', () => {
    it('should retrieve a verifiable credential for a given key', async () => {
      const stores = ['snap'];
      const key = 'vcKey';
      const metamaskAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const vcResponse = { id: 'vc1' };
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockResolvedValue(metamaskAddress);
      jest
        .spyOn(snap, 'request')
        .mockImplementation()
        .mockResolvedValue(vcResponse);

      const result = await SnapVerifiable.getVCForKey(stores, key);

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'getVCs',
            params: {
              metamaskAddress,
              filter: { type: 'id', filter: key },
              options: { store: stores },
            },
          },
        },
      });
      expect(result).toStrictEqual(vcResponse);
    });

    it('should throw an error if retrieval fails', async () => {
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockRejectedValue(new Error('Metamask error'));

      await expect(SnapVerifiable.getVCForKey([], 'key')).rejects.toThrow(
        'unknown error: likely google not configured',
      );

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
    });
  });

  describe('seedVerifiableCredentials', () => {
    it('should seed verifiable credentials', async () => {
      const stores = ['snap'];
      const metamaskAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const vcResponse = { metadata: { id: 'vcId1' } };
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockResolvedValue(metamaskAddress);
      jest
        .spyOn(snap, 'request')
        .mockImplementation()
        .mockResolvedValue(vcResponse);

      await SnapVerifiable.seedVerifiableCredentials(stores);

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'createVC',
            params: {
              metamaskAddress,
              vcKey: 'Sample Authflow Credential',
              vcValue: { name: 'My Sample Authflow Credential' },
              options: { store: stores },
            },
          },
        },
      });
      expect(SnapState.setCredential).toHaveBeenCalledWith({
        description: 'vcId1',
        type: 'Identify',
        credentialData: { id: 'vcId1' },
      });
    });

    it('should throw an error if seeding fails', async () => {
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockRejectedValue(new Error('Metamask error'));

      await expect(
        SnapVerifiable.seedVerifiableCredentials([]),
      ).rejects.toThrow('unknown error: likely google not configured');

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
    });
  });

  describe('clearAllIdentifyCredentials', () => {
    it('should clear all identify credentials', async () => {
      const stores = ['snap'];
      const metamaskAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const clearResponse = 'success';
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockResolvedValue(metamaskAddress);
      jest
        .spyOn(snap, 'request')
        .mockImplementation()
        .mockResolvedValue(clearResponse);

      const result = await SnapVerifiable.clearAllIdentifyCredentials(stores);

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'deleteAllVCs',
            params: {
              metamaskAddress,
              options: { store: stores },
            },
          },
        },
      });
      expect(result).toStrictEqual(JSON.stringify(clearResponse));
    });

    it('should throw an error if clearing fails', async () => {
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockRejectedValue(new Error('Metamask error'));

      await expect(
        SnapVerifiable.clearAllIdentifyCredentials([]),
      ).rejects.toThrow('unknown error: likely google not configured');

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
    });
  });

  describe('clearIdentifyCredential', () => {
    it('should clear a specific identify credential', async () => {
      const stores = ['snap'];
      const vcId = 'vcId1';
      const metamaskAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const clearResponse = 'success';
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockResolvedValue(metamaskAddress);
      jest
        .spyOn(snap, 'request')
        .mockImplementation()
        .mockResolvedValue(clearResponse);

      const result = await SnapVerifiable.clearIdentifyCredential(stores, vcId);

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'wallet_invokeSnap',
        params: {
          snapId: 'npm:@tuum-tech/identify',
          request: {
            method: 'removeVC',
            params: {
              metamaskAddress,
              id: [vcId],
              options: { store: stores },
            },
          },
        },
      });
      expect(result).toStrictEqual(JSON.stringify(clearResponse));
    });

    it('should throw an error if clearing fails', async () => {
      jest
        .spyOn(SnapCrypto, 'getCurrentMetamaskAccount')
        .mockImplementation()
        .mockRejectedValue(new Error('Metamask error'));

      await expect(
        SnapVerifiable.clearIdentifyCredential([], 'vcId'),
      ).rejects.toThrow('unknown error: likely google not configured');

      expect(SnapCrypto.getCurrentMetamaskAccount).toHaveBeenCalled();
    });
  });
});
