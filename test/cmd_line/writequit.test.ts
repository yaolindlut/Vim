import * as assert from 'assert';
import * as vscode from 'vscode';

import { getAndUpdateModeHandler } from '../../extension';
import { CommandLine } from '../../src/cmd_line/commandLine';
import { ModeHandler } from '../../src/mode/modeHandler';
import { assertEqual, cleanUpWorkspace, setupWorkspace } from './../testUtils';

async function WaitForVsCodeClose(): Promise<void> {
  // cleanUpWorkspace - testUtils.ts
  let poll = new Promise((c, e) => {
    if (vscode.window.visibleTextEditors.length === 0) {
      return c();
    }

    let pollCount = 0;
    // TODO: the visibleTextEditors variable doesn't seem to be
    // up to date after a onDidChangeActiveTextEditor event, not
    // even using a setTimeout 0... so we MUST poll :(
    let interval = setInterval(() => {
      // if visibleTextEditors is not updated after 1 sec
      // we can expect that 'wq' failed
      if (pollCount <= 100) {
        pollCount++;
        if (vscode.window.visibleTextEditors.length > 0) {
          return;
        }
      }

      clearInterval(interval);
      c();
    }, 10);
  });

  try {
    await poll;
  } catch (error) {
    assert.fail(null, null, error.toString(), '');
  }
}

suite('Basic write-quit', () => {
  let modeHandler: ModeHandler;

  suiteSetup(async () => {
    await setupWorkspace();
    modeHandler = await getAndUpdateModeHandler();
  });

  suiteTeardown(cleanUpWorkspace);

  test('Run write and quit', async () => {
    await modeHandler.handleMultipleKeyEvents(['i', 'a', 'b', 'a', '<Esc>']);

    await CommandLine.Run('wq', modeHandler.vimState);
    await WaitForVsCodeClose();

    assertEqual(vscode.window.visibleTextEditors.length, 0, 'Window after 1sec still open');
  });
});
