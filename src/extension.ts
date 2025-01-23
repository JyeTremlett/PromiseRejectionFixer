import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	// This command works by getting a list of positions of '.then' in the current doc, and then
	// iterating through them and checking for rejection handling. If there is no rejection handling,
	// the command will insert handling.
	const disposable = vscode.commands.registerCommand('promiserejectionfixer.fixpromises', () => {

		let linesToHighlight: vscode.Range[] = [];
		const highlightDecoration = vscode.window.createTextEditorDecorationType({
			backgroundColor: 'rgba(200, 247, 197, 0.3)',
			isWholeLine: true
		});

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

		let insertCount = 0;
		editor.edit(editBuilder => {
			
			// Check for validity, and perform appropriate action
			promisePositions.forEach(position => {
				if (!checkValidRejectionHandling(position, document)) {
					const insertPosition = insertRejectionHandling(position, document, editBuilder);
					linesToHighlight.push(new vscode.Range(insertPosition, insertPosition));
					insertCount++;
				}
			});
		});

		// Indicate what lines were edited
		editor.setDecorations(highlightDecoration, linesToHighlight);

		doFinalCheck(text, insertCount);
	});

	context.subscriptions.push(disposable);
}


// Gets array of vscode.Position objects where the string '.then' occurs in the document. These positions are used as indicators of the start of a Promise's definition
export function getPromisePositions(text: string, document: vscode.TextDocument): vscode.Position[] {
	let promisePositions: vscode.Position[] = [];
	const regex = /\.then/g;
	let regexMatch;

	while ((regexMatch = regex.exec(text)) !== null) {
		promisePositions.push(document.positionAt(regexMatch.index));
	}

	return promisePositions;
}


// Checks if the Promise code beginning at startPosition correctly handles rejections. Correctly handled rejections have two potential formats:
// 		Format type 1: The closing bracket for '.then(' is followed by '.catch('
// 		Format type 2: The '.then()' code contains TWO callback functions, the second of which handles rejections
// If either of the two formats are detected, returns true, else returns false 
export function checkValidRejectionHandling(startPosition: vscode.Position, document: vscode.TextDocument): boolean {
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

	// Check for format type 1
	textSelection = text.slice(i, i + 20);
	if (textSelection.includes('.catch(')) {
		return true;
	}

	// Check for format type 2
	textSelection = text.slice(0, i);
	let j = textSelection.indexOf('{') + 1;
	let curlyBracketBalance = 1;

	while (curlyBracketBalance !== 0 && j < text.length) {
		text[j] === '{' ? curlyBracketBalance++ : null;
		text[j] === '}' ? curlyBracketBalance-- : null;
		j++;
	}

	console.log(text[j]);
	if (text[j] === ',') {
		return true;
	}

	// If rejections aren't handled, return false 
	return false;
}


// Insert rejection handling code '.catch(angular.noop)' after the closing bracket for '.then(' clause directly after startPosition
export function insertRejectionHandling(startPosition: vscode.Position, document: vscode.TextDocument, editBuilder: vscode.TextEditorEdit): vscode.Position {
	const text = document.getText(new vscode.Range(startPosition, document.lineAt(document.lineCount - 1).range.end));
	let insertText = '.catch(angular.noop)';

	// Find the closing bracket for '.then('
	let i = '.then('.length;
	let bracketBalance = 1;

	while (bracketBalance !== 0 && i < text.length) {
		text[i] === '(' ? bracketBalance++ : null;
		text[i] === ')' ? bracketBalance-- : null;
		i++;
	}

	// Add a semicolon to insertText if one is not already present
	text[i] !== ';' ? insertText += ';' : null;

	// Insert rejection handling code 
	let insertPosition = document.positionAt(i + document.offsetAt(startPosition));
	editBuilder.insert(insertPosition, insertText);

	return insertPosition;
}


// Does final check by comparing instances of '.then' and '.catch' and alerting the user if there is a discepency
export function doFinalCheck(text: string, insertCount: number) {
	let promiseCount = text.match(/\.then/g)?.length;
	let catchCount = text.match(/\.catch/g)?.length;

	if(promiseCount === undefined || catchCount === undefined) {
		return;
	}

	catchCount = catchCount + insertCount;

	if (promiseCount !== catchCount) {
		vscode.window.showInformationMessage(`WARNING: Found ${promiseCount} promises and ${catchCount} catch clauses.`);
	}
}



// This method is called when your extension is deactivated
export function deactivate() { }
