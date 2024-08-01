const vscode = require('vscode');
const { getSonicPiPath } = require('./utils');
const { spawn } = require('child_process');
const OSC = require('node-osc');

// Function to start the Sonic Pi daemon and capture output
function startServer(context) {
  try {
    const logChannel = context.workspaceState.get('logChannel');

    const path = getSonicPiPath();

    if (!path) {
      vscode.window.showErrorMessage('Sonic Pi path is not set. Please set it in the extension settings.');
      return;
    }

    const daemonPath = `${path}/app/server/ruby/bin/daemon.rb`;

    logChannel.appendLine('Starting Sonic Pi server.');

    const serverProcess = spawn('ruby', [daemonPath]);

    let outputBuffer = '';
    const outputChannel = vscode.window.createOutputChannel('Sonic Pi Server');
    outputChannel.show();

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputChannel.append(output);

      outputBuffer += output;

      // Process the output buffer when it gets enough data
      const lines = outputBuffer.trim().split('\n');
      if (lines.length >= 1) {
        const values = lines[0].trim().split(' ').map(Number);

        if (values.length >= 8) {
          const ports = {
            daemon: values[0], // daemon - UDP port Daemon is listening on. This is used for receiving /daemon/keep-alive OSC messages amongst other things.
            guiListenToServer: values[1], // gui-listen-to-server - UDP port which the GUI uses to listen to messages from the Spider Server.
            guiSendToServer: values[2], // gui-send-to-server - UDP port which the GUI uses to send messages to the Spider Server.
            scsynth: values[3], // scsynth - UDP port on which scsynth listens (necessary for connecting to the boost shared memory for scope data)
            oscCues: values[4], // osc-cues - UDP port used to receive OSC cue messages from external processes.
            tauApi: values[5], // tau-api - UDP port used to send OSC messages to trigger the Tau API
            tauPhx: values[6], // tau-phx - HTTP port used by Tau's Phoenix web server
            token: values[7], // token - 32 bit signed integer used as a token to authenticate OSC messages.  All OSC messages sent from the GUI must include this token as the first argument
          };

          // Store the values in the extension's context for the current session
          context.workspaceState.update('sonicPiPorts', ports);

          // Create and store the OSC client
          const oscServerClient = new OSC.Client('localhost', ports.guiSendToServer);
          context.workspaceState.update('oscServerClient', oscServerClient);

          const oscDaemonClient = new OSC.Client('localhost', ports.daemon);
          context.workspaceState.update('oscDaemonClient', oscDaemonClient);

          logChannel.appendLine('OSC clients created.');

          vscode.window.showInformationMessage('Sonic Pi server started.');
          logChannel.appendLine('Sonic Pi server started.');

          // We no longer need to process more data, remove the listener
          serverProcess.stdout.removeAllListeners('data');
        } else {
          logChannel.appendLine('Unexpected output format from daemon. Please check the daemon log.');
        }
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      outputChannel.append(errorOutput);
      vscode.window.showErrorMessage(`Daemon stderr: ${errorOutput}.`);
    });

    serverProcess.on('error', (error) => {
      vscode.window.showErrorMessage(`Error running daemon: ${error.message}.`);
    });

    serverProcess.on('exit', (code) => {
      vscode.window.showErrorMessage(`Sonic Pi server exited with code ${code}.`);
      logChannel.appendLine(`Sonic Pi server exited with code ${code}.`);
    });
  } catch (error) {
    const logChannel = context.workspaceState.get('logChannel');
    vscode.window.showErrorMessage(`Failed to start Sonic Pi server: ${error.message}.`);
    logChannel.appendLine(`Error: ${error.stack}.`);
  }
}

function playTestNote(context) {
  const oscServerClient = context.workspaceState.get('oscServerClient');
  const ports = context.workspaceState.get('sonicPiPorts');

  if (!oscServerClient || !ports) {
    vscode.window.showErrorMessage('OSC client or Sonic Pi ports are not initialized. Please start the server first.');
    return;
  }

  const token = ports.token;

  // Send the OSC message to play a test note
  oscServerClient.send('/run-code', token, 'play 72');
}

function stopServer(context) {
  const ports = context.workspaceState.get('sonicPiPorts');
  const oscServerClient = context.workspaceState.get('oscServerClient');
  const oscDaemonClient = context.workspaceState.get('oscDaemonClient');

  if (!ports || !oscDaemonClient || !oscServerClient) {
    vscode.window.showErrorMessage('Sonic Pi ports are not set or OSC clients are not initialized. Please start the server first.');
    return;
  }

  const token = ports.token;

  // Send the OSC exit message
  oscDaemonClient.send('/daemon/exit', token, () => {
    const logChannel = context.workspaceState.get('logChannel');
    logChannel.appendLine('Exit message sent to server.');

    // Close the OSC clients after the message is sent
    oscServerClient.close();
    oscDaemonClient.close();

    logChannel.appendLine('OSC clients closed.');
  });
}

module.exports = {
  startServer,
  stopServer,
  playTestNote,
};
