const vscode = require('vscode');

const { startServer, playTestNote, stopServer } = require('./commands');

let storedContext;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  storedContext = context;

  const logChannel = vscode.window.createOutputChannel('Sonic Pi Studio');
  context.workspaceState.update('logChannel', logChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand('sonic-pi-studio.startServer', () => {
      startServer(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sonic-pi-studio.stopServer', () => {
      stopServer(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sonic-pi-studio.playTestNote', () => {
      playTestNote(context);
    })
  );

  // Add a listener to send the exit message when VSCode is closed
  context.subscriptions.push({
    dispose: () => {
      stopServer(context);
    },
  });
}

function deactivate() {
  // we don't receive the context here, so we need to use the stored one
  stopServer(storedContext);
}

module.exports = {
  activate,
  deactivate,
};
