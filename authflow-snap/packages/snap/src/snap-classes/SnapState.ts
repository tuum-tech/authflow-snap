import type {
  BasicCredentials,
  UserCredentials,
} from '../snap-types/SnapTypes';

export class SnapState {
  public static async getPasswords() {
    const passwords = await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });
    return passwords;
  }

  public static async storePassword(credentials: BasicCredentials) {
    const passwords = await SnapState.getPasswords();

    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...passwords,
          [credentials.description]: `${credentials.username} ${credentials.password}`,
        },
      },
    });
  }

  public static async clearPasswords() {
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'clear',
      },
    });
  }

  public static async searchPasswords(searchTerm: string) {
    const passwords = await SnapState.getPasswords();

    try {
      if (passwords) {
        Object.entries(passwords).forEach(([key]) => {
          if (!key.includes(searchTerm)) {
            delete passwords[key];
          }
        });
      }

      console.log('returning pw with no error');
      return passwords;
    } catch (error: any) {
      console.error(error.message);
      return passwords;
    }
  }

  public static async getCredentialsForDescription(description: string) {
    const passwords = await SnapState.getPasswords();
    let basicCredentials: UserCredentials = {
      username: 'error',
      password: 'error',
    };

    if (passwords === null) {
      return basicCredentials;
    }

    Object.entries(passwords).forEach(([key, value]) => {
      console.log(`Key: ${key}, Value:`, value);

      if (value !== null) {
        if (key === description) {
          const creds: string[] = value.toString().split(' ');

          if (creds[0] !== undefined && creds[1] !== undefined) {
            basicCredentials = { username: creds[0], password: creds[1] };
          }
        }
      }
    });

    return basicCredentials;
  }
}
