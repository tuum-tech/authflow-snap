import type { SnapsEthereumProvider } from '@metamask/snaps-sdk';

import { SnapCrypto } from './SnapCrypto';

describe('SnapCrypto', () => {
  let mockMetamask: jest.Mocked<SnapsEthereumProvider>;

  beforeEach(() => {
    mockMetamask = {
      request: jest.fn(),
    } as unknown as jest.Mocked<SnapsEthereumProvider>;
  });

  describe('getCurrentMetamaskAccount', () => {
    it('should return the first account when accounts are available', async () => {
      const expectedAccount = '0x1234567890abcdef1234567890abcdef12345678';
      mockMetamask.request.mockResolvedValueOnce([expectedAccount]);

      const account = await SnapCrypto.getCurrentMetamaskAccount(mockMetamask);

      expect(account).toBe(expectedAccount);
      expect(mockMetamask.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });

    it('should return an empty string when no accounts are available', async () => {
      mockMetamask.request.mockResolvedValueOnce([]);

      const account = await SnapCrypto.getCurrentMetamaskAccount(mockMetamask);

      expect(account).toBe('');
      expect(mockMetamask.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });

    it('should return an empty string and log an error when an exception is thrown', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const errorMessage = 'Metamask error';
      mockMetamask.request.mockRejectedValueOnce(new Error(errorMessage));

      const account = await SnapCrypto.getCurrentMetamaskAccount(mockMetamask);

      expect(account).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Error in getCurrentMetamaskAccount: ${errorMessage}`,
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return an empty string and log an unknown error if error is not an instance of Error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMetamask.request.mockRejectedValueOnce('Some unknown error');

      const account = await SnapCrypto.getCurrentMetamaskAccount(mockMetamask);

      expect(account).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in getCurrentMetamaskAccount: An unknown error occurred',
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
