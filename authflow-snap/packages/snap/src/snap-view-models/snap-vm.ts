import type { Panel } from '@metamask/snaps-sdk';
import { panel, text } from '@metamask/snaps-sdk';

export class SnapViewModels {
  public static helloViewModel(origin: string): Panel {
    return panel([
      text(`Hello, **${origin}**!`),
      text('This is an authflow test message!!'),
      text('Authflow test message, keep those passwords safe!!!!!'),
    ]);
  }
}
