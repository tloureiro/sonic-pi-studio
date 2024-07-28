const vscode = require('vscode');

function helloWorld() {
  vscode.window.showInformationMessage('Hello World from Sonic Pi Studios!');
}

module.exports = {
  helloWorld
}