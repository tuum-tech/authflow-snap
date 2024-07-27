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
import { SnapUiInterfaces } from './snap-interfaces/snap-ui-interfaces';
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
    credsRequestParams: CredsRequestParams;

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
        returnedCreds = await SnapState.getBasicCredentialsForDescription(
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
        console.log(`verified cred description: ${credentialDescription}`);
        returnedCreds = await SnapState.getIdentityCredentialForDescription(
          credentialDescription,
        );
        console.log(`verified cred return ${returnedCreds}`);
        return returnedCreds;
      }
      return null;

    case 'createVerifiablePresentation':
      credsRequestParams = request.params as CredsRequestParams;
      credentialDescription = credsRequestParams.credentialDescription;
      console.log(
        `verifiable presentation credential description: ${credentialDescription}`,
      );
      if (credentialDescription !== undefined) {
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: SnapViewModels.createVerifiablePresentationViewModel(
              credentialDescription,
              origin,
            ),
          },
        });

        const returnVP = await SnapVerifiable.createVPFromVCs(
          credentialDescription,
        );
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`return from create VP: ${JSON.stringify(returnVP)}`);

        return returnVP;
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
  let result, tempJSON;

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
          await SnapVerifiable.saveDummyVerifiedCredentials();
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
          console.log(
            `created basic credential: ${JSON.stringify(
              newBasicSnapCredential,
            )}`,
          );
        }
        console.log(`data from enter basic: ${desc} ${user} ${pw}`);
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
            content: await SnapViewModels.displayVerifiableCredentialsViewModel(
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
      case 'btn-home-vc-sample-create':
        result = await SnapVerifiable.seedVerifiableCredentials();
        break;
      case 'btn-home-sync':
        try {
          result = await SnapState.syncCredentials();
        } catch (error: any) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.error(`error : ${error.message}`);
        }
        break;
      case 'btn-home-debug':
        result = await SnapState.outputCredentialsToConsole();
        break;
      case 'btn-home-vc-rename':
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

        if (vcId && newName) {
          await SnapState.renameIdentifyCredential(vcId, newName);
        }
        console.log(`rename cred result ${JSON.stringify(vcId)}`);
        console.log(`rename cred result ${JSON.stringify(newName)}`);
        break;
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
        console.log(
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `return from verified presentation prompt: ${typeof result} ${result}`,
        );
        if (result) {
          const returnVP = await SnapVerifiable.createVPFromVCs(result);
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.log(`return from create VP: ${JSON.stringify(returnVP)}`);

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
