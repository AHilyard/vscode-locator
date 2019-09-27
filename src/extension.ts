/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/


import * as vscode from 'vscode';

let locatorStatusBarItem: vscode.StatusBarItem;
let locatorInputItem: vscode.QuickInput;//<vscode.QuickPickItem>;

let context: vscode.ExtensionContext;

export function activate(extensionContext: vscode.ExtensionContext) {

	context = extensionContext;

	// register a command that is invoked when the status bar
	// item is selected
	const myCommandId = 'locator.showLocator';
	context.subscriptions.push(vscode.commands.registerCommand(myCommandId, () => {
		if (locatorInputItem)
		{
			locatorInputItem.dispose();
		}
		let locatorQuickPick = vscode.window.createQuickPick();
		// register some listener that make sure the status bar 
		// item always up-to-date
		context.subscriptions.push(locatorQuickPick.onDidChangeValue(pickLocatorMode));
		context.subscriptions.push(locatorQuickPick.onDidChangeSelection(clickLocatorMode));

		locatorQuickPick.placeholder = "Type to locate...";
		locatorQuickPick.items = [['p', '		Search files in workspace..a '],
								  ['m', '		Search symbol in workspace..a '],
								  ['.', '		Search symbol in document..a '],
								  ['l', '		Go to line in document..a '],
								  ['r', '		Perform web search..a ']].map(pair => ({ label: pair[0], description: pair[1] }));

		//locatorQuickPick.onDidHide(locatorQuickPick.dispose);
		locatorInputItem = locatorQuickPick;
		locatorInputItem.show();
	}));

	// create a new status bar item that we can now manage
	locatorStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, Number.MAX_SAFE_INTEGER);
	locatorStatusBarItem.command = myCommandId;
	locatorStatusBarItem.text = `$(search)`;
	locatorStatusBarItem.tooltip = "Click to locate";
	locatorStatusBarItem.show();
	context.subscriptions.push(locatorStatusBarItem);
}

async function selectedItem(selected: vscode.QuickPickItem[]): Promise<void>
{
	if (selected[0].detail)
	{
		await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(selected[0].detail));
		locatorInputItem.dispose();
	}
}

async function acceptedWebSearch(): Promise<void>
{
	if ((locatorInputItem as vscode.InputBox).value.length > 0)
	{
		let google = vscode.Uri.parse("https://google.com/search");
		google = google.with({query: "q=" + (locatorInputItem as vscode.InputBox).value});
		vscode.env.openExternal(google);
	}
}

async function clickLocatorMode(selection: vscode.QuickPickItem[]): Promise<void>
{
	if (selection[0])
	{
		pickLocatorMode(selection[0].label);
	}
}

async function pickLocatorMode(filter: string): Promise<void>
{
	if (filter.length > 0)
	{
		let prefix:string = filter.substr(0, 1);

		switch (prefix)
		{
			case 'p':
				// Search for files in project.
				// First get a list of all files in the project and make them quickpick items...
				// Then reconstruct the quickpick with those items.
				if (locatorInputItem)
				{
					locatorInputItem.dispose();
				}

				// Set search.quickOpen.includeHistory to false...
				// then display the quick open dialogue...
				// the set the setting back to whatever it was.

				let config = vscode.workspace.getConfiguration();
				let includeHistory = config.get('search.quickOpen.includeHistory');
				config.update('search.quickOpen.includeHistory', false);
				vscode.commands.executeCommand("workbench.action.quickOpen").then(function() {
					config.update('search.quickOpen.includeHistory', includeHistory);
				});
				break;

			case 'm':
				if (locatorInputItem)
				{
					locatorInputItem.dispose();
				}
				await vscode.commands.executeCommand("workbench.action.showAllSymbols");
				break;
			case '.':
				if (locatorInputItem)
				{
					locatorInputItem.dispose();
				}
				await vscode.commands.executeCommand("workbench.action.gotoSymbol");
				break;
			case 'l':
				// Go to line in current file.
				if (locatorInputItem)
				{
					locatorInputItem.dispose();
				}
				await vscode.commands.executeCommand("workbench.action.gotoLine");
				break;
			case 'r':
				if (locatorInputItem)
				{
					locatorInputItem.dispose();
				}
				let locatorWebSearch = vscode.window.createInputBox();
				context.subscriptions.push(locatorWebSearch.onDidAccept(acceptedWebSearch));
				locatorWebSearch.placeholder = "Search Google...";
				locatorWebSearch.onDidHide(locatorWebSearch.dispose);
				locatorInputItem = locatorWebSearch;
				locatorInputItem.show();
				break;
		}
	}

}