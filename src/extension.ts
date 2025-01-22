import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	// This command works by getting a list of positions of '.then' in the current doc, and then
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
		const promisePositions = getPromisePositions(text, document);
		vscode.window.showInformationMessage(`Found ${promisePositions?.length} promises`);

		// Exit if no matches are found
		if (promisePositions.length === 0) {
			vscode.window.showInformationMessage('Exiting. No matches.');
			return;
		}

		// Check for validity, and perform appropriate action
		promisePositions.forEach(promise => {
			if (!checkValidRejectionHandling(promise, document)) {
				insertValidRejectionHandling(promise);
			}
		});
	});

	context.subscriptions.push(disposable);
}


export function getPromisePositions(text: string, document: vscode.TextDocument): vscode.Position[] {
	let promisePositions: vscode.Position[] = [];
	const regex = /\.then/g;
	let regexMatch;

	while ((regexMatch = regex.exec(text)) !== null) {
		promisePositions.push(document.positionAt(regexMatch.index));
	}

	return promisePositions;
}


export function checkValidRejectionHandling(startPosition: vscode.Position, document: vscode.TextDocument): boolean {
	let valid = false;
	let textSelection = '';
	const text = document.getText(new vscode.Range(startPosition, document.lineAt(document.lineCount - 1).range.end));

	// Start loop after first open bracket
	let i = '.then('.length;
	let bracketBalance = 1;

	// Select the block of text to analyse
	while (bracketBalance !== 0 && i < text.length) {
		text[i] === '(' ? bracketBalance++ : null;
		text[i] === ')' ? bracketBalance-- : null;
		i++;
	}

	// Check if text provides rejection handling using '.catch()'
	textSelection = text.slice(i, i + 20);
	if (textSelection.includes('.catch(')) {
		return true;
	}

	// Check if text provides rejection handling by supplying a callback function
	textSelection = text.slice(0, i);
	let j = textSelection.indexOf('{') + 1;
	let curlyBracketBalance = 1;

	while (curlyBracketBalance !== 0 && j < text.length) {
		text[j] === '{' ? curlyBracketBalance++ : null;
		text[j] === '}' ? curlyBracketBalance-- : null;
		j++;
	}

	textSelection = text.slice(i, i + 20);
	if (textSelection.includes(', function')) {
		return true;
	}

	return valid;
}


export function insertValidRejectionHandling(promise: vscode.Position) {

}


export function getCharAtPosition(position: vscode.Position, document: vscode.TextDocument): string {
	return document.getText(new vscode.Range(position, position.translate(0, 1)));
}

// This method is called when your extension is deactivated
export function deactivate() { }
