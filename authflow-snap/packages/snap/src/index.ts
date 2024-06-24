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

import { SnapState } from './snap-classes/SnapState';
import { SnapInterfaces } from './snap-interfaces/snap-interfaces';
import type {
  BasicCredentials,
  BasicCredsRequestParams,
  UserCredentials,
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
  let returnedCreds: UserCredentials;
  let credsRequestParams: BasicCredsRequestParams;

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
      credsRequestParams = request.params as BasicCredsRequestParams;
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
      heading('AuthSnap'),
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
      button({
        value: 'Search Passwords',
        name: 'btn-home-search',
      }),
    ]),
  };
};

export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  let result;

  if (event.type === UserInputEventType.FormSubmitEvent) {
    let userName, pw, desc, searchTerm;

    switch (event.name) {
      case 'password-save-form':
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Returned event values are ${JSON.stringify(event.value)}`);

        userName = event.value['user-name'];
        pw = event.value.password;
        desc = event.value['credential-description'];

        if (userName && pw && desc) {
          const basicCredentials: BasicCredentials = {
            username: userName,
            password: pw,
            description: desc,
          };

          await SnapState.storePassword(basicCredentials);
        }
        break;
      case 'password-search-form':
        console.log('we are hitting form submit');
        searchTerm = event.value['search-term'];
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`search term is ${searchTerm}`);

        try {
          if (searchTerm) {
            result = await snap.request({
              method: 'snap_dialog',
              params: {
                type: 'alert',
                content: await SnapViewModels.displayPasswordsViewModel(
                  await SnapState.searchPasswords(searchTerm),
                ),
              },
            });

            return result;
          }
        } catch (error: any) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.log(`${error.message}`);
        }
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
            id: await SnapInterfaces.createPasswordSaveInterface(),
          },
        });
        return result;
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
          await SnapState.clearPasswords();
        }
        return result;
        break;
      case 'btn-home-show':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: await SnapViewModels.displayPasswordsViewModel(
              await SnapState.getPasswords(),
            ),
          },
        });
        return result;
        break;
      case 'btn-home-search':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            id: await SnapInterfaces.createPasswordSearchInterface(),
          },
        });
        return result;
        break;
      case 'btn-select-cred':
        break;
      default:
        console.log('no logic for this button');
    }
  }
};
