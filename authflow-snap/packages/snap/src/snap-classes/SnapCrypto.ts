import type { SnapsEthereumProvider } from '@metamask/snaps-sdk';

export class SnapCrypto {
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * Get current network.
   *
   * @param metamask - Metamask provider.
   */

  public static async getCurrentMetamaskAccount(
    metamask: SnapsEthereumProvider,
  ): Promise<string> {
    try {
      const accounts = (await metamask.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (accounts[0] && accounts.length > 0) {
        return accounts[0];
      }

      return '';
    } catch (error: unknown) {
      let errorMessage =
        'An unknown error occurred while fetching MetaMask account.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error(`Error in getCurrentMetamaskAccount: ${errorMessage}`);
      return '';
    }
  }
}
