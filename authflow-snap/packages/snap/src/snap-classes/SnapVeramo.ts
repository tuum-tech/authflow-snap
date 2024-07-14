import { createAgent, ICredentialIssuer, IDIDManager, IKeyManager, IDataStore, IDataStoreORM } from '@veramo/core';
import { CredentialIssuer, CredentialPlugin } from '@veramo/credential-w3c';
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager';
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager';
import { KeyManagementSystem } from '@veramo/kms-local';
import { KeyDIDProvider } from '@veramo/did-provider-key';


export class SnapVeramo {
  public static createAgent() {
    return createAgent<IDIDManager & IKeyManager & ICredentialIssuer & IDataStore & IDataStoreORM>({
      plugins: [
        new KeyManager({
          store: new MemoryKeyStore(),
          kms: {
            local: new KeyManagementSystem(new MemoryPrivateKeyStore()),
          },
        }),
        new DIDManager({
          store: new MemoryDIDStore(),
          defaultProvider: 'did:key',
          providers: {
            'did:key': new KeyDIDProvider({
              defaultKms: 'local',
            }),
          },
        }),
        new CredentialIssuer(),
      ],
    });
  }
}
