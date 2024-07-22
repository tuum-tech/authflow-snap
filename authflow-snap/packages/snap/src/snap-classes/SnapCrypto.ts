import type { SnapsEthereumProvider } from '@metamask/snaps-sdk';

export class SnapCrypto {
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * Get current network.
   *
   * @param metamask - Metamask provider.
   */
  public static async getCurrentNetwork(
    metamask: SnapsEthereumProvider,
  ): Promise<string> {
    return (await metamask.request({
      method: 'eth_chainId',
    })) as string;
  }

  public static async getCurrentMetamaskAccount(
    metamask: SnapsEthereumProvider,
  ): Promise<string> {
    const accounts = (await metamask.request({
      method: 'eth_requestAccounts',
    })) as string[];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return accounts[0];
  }
}
