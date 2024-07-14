import type { ManageStateResult, Panel } from '@metamask/snaps-sdk';
import { panel, text, heading, copyable, divider } from '@metamask/snaps-sdk';

import type { BasicCredential, SnapCredential, VerifiedCredential } from '../snap-types/SnapTypes';

export class SnapViewModels {
  public static helloViewModel(origin: string): Panel {
    return panel([
      text(`Hello, **${origin}**!`),
      text('This is an authflow test message!!'),
      text('Authflow test message, keep those passwords safe!!!!!'),
    ]);
  }

  public static successViewModel(): Panel {
    return panel([heading(`Success`), text(`Password successfully stored!`)]);
  }

  public static failureViewModel(): Panel {
    return panel([heading(`Failure`), text(`Error: No passwords stored!`)]);
  }

  public static searchViewModel(): Panel {
    return panel([
      heading('Search Passwords'),
      text('Please enter the search term'),
    ]);
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
          if(cred.type === 'Basic') {
            const credData = value as BasicCredential;

            returnPanel.push(copyable(cred.description));
            returnPanel.push(copyable(credData.username));
            returnPanel.push(copyable(credData.password));
            returnPanel.push(divider());
          }
        }
      });

      return panel(returnPanel);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.error(`error: ${error.message}`);
      return panel(returnPanel);
    }
  }

  public static async displayVerifiedCredentialsViewModel(
    credentials: ManageStateResult,
  ): Promise<Panel> {
    const returnPanel: any = [heading('Verified Credentials')];

    if (credentials === null) {
      return this.failureViewModel();
    }

    try {
      Object.entries(credentials).forEach(([key, value]) => {
        console.log(`Key: ${key}, Value:`, value);

        if (value !== null) {
          const cred = value as SnapCredential;
          if(cred.type === 'VerifiedCredential') {
            returnPanel.push(copyable(cred.description));
            returnPanel.push(copyable(cred.credentialData as VerifiedCredential));
            returnPanel.push(divider());
          }
        }
      });

      return panel(returnPanel);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.error(`error: ${error.message}`);
      return panel(returnPanel);
    }
  }

  public static async displayUsersViewModel(
    passwords: ManageStateResult,
  ): Promise<Panel> {
    const returnPanel: any = [heading('passwords')];

    if (passwords === null) {
      return this.failureViewModel();
    }

    try {
      Object.entries(passwords).forEach(([key, value]) => {
        console.log(`Key: ${key}, Value:`, value);

        if (value !== null) {
          const creds: string[] = value.toString().split(' ');

          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.log(`user: ${creds[0]}, pw: ${creds[1]}`);
          returnPanel.push(copyable(` credential: ${key}`));
          returnPanel.push(copyable(creds[0]));
          returnPanel.push(divider());
        }
      });

      return panel(returnPanel);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.error(`error: ${error.message}`);
      return panel(returnPanel);
    }
  }
}
