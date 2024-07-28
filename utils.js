const vscode = require('vscode');

function getSonicPiPath() {
  const config = vscode.workspace.getConfiguration('sonicPi');
  return config.get('path', '');
}

module.exports = {
  getSonicPiPath
}