const vscode = require('vscode');

const { startServer, playTestNote, stopServer, keepServerAlive, startFileWatcher, stopFileWatcher } = require('./commands');

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

      // Set up a timer to keep the server alive by pinging it every 5 seconds
      const keepAliveInterval = setInterval(() => {
        keepServerAlive(context);
      }, 5000);

      context.workspaceState.update('keepAliveInterval', keepAliveInterval);

      startFileWatcher(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sonic-pi-studio.stopServer', () => {
      stopServer(context);
      stopFileWatcher(context);
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
      stopFileWatcher(context);
    },
  });
}

function deactivate() {
  // we don't receive the context here, so we need to use the stored one
  const keepAliveInterval = storedContext.workspaceState.get('keepAliveInterval');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }

  stopServer(storedContext);
}

module.exports = {
  activate,
  deactivate,
};
