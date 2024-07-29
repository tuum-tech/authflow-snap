import type { ManageStateResult, Panel } from '@metamask/snaps-sdk';
import {
  panel,
  text,
  heading,
  copyable,
  divider,
  input,
} from '@metamask/snaps-sdk';

import { SnapVerifiable } from '../snap-classes/SnapVerifiable';
import type {
  BasicCredential,
  IdentifyCredential,
  SnapCredential,
} from '../snap-types/SnapTypes';

export class SnapViewModels {
  public static helloViewModel(origin: string): Panel {
    return panel([
      text(`Hello, **${origin}**!`),
      text('This is an authflow test message!!'),
      text('Authflow test message, keep those passwords safe!!!!!'),
    ]);
  }

  public static failureViewModel(): Panel {
    return panel([heading(`Failure`), text(`Error: No credentials stored!`)]);
  }

  public static clearAllViewModel(): Panel {
    return panel([
      heading('Clear all passwords?'),
      text('Are you sure you want to clear all passwords?'),
    ]);
  }

  public static clearAllVCViewModel(): Panel {
    return panel([
      heading('Clear all verified credentials?'),
      text('Are you sure you want to clear all verified credentials?'),
    ]);
  }

  public static retrieveBasicCredsViewModel(
    description: string,
    site: string,
  ): Panel {
    return panel([
      heading(`Send login for ${description}`),
      text(
        `Are you sure you want to send the login for ${description} to ${site}?`,
      ),
    ]);
  }

  public static retrieveVerifiableCredsViewModel(
    description: string,
    site: string,
  ): Panel {
    return panel([
      heading(`Send verifiable credential for ${description}`),
      text(
        `Are you sure you want to send the verifiable credential for ${description} to ${site}?`,
      ),
    ]);
  }

  public static createVerifiablePresentationViewModel(
    description: string,
    site: string,
  ): Panel {
    return panel([
      heading(
        `Create verifiable presentation for verifiable credential(s) ${description}`,
      ),
      text(
        `Are you sure you want to create a verifiable presentation for ${description} and send to ${site}?`,
      ),
    ]);
  }

  public static async displayBasicCredentialsViewModel(
    credentials: ManageStateResult,
  ): Promise<Panel> {
    const returnPanel: any = [heading('Basic Credentials')];

    if (credentials === null) {
      return this.failureViewModel();
    }

    try {
      Object.entries(credentials).forEach(([key, value]) => {
        console.log(`Key: ${key}, Value:`, value);

        if (value !== null) {
          const cred = value as SnapCredential;
          if (cred.type === 'Basic') {
            const credData = cred.credentialData as BasicCredential;

            returnPanel.push(copyable(cred.description));
            returnPanel.push(copyable(credData.username));
            returnPanel.push(copyable(credData.password));
            returnPanel.push(divider());
          }
        }
      });

      return panel(returnPanel);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error(`Error in getVerifiableCredentials: ${errorMessage}`);
      return this.failureViewModel();
    }
  }

  public static async displayVerifiableCredentialsViewModel(
    credentials: ManageStateResult,
  ): Promise<Panel> {
    const returnPanel: any = [heading('Verifiable Credentials')];

    if (credentials === null) {
      return this.failureViewModel();
    }

    let identifyCredentials;
    try {
      identifyCredentials = await SnapVerifiable.getVerifiableCredentials([
        'snap',
        'googleDrive',
      ]);
    } catch (error:unknown) {
      identifyCredentials = await SnapVerifiable.getVerifiableCredentials([
        'snap',
      ]);
    }

    if(identifyCredentials) {

      const identifyCredValues: any[] = JSON.parse(identifyCredentials);
      const identifyCredTable: Record<string, any> = {};
      identifyCredValues.forEach((item) => {
        identifyCredTable[item.metadata.id] = item.data;
      });

      try {
        Object.entries(credentials).forEach(([key, value]) => {
          if (value !== null) {
            const cred = value as SnapCredential;
            if (cred.type === 'Identify') {
              const credId = (cred.credentialData as IdentifyCredential).id;
              returnPanel.push(copyable(cred.description));
              returnPanel.push(copyable(credId));
              returnPanel.push(
                copyable(JSON.stringify(identifyCredTable[credId])),
              );
              returnPanel.push(divider());
            }
          }
        });

        return panel(returnPanel);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error(`Error in getVerifiableCredentials: ${errorMessage}`);
        return panel(returnPanel);
      }
    }

    return this.failureViewModel();
  }

  public static async displayRenameVerifiableCredentialViewModel(): Promise<Panel> {
    const returnPanel: any = [heading('Rename Verifiable Credential')];

    returnPanel.push(text('Enter name'));

    return panel(returnPanel);
  }

  public static async displayCreateVerifiablePresentationViewModel(): Promise<Panel> {
    const returnPanel: any = [heading('Create Verifiable Presentation')];

    returnPanel.push(text('Enter a comma separated list of credential names'));

    return panel(returnPanel);
  }

  public static async displayShowVerifiablePresentationViewModel(
    json: string,
  ): Promise<Panel> {
    const returnPanel: any = [heading(`Verifiable Presentation`)];

    returnPanel.push(text('Generated Verifiable Presentation:'));
    returnPanel.push(copyable(json));

    return panel(returnPanel);
  }

  public static async displayEnterBasicDescriptionViewModel(): Promise<Panel> {
    const returnPanel: any = [heading('Basic Credential')];

    returnPanel.push(text('Enter basic credential description'));

    return panel(returnPanel);
  }

  public static async displayEnterBasicUserViewModel(): Promise<Panel> {
    const returnPanel: any = [heading('Basic Credential')];

    returnPanel.push(text('Enter basic credential user'));

    return panel(returnPanel);
  }

  public static async displayEnterBasicPasswordViewModel(): Promise<Panel> {
    const returnPanel: any = [heading('Basic Credential')];

    returnPanel.push(text('Enter basic credential password'));

    return panel(returnPanel);
  }
}
