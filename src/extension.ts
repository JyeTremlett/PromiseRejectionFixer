import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	// This command works by getting a list of locations of '.then' in the current doc, and then
	// iterating through them and checking for rejection handling. If there is no rejection handling,
	// the command will insert handling.
	const disposable = vscode.commands.registerCommand('promiserejectionfixer.fixpromises', () => {

		// Get the active text editor
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No editor found. Failed');
			return;
		}

		// Get document and document text
		const document = editor.document;
		const text = document.getText();

		// Get all instances of '.then' in current window
		const promiseLocations = getPromiseLocations(text, document);
		vscode.window.showInformationMessage(`Found ${promiseLocations?.length} promises`);

		promiseLocations.forEach(promise => {
			console.log(promise);
		});

		// Exit if no matches are found
		if (promiseLocations.length === 0) {
			vscode.window.showInformationMessage('Exiting. No matches.');
			return;
		}

		// Check for validity, and perform appropriate action
		promiseLocations.forEach(promise => {
			if (!checkValidRejectionHandling(promise)) {
				insertValidRejectionHandling(promise);
			}
		});
	});

	context.subscriptions.push(disposable);
}


export function getPromiseLocations(text: string, document: vscode.TextDocument): vscode.Position[] {
	let promiseLocations: vscode.Position[] = [];
	const regex = /\.then/g;
	let regexMatch;

	while ((regexMatch = regex.exec(text)) !== null) {
		promiseLocations.push(document.positionAt(regexMatch.index));
	}

	return promiseLocations;
}


export function checkValidRejectionHandling(promise: vscode.Position): boolean {
	let valid = false;

	return valid;
}


export function insertValidRejectionHandling(promise: vscode.Position) {

}




// This method is called when your extension is deactivated
export function deactivate() { }
