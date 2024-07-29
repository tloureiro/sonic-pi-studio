const path = require('path');
const os = require('os');

const vscode = require('vscode');

// Function to get the Sonic Pi path from configuration
function getSonicPiPath() {
  const config = vscode.workspace.getConfiguration('sonicPi');
  let sonicPiPath = config.get('path', '');

  // Resolve tilde to home directory
  if (sonicPiPath.startsWith('~')) {
      sonicPiPath = path.join(os.homedir(), sonicPiPath.slice(1));
  }

  return sonicPiPath;
}

module.exports = {
  getSonicPiPath
}