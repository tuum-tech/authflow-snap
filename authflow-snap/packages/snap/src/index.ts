import type {
  OnRpcRequestHandler,
  OnHomePageHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import {
  button,
  panel,
  text,
  heading,
  UserInputEventType,
} from '@metamask/snaps-sdk';
import { divider } from '@metamask/snaps-ui';

import { SnapState } from './snap-classes/SnapState';
import { SnapVerified } from './snap-classes/SnapVerified';
import { SnapUiInterfaces } from './snap-interfaces/snap-ui-interfaces';
import type {
  BasicCredential,
  CredsRequestParams,
  SnapCredential,
} from './snap-types/SnapTypes';
import { SnapViewModels } from './snap-view-models/snap-vm';

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  let credentialDescription;
  let returnedCreds: BasicCredential | string;
  let credsRequestParams: CredsRequestParams;

  switch (request.method) {
    case 'hello':
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: SnapViewModels.helloViewModel(origin),
        },
      });
    case 'getBasicCreds':
      credsRequestParams = request.params as CredsRequestParams;
      credentialDescription = credsRequestParams.credentialDescription;
      if (credentialDescription !== undefined) {
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.retrieveBasicCredsViewModel(
              credentialDescription,
              origin,
            ),
          },
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        returnedCreds = await SnapState.getCredentialsForDescription(
          credentialDescription,
        );
        return returnedCreds;
      }

      return null;

    case 'getVerifiableCreds':
      credsRequestParams = request.params as CredsRequestParams;
      credentialDescription = credsRequestParams.credentialDescription;
      if (credentialDescription !== undefined) {
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.retrieveVerifiableCredsViewModel(
              credentialDescription,
              origin,
            ),
          },
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        returnedCreds = await SnapState.getCredentialsForDescription(
          credentialDescription,
        );
        return returnedCreds;
      }
      return null;

    case 'createVerifiablePresentation':
      credsRequestParams = request.params as CredsRequestParams;
      credentialDescription = credsRequestParams.credentialDescription;
      if (credentialDescription !== undefined) {
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.displayVPConfirmationViewModel(
              credentialDescription,
              origin,
            ),
          },
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        returnedCreds = await SnapState.getCredentialsForDescription(
          credentialDescription,
        );
        return returnedCreds;
      }
      return null;

    default:
      throw new Error('Method not found.');
  }
};

export const onHomePage: OnHomePageHandler = async () => {
  return {
    content: panel([
      heading('AuthFlow'),
      text('Welcome to AuthFlow! Select an option below :'),
      button({
        value: 'Store New Passwords',
        name: 'btn-home-store',
      }),
      button({
        value: 'Clear All Passwords',
        name: 'btn-home-clear',
      }),
      button({
        value: 'Show All Passwords',
        name: 'btn-home-show',
      }),
      divider(),
      button({
        value: 'Get All Verified Credentials',
        name: 'btn-home-vc-show',
      }),
      button({
        value: 'Delete All Verified Credentials',
        name: 'btn-home-vc-delete-all',
      }),
      button({
        value: 'Save New Verified Credential',
        name: 'btn-home-vc-save',
      }),
      divider(),
      button({
        value: 'Create Verified Presentation',
        name: 'btn-home-vp-create',
      }),
    ]),
  };
};

export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  let result;

  if (event.type === UserInputEventType.InputChangeEvent) {
    return;
  }

  if (event.type === UserInputEventType.FormSubmitEvent) {
    let userName, pw, desc;

    switch (event.name) {
      case 'password-save-form':
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Returned event values are ${JSON.stringify(event.value)}`);

        userName = event.value['user-name'];
        pw = event.value.password;
        desc = event.value['credential-description'];

        if (userName && pw && desc) {
          const basicCredentials: SnapCredential = {
            description: desc,
            type: 'Basic',
            credentialData: {
              username: userName,
              password: pw,
            },
          };

          await SnapState.setCredential(basicCredentials);
        }
        break;
      case 'vc-save-form':
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Returned event values are ${JSON.stringify(event.value)}`);
        try {
          await SnapVerified.saveDummyVerifiedCredentials();
          console.log(`successfully saved dummy verified credentials`);
        } catch (error: any) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.log(`error: ${error.message}`);
        }
        break;
      case 'vp-create-form':
        break;
      case 'password-search-form':
        break;
      default:
        console.log('no logic for this form');
    }
  }

  if (event.type === UserInputEventType.ButtonClickEvent) {
    console.log(`The interface being acted on is ${id}`);

    switch (event.name) {
      case 'btn-home-store':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            id: await SnapUiInterfaces.createPasswordSaveInterface(),
          },
        });
        break;
      case 'btn-home-clear':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.clearAllViewModel(),
          },
        });

        if (result === true) {
          await SnapState.clearCredentials();
        }
        break;
      case 'btn-home-vc-delete-all':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.clearAllVCViewModel(),
          },
        });

        if (result === true) {
          await SnapState.clearCredentials();
        }
        break;
      case 'btn-home-show':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: await SnapViewModels.displayBasicCredentialsViewModel(
              await SnapState.getCredentials(),
            ),
          },
        });
        break;
      case 'btn-home-search':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            id: await SnapUiInterfaces.createPasswordSearchInterface(),
          },
        });
        break;
      case 'btn-select-cred':
        break;
      case 'btn-home-vc-show':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: await SnapViewModels.displayVerifiedCredentialsViewModel(
              await SnapState.getCredentials(),
            ),
          },
        });
        break;
      case 'btn-home-vc-save':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            id: await SnapUiInterfaces.createVCSaveInterface(),
          },
        });
        break;
      case 'btn-home-vp-create':
        result = await snap.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: 'npm:@tuum-tech/identify',
            request: {
              method: 'hello',
              params: {
                metamaskAddress: '0x118fC316ff8651370dAdE2aEa34465C55873af30',
              },
            },
          },
        });
        console.log(`identify data ${JSON.stringify(result)}`);
        break;
      default:
        console.log('no logic for this button');
    }
  }
};
