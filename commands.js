const vscode = require('vscode');
const { getSonicPiPath } = require('./utils');
const { spawn } = require('child_process');
const osc = require('osc');


function helloWorld() {
  vscode.window.showInformationMessage('Hello World from Sonic Pi Studios!');
}

// Function to start the Sonic Pi daemon and capture output
function startServer(context) {
  const path = getSonicPiPath();
  if (!path) {
      vscode.window.showErrorMessage('Sonic Pi path is not set. Please set it in the extension settings.');
      return;
  }

  const daemonPath = `${path}/app/server/ruby/bin/daemon.rb`; 

  const serverProcess = spawn('ruby', [daemonPath]);

  let outputBuffer = '';
  const outputChannel = vscode.window.createOutputChannel('Sonic Pi Daemon');
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
                  daemon: values[0],
                  guiListenToServer: values[1],
                  guiSendToServer: values[2],
                  scsynth: values[3],
                  oscCues: values[4],
                  tauApi: values[5],
                  tauPhx: values[6],
                  token: values[7]
              };

              // Store the values in the extension's context for the current session
              context.workspaceState.update('sonicPiPorts', ports);
              vscode.window.showInformationMessage('Sonic Pi daemon started and ports captured.');

              // Create and store the UDP sender
              const udpPort = new osc.UDPPort({
                localAddress: "0.0.0.0",
                localPort: 57121,
                remoteAddress: "127.0.0.1",
                remotePort: ports.guiSendToServer
              });

              udpPort.open();
              context.workspaceState.update('udpPort', udpPort);

              // We no longer need to process more data, remove the listener
              serverProcess.stdout.removeAllListeners('data');
          } else {
              vscode.window.showErrorMessage('Unexpected output format from daemon. Please check the daemon log.');
          }
      }
  });

  serverProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      outputChannel.append(errorOutput);
      vscode.window.showErrorMessage(`Daemon stderr: ${errorOutput}`);
  });

  serverProcess.on('error', (error) => {
      vscode.window.showErrorMessage(`Error running daemon: ${error.message}`);
  });

  serverProcess.on('exit', (code) => {
    vscode.window.showErrorMessage(`Daemon exited with code ${code}`);
  });

  // Optional: handle process termination on extension deactivation
  context.subscriptions.push({
      dispose: () => {
          serverProcess.kill();
      }
  });
}

function playTestNote() {

}

module.exports = {
  helloWorld,
  startServer
}