const vscode = require('vscode');

const { helloWorld } = require('./commands');


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sonic-pi-studio" is now active!');

	const disposable = vscode.commands.registerCommand('sonic-pi-studio.helloWorld', helloWorld);

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
