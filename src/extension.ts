// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PipelineTreeView } from './pipelineTreeView';
import { PipelineTreeItem } from './pipelineTreeItem';
import * as ui from './ui';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	ui.logToOutput('Extension activation started');

	let pipelineTreeView:PipelineTreeView = new PipelineTreeView(context);

	vscode.commands.registerCommand('pipelineTreeView.refreshServer', () => {
		pipelineTreeView.refresh();
	});

	vscode.commands.registerCommand('pipelineTreeView.addServer', () => {
		pipelineTreeView.addServer();
	});

	vscode.commands.registerCommand('pipelineTreeView.removeServer', () => {
		pipelineTreeView.removeServer();
	});

	vscode.commands.registerCommand('pipelineTreeView.connectServer', () => {
		pipelineTreeView.connectServer();
	});

	vscode.commands.registerCommand('pipelineTreeView.clearServers', () => {
		pipelineTreeView.clearServers();
	});

	vscode.commands.registerCommand('pipelineTreeView.filter', () => {
		pipelineTreeView.filter();
	});

	vscode.commands.registerCommand('pipelineTreeView.showOnlyActive', () => {
		pipelineTreeView.showOnlyActive();
	});

	vscode.commands.registerCommand('pipelineTreeView.showOnlyFavorite', () => {
		pipelineTreeView.showOnlyFavorite();
	});

	vscode.commands.registerCommand('pipelineTreeView.viewPipelineView', (node: PipelineTreeItem) => {
		pipelineTreeView.viewPipelineView(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.triggerPipeline', (node: PipelineTreeItem) => {
		pipelineTreeView.triggerPipeline(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.triggerPipelineWithConfig', (node: PipelineTreeItem) => {
		pipelineTreeView.triggerPipelineWConfig(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.checkPipelineRunState', (node: PipelineTreeItem) => {
		pipelineTreeView.checkPipelineRunState(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.checkAllPipelinesRunState', (node: PipelineTreeItem) => {
		pipelineTreeView.checkAllPipelinesRunState();
	});

	vscode.commands.registerCommand('pipelineTreeView.pausePipeline', (node: PipelineTreeItem) => {
		pipelineTreeView.pausePipeline(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.unPausePipeline', (node: PipelineTreeItem) => {
		pipelineTreeView.unPausePipeline(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.lastPipelineRunLog', (node: PipelineTreeItem) => {
		pipelineTreeView.lastPipelineRunLog(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.pipelineSourceCode', (node: PipelineTreeItem) => {
		pipelineTreeView.pipelineSourceCode(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.addToFavPipeline', (node: PipelineTreeItem) => {
		pipelineTreeView.addToFavPipeline(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.deleteFromFavPipeline', (node: PipelineTreeItem) => {
		pipelineTreeView.deleteFromFavPipeline(node);
	});

	vscode.commands.registerCommand('pipelineTreeView.showPipelineView', (node: PipelineTreeItem) => {
		pipelineTreeView.viewPipelineView(node);
	});

	ui.logToOutput('Extension activation completed');
}

// this method is called when your extension is deactivated
export function deactivate() {
	ui.logToOutput('Extension is now deactive!');
}
