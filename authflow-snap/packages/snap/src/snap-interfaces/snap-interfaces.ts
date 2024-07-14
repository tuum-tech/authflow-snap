import { input, button, form } from '@metamask/snaps-sdk';

export class SnapInterfaces {
  public static async createPasswordSaveInterface() {
    const interfaceId = await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: form({
          name: 'password-save-form',
          children: [
            input({
              name: 'credential-description',
              placeholder: `description`,
            }),
            input({
              name: 'user-name',
              placeholder: 'username',
            }),
            input({
              name: 'password',
              placeholder: 'password',
            }),
            button({
              name: 'btn-save-pw',
              value: 'Save',
              buttonType: 'submit',
            }),
          ],
        }),
      },
    });

    return interfaceId;
  }

  public static async createVCSaveInterface() {
    const interfaceId = await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: form({
          name: 'vc-save-form',
          children: [
            input({
              name: 'credential-description',
              placeholder: `description`,
            }),
            input({
              name: 'vc-json',
              placeholder: 'json',
            }),
            button({
              name: 'btn-save-vc',
              value: 'Save',
              buttonType: 'submit',
            }),
          ],
        }),
      },
    });

    return interfaceId;
  }

  public static async createPasswordSearchInterface() {
    const interfaceId = await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: form({
          name: 'password-search-form',
          children: [
            input({
              name: 'search-term',
              placeholder: `thing to search`,
            }),
            button({
              name: 'btn-search-pw',
              value: 'Search',
              buttonType: 'submit',
            }),
          ],
        }),
      },
    });

    return interfaceId;
  }

  public static async createBasicCredSelectInterface() {
    const interfaceId = await snap.request({
      method: 'snap_createInterface',
      params: {
        ui: form({
          name: 'creds-search-form',
          children: [
            input({
              name: 'cred-description',
              placeholder: `credential description`,
            }),
            button({
              name: 'btn-select-cred',
              value: 'Select',
              buttonType: 'submit',
            }),
          ],
        }),
      },
    });

    return interfaceId;
  }
}
