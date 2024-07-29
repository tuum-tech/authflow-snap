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
import { SnapVerifiable } from './snap-classes/SnapVerifiable';
import type {
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
  let credentialDescription,
    returnedCreds,
    credsRequestParams: CredsRequestParams,
    result;

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
      if (credentialDescription) {
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.retrieveBasicCredsViewModel(
              credentialDescription,
              origin,
            ),
          },
        });
        if (result === true) {
          returnedCreds = await SnapState.getBasicCredentialsForDescription(
            credentialDescription,
          );
          return returnedCreds;
        }
      } else {
        throw new Error('Credentials undefined.');
      }

      return null;

    case 'getVerifiableCreds':
      credsRequestParams = request.params as CredsRequestParams;
      credentialDescription = credsRequestParams.credentialDescription;
      if (credentialDescription !== undefined) {
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.retrieveVerifiableCredsViewModel(
              credentialDescription,
              origin,
            ),
          },
        });
        if (result === true) {
          returnedCreds = await SnapState.getIdentityCredentialForDescription(
            credentialDescription,
          );
          return returnedCreds;
        }
      }
      return null;

    case 'createVerifiablePresentation':
      credsRequestParams = request.params as CredsRequestParams;
      credentialDescription = credsRequestParams.credentialDescription;
      if (credentialDescription !== undefined) {
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.createVerifiablePresentationViewModel(
              credentialDescription,
              origin,
            ),
          },
        });

        if (result === true) {
          let returnVP;

          try {
            returnVP = await SnapVerifiable.createVPFromVCs(
              credentialDescription,
              ['snap', 'googleDrive'],
            );
          } catch (error) {
            returnVP = await SnapVerifiable.createVPFromVCs(
              credentialDescription,
              ['snap'],
            );
          }

          return returnVP;
        }
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
        value: 'Delete Single Password',
        name: 'btn-home-delete-one-basic',
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
        value: 'Delete One Verified Credential',
        name: 'btn-home-vc-delete-one',
      }),
      button({
        value: 'Rename Verified Credential',
        name: 'btn-home-vc-rename',
      }),
      divider(),
      button({
        value: 'Create Verified Presentation',
        name: 'btn-home-vp-create',
      }),
      divider(),
      button({
        value: 'Create Sample Verified Credential',
        name: 'btn-home-vc-sample-create',
      }),
      button({
        value: 'Sync With Identify',
        name: 'btn-home-sync',
      }),
      button({
        value: 'Output Credentials To Console',
        name: 'btn-home-debug',
      }),
    ]),
  };
};

export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  let result;

  if (event.type === UserInputEventType.FormSubmitEvent) {
    switch (event.name) {
      default:
        console.log('no logic for this form');
    }
  }

  if (event.type === UserInputEventType.ButtonClickEvent) {
    switch (event.name) {
      case 'btn-home-store': {
        const desc = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content:
              await SnapViewModels.displayEnterBasicDescriptionViewModel(),
          },
        });

        const user = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content: await SnapViewModels.displayEnterBasicUserViewModel(),
          },
        });

        const pw = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content: await SnapViewModels.displayEnterBasicPasswordViewModel(),
          },
        });
        if (desc && user && pw) {
          const newBasicSnapCredential: SnapCredential = {
            description: desc.toString(),
            type: 'Basic',
            credentialData: {
              username: user.toString(),
              password: pw.toString(),
            },
          };
          await SnapState.setCredential(newBasicSnapCredential);
        }
        break;
      }
      case 'btn-home-clear':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.clearAllViewModel(),
          },
        });

        if (result === true) {
          await SnapState.clearBasicCredentials();
        }
        break;
      case 'btn-home-delete-one-basic': {
        const name = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content: await SnapViewModels.displayDeleteBasicPasswordViewModel(),
          },
        });
        if (name) {
          await SnapState.clearBasicCredential(name.toString());
        }
        break;
      }
      case 'btn-home-vc-delete-all':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.clearAllVCViewModel(),
          },
        });

        if (result === true) {
          await SnapState.clearVerifiableCredentials();
        }
        break;
      case 'btn-home-vc-delete-one': {
        const name = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content:
              await SnapViewModels.displayDeleteVerifiableCredentialViewModel(),
          },
        });
        if (name) {
          await SnapState.deleteVerifiedCredential(name.toString());
        }
        break;
      }
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
      case 'btn-select-cred':
        break;
      case 'btn-home-vc-show':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: await SnapViewModels.displayVerifiableCredentialsViewModel(
              await SnapState.getCredentials(),
            ),
          },
        });
        break;
      case 'btn-home-vc-sample-create':
        try {
          result = await SnapVerifiable.seedVerifiableCredentials([
            'snap',
            'googleDrive',
          ]);
        } catch (error) {
          result = await SnapVerifiable.seedVerifiableCredentials(['snap']);
        }
        break;
      case 'btn-home-sync':
        try {
          result = await SnapState.syncCredentials();
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'An unknown error occurred';
          console.error(`Error in synchronizing: ${errorMessage}`);
        }
        break;
      case 'btn-home-debug':
        result = await SnapState.outputCredentialsToConsole();
        break;
      case 'btn-home-vc-rename': {
        const vcId = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content:
              await SnapViewModels.displayRenameVerifiableCredentialViewModel(),
            placeholder: 'id',
          },
        });
        const newName = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content:
              await SnapViewModels.displayRenameVerifiableCredentialViewModel(),
            placeholder: 'new name',
          },
        });

        if (
          vcId &&
          typeof vcId === 'string' &&
          newName &&
          typeof newName === 'string'
        ) {
          await SnapState.renameIdentifyCredential(vcId, newName);
        }
        break;
      }
      case 'btn-home-vp-create':
        result = await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'prompt',
            content:
              await SnapViewModels.displayCreateVerifiablePresentationViewModel(),
            placeholder: 'credential1,credential2',
          },
        });

        if (result) {
          let returnVP;
          try {
            returnVP = await SnapVerifiable.createVPFromVCs(result, [
              'snap',
              'googleDrive',
            ]);
          } catch (error) {
            returnVP = await SnapVerifiable.createVPFromVCs(result, ['snap']);
          }

          await snap.request({
            method: 'snap_dialog',
            params: {
              type: 'alert',
              content:
                await SnapViewModels.displayShowVerifiablePresentationViewModel(
                  JSON.stringify(returnVP),
                ),
            },
          });
        }
        break;
      default:
        console.log('no logic for this button');
    }
  }
};
