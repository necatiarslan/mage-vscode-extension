/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { PipelineView } from './pipelineView';
import { PipelineTreeItem } from './pipelineTreeItem';
import { PipelineTreeDataProvider } from './pipelineTreeDataProvider';
import * as ui from './ui';
import { Api } from './api';
import { urlToHttpOptions } from 'url';

export class PipelineTreeView {

	public static Current: PipelineTreeView | undefined;
	public view: vscode.TreeView<PipelineTreeItem>;
	public treeDataProvider: PipelineTreeDataProvider;
	public pipelinelistResponse: any;
	public context: vscode.ExtensionContext;
	public filterString: string = '';
	public pipelineStatusInterval: NodeJS.Timer;
	public ShowOnlyActive: boolean = true;
	public ShowOnlyFavorite: boolean = false;
	public ImportErrorsJson: any;

	public ServerList: {}[] = [];

	constructor(context: vscode.ExtensionContext) {
		ui.logToOutput('PipelineTreeView.constructor Started');
		this.context = context;
		this.loadState();
		this.treeDataProvider = new PipelineTreeDataProvider();
		this.view = vscode.window.createTreeView('pipelineTreeView', { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
		this.refresh();
		context.subscriptions.push(this.view);
		PipelineTreeView.Current = this;
		this.setFilterMessage();
	}

	refresh(): void {
		ui.logToOutput('PipelineTreeView.refresh Started');

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Window,
			title: "Mage: Loading...",
		}, (progress, token) => {
			progress.report({ increment: 0 });

			this.loadPipelines();

			return new Promise<void>(resolve => { resolve(); });
		});

		this.getImportErrors();
	}

	resetView(): void {
		ui.logToOutput('PipelineTreeView.resetView Started');
		Api.apiUrl = '';
		Api.apiUserName = '';
		Api.apiPassword = '';
		this.filterString = '';

		this.pipelinelistResponse = undefined;
		this.treeDataProvider.pipelinelistResponse = this.pipelinelistResponse;
		this.treeDataProvider.refresh();
		this.setViewTitle();

		this.saveState();
		this.refresh();
	}

	viewPipelineView(node: PipelineTreeItem): void {
		ui.logToOutput('PipelineTreeView.viewPipelineView Started');
		PipelineView.render(this.context.extensionUri, node.PipelineId);
	}

	async addToFavPipeline(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.addToFavPipeline Started');
		node.IsFav = true;
	}

	async deleteFromFavPipeline(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.deleteFromFavPipeline Started');
		node.IsFav = false;
	}

	async triggerPipeline(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.triggerPipeline Started');
		if(!Api.isApiParamsSet()) { return; }

		if (node.IsPaused) {
			ui.showWarningMessage('Pipeline is PAUSED !!!');
			return;
		}

		if (node.isPipelineRunning()) {
			ui.showWarningMessage('Pipeline is ALREADY RUNNING !!!');
			return;
		}

		let result = await Api.triggerPipeline(node.PipelineId);

		if(result.isSuccessful)
		{
			var responseTrigger = result.result;
			node.LatestPipelineRunId = responseTrigger['pipeline_run_id'];
			node.LatestPipelineState = responseTrigger['state'];
			node.refreshUI();
			this.treeDataProvider.refresh();
			if (this.pipelineStatusInterval) {
				this.pipelineStatusInterval.refresh();
			}
			else {
				this.pipelineStatusInterval = setInterval(this.refreshRunningPipelineState, 10 * 1000, this);
			}
		}
	}

	async refreshRunningPipelineState(pipelineTreeView: PipelineTreeView) {
		ui.logToOutput('PipelineTreeView.refreshRunningPipelineState Started');
		if(!Api.isApiParamsSet()) { return; }

		let noPipelineIsRunning: boolean = true;
		for (var node of pipelineTreeView.treeDataProvider.visiblePipelineList) {
			//"queued" "running" "success" "failed"
			if (node.isPipelineRunning()) {
				noPipelineIsRunning = false;

				let result = await Api.getPipelineRun(node.PipelineId, node.LatestPipelineRunId);

				if(result.isSuccessful)
				{
					node.LatestPipelineState = result.result['state'];
					node.refreshUI();
				}
				else
				{
					node.LatestPipelineRunId = '';
					node.LatestPipelineState = '';
				}

			}
			pipelineTreeView.treeDataProvider.refresh();
		}
		if (noPipelineIsRunning && pipelineTreeView.pipelineStatusInterval) {
			clearInterval(pipelineTreeView.pipelineStatusInterval);
			ui.showInfoMessage('All Pipeline Run(s) Completed');
			ui.logToOutput('All Pipeline Run(s) Completed');
		}
	}

	async triggerPipelineWConfig(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.triggerPipelineWConfig Started');
		if(!Api.isApiParamsSet()) { return; }

		let triggerPipelineConfig = await vscode.window.showInputBox({ placeHolder: 'Enter Configuration JSON (Optional, must be a dict object) or Press Enter' });

		if (!triggerPipelineConfig) {
			triggerPipelineConfig = "{}";
		}

		if (triggerPipelineConfig !== undefined) {
			
			let result = await Api.triggerPipeline(node.PipelineId, triggerPipelineConfig);
		
			if(result.isSuccessful)
			{
				var responseTrigger = result.result;
				node.LatestPipelineRunId = responseTrigger['pipeline_run_id'];
				node.LatestPipelineState = responseTrigger['state'];
				node.refreshUI();
				this.treeDataProvider.refresh();
				if (this.pipelineStatusInterval) {
					this.pipelineStatusInterval.refresh();
				}
				else {
					this.pipelineStatusInterval = setInterval(this.refreshRunningPipelineState, 10 * 1000, this);
				}
			}

		}
	}

	async checkAllPipelinesRunState() {
		ui.logToOutput('PipelineTreeView.checkAllPipelinesRunState Started');
		if (!this.treeDataProvider) { return; }
		for (var node of this.treeDataProvider.visiblePipelineList) {
			if (!node.IsPaused) {
				this.checkPipelineRunState(node);
			}
		}
	}

	public async notifyPipelineStateWithPipelineId(pipelineId: string){
		ui.logToOutput('PipelineTreeView.checPipelineStateWitPipelineId Started');
		if (!this.treeDataProvider) { return; }
		for (var node of this.treeDataProvider.visiblePipelineList) {
			if (node.PipelineId === pipelineId) {
				this.checkPipelineRunState(node);
			}
		}
	}

	async checkPipelineRunState(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.checkPipelineRunState Started');
		if(!Api.isApiParamsSet()) { return; }

		if (!node) { return; }
		if (!this.treeDataProvider) { return; }
		if (node.IsPaused) { ui.showWarningMessage(node.PipelineId + 'Pipeline is PAUSED'); return; }

		let result = await Api.getLastPipelineRun(node.PipelineId);
		if (result.isSuccessful)
		{
			node.LatestPipelineRunId = result.result.pipeline_run_id;
			node.LatestPipelineState = result.result.state;
			node.refreshUI();
			this.treeDataProvider.refresh();

			if (node.isPipelineRunning) {
				if (this.pipelineStatusInterval) {
					this.pipelineStatusInterval.refresh();
				}
				else {
					this.pipelineStatusInterval = setInterval(this.refreshRunningPipelineState, 10 * 1000, this);
				}
			}
		}

	}

	async pausePipeline(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.pausePipeline Started');
		if(!Api.isApiParamsSet()) { return; }

		if (node.IsPaused) { ui.showWarningMessage(node.PipelineId + 'Pipeline is already PAUSED'); return; }

		//let userAnswer = await vscode.window.showInputBox({ placeHolder: node.pipelineId + ' Pipeline will be PAUSED. Yes/No ?' });
		//if (userAnswer !== 'Yes') { return; }

		let result = await Api.pausePipeline(node.PipelineId, true);
		if(result.isSuccessful)
		{
			node.IsPaused = true;
			node.refreshUI();
			this.treeDataProvider.refresh();
		}

	}

	public async notifyPipelinePaused(pipelineId: string){
		ui.logToOutput('PipelineTreeView.notifyPipelinePaused Started');
		if (!this.treeDataProvider) { return; }
		for (var node of this.treeDataProvider.visiblePipelineList) {
			if (node.PipelineId === pipelineId) {
				node.IsPaused = true;
				node.refreshUI();
				this.treeDataProvider.refresh();
			}
		}
	}

	public async notifyPipelineUnPaused(pipelineId: string){
		ui.logToOutput('PipelineTreeView.notifyPipelinePaused Started');
		if (!this.treeDataProvider) { return; }
		for (var node of this.treeDataProvider.visiblePipelineList) {
			if (node.PipelineId === pipelineId) {
				node.IsPaused = false;
				node.refreshUI();
				this.treeDataProvider.refresh();
			}
		}
	}

	async unPausePipeline(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.unPausePipeline Started');
		if(!Api.isApiParamsSet()) { return; }

		if (!node.IsPaused) { ui.showInfoMessage(node.PipelineId + 'Pipeline is already UNPAUSED'); return; }

		//let userAnswer = await vscode.window.showInputBox({ placeHolder: node.pipelineId + ' Pipeline will be UNPAUSED. Yes/No ?' });
		//if (userAnswer !== 'Yes') { return; }

		let result = await Api.pausePipeline(node.PipelineId, false);
		if(result.isSuccessful)
		{
			node.IsPaused = false;
			node.refreshUI();
			this.treeDataProvider.refresh();
		}
	}

	async lastPipelineRunLog(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.lastPipelineRunLog Started');
		if(!Api.isApiParamsSet()) { return; }

		let result = await Api.getLastPipelineRunLog(node.PipelineId);
		if(result.isSuccessful)
		{
			const tmp = require('tmp');
			var fs = require('fs');
			const tmpFile = tmp.fileSync({ mode: 0o644, prefix: node.PipelineId, postfix: '.log' });
			fs.appendFileSync(tmpFile.name, result.result);
			ui.openFile(tmpFile.name);
		}
	}

	async pipelineSourceCode(node: PipelineTreeItem) {
		ui.logToOutput('PipelineTreeView.pipelineSourceCode Started');
		if(!Api.isApiParamsSet()) { return; }

		let result = await Api.getSourceCode(node.PipelineId, node.FileToken);
		if(result.isSuccessful)
		{
			const tmp = require('tmp');
			var fs = require('fs');

			const tmpFile = tmp.fileSync({ mode: 0o644, prefix: node.PipelineId, postfix: '.py' });
			fs.appendFileSync(tmpFile.name, result.result);
			ui.openFile(tmpFile.name);
		}
		else
		{

		}

	}

	async filter() {
		ui.logToOutput('PipelineTreeView.filter Started');
		let filterStringTemp = await vscode.window.showInputBox({ value: this.filterString, placeHolder: 'Enter your filters seperated by comma' });

		if (filterStringTemp === undefined) { return; }

		this.filterString = filterStringTemp;
		this.treeDataProvider.refresh();
		this.setFilterMessage();
		this.saveState();
	}

	async showOnlyActive() {
		ui.logToOutput('PipelineTreeView.showOnlyActive Started');
		this.ShowOnlyActive = !this.ShowOnlyActive;
		this.treeDataProvider.refresh();
		this.setFilterMessage();
		this.saveState();
	}

	async showOnlyFavorite() {
		ui.logToOutput('PipelineTreeView.showOnlyFavorite Started');
		this.ShowOnlyFavorite = !this.ShowOnlyFavorite;
		this.treeDataProvider.refresh();
		this.setFilterMessage();
		this.saveState();
	}

	async addServer() {
		ui.logToOutput('PipelineTreeView.addServer Started');

		let apiUrlTemp = await vscode.window.showInputBox({ value: 'http://localhost:8080/api/v1',  placeHolder: 'API Full URL (Exp:http://localhost:8080/api/v1)' });
		if (!apiUrlTemp) { return; }

		let userNameTemp = await vscode.window.showInputBox({ placeHolder: 'User Name' });
		if (!userNameTemp) { return; }

		let passwordTemp = await vscode.window.showInputBox({ placeHolder: 'Password' });
		if (!passwordTemp) { return; }

		this.ServerList.push({ "apiUrl": apiUrlTemp, "apiUserName":userNameTemp, "apiPassword": passwordTemp});


		Api.apiUrl = apiUrlTemp;
		Api.apiUserName = userNameTemp;
		Api.apiPassword = passwordTemp;

		this.saveState();
		this.refresh();
	}

	async removeServer() {
		ui.logToOutput('PipelineTreeView.removeServer Started');
		if(this.ServerList.length === 0) { return; }

		var items: string[] = [];
		for(var s of this.ServerList)
		{
			items.push(s["apiUrl"]+ " - " + s["apiUserName"]);
		}

		let selected = await vscode.window.showQuickPick(items, {canPickMany:false, placeHolder: 'Select To Remove'});
		let selectedItems = selected.split(" - ");

		if(selectedItems[0])
		{
			this.ServerList = this.ServerList.filter(item => !(item["apiUrl"] === selectedItems[0] && item["apiUserName"] === selectedItems[1]));
			this.saveState();
			ui.showInfoMessage("Server removed, you can remain working on it or connect a new one.");
		}

	}

	async connectServer() {
		ui.logToOutput('PipelineTreeView.connectServer Started');

		if(this.ServerList.length === 0)
		{
			this.addServer();
			return;
		}

		var items: string[] = [];
		for(var s of this.ServerList)
		{
			items.push(s["apiUrl"] + " - " + s["apiUserName"]);
		}

		let selected = await vscode.window.showQuickPick(items, {canPickMany:false, placeHolder: 'Select To Connect'});
		let selectedItems = selected.split(" - ");


		if(selectedItems[0])
		{
			var item = this.ServerList.find(item => item["apiUrl"] === selectedItems[0] && item["apiUserName"] === selectedItems[1]);

			Api.apiUrl = selectedItems[0];
			Api.apiUserName = item["apiUserName"];
			Api.apiPassword = item["apiPassword"];
	
			this.saveState();
			this.refresh();
		}
	}

	async clearServers() {
		ui.logToOutput('PipelineTreeView.clearServers Started');

		this.ServerList = [];

		this.saveState();
		ui.showInfoMessage("Server List Cleared");
	}

	async loadPipelines() {
		ui.logToOutput('PipelineTreeView.loadPipelines Started');
		if(!Api.isApiParamsSet()) { return; }

		this.pipelinelistResponse = undefined;
		this.treeDataProvider.pipelinelistResponse = this.pipelinelistResponse;

		let result = await Api.getPipelineList();
		if(result.isSuccessful)
		{
			this.pipelinelistResponse = result.result;
			this.treeDataProvider.pipelinelistResponse = this.pipelinelistResponse;
			this.treeDataProvider.loadPipelineTreeItemsFromApiResponse();
		}
		this.treeDataProvider.refresh();
		this.setViewTitle();
	}

	async setViewTitle(){
		if(Api.apiUrl && Api.apiUserName)
		{
			this.view.title = Api.apiUrl + " - " + Api.apiUserName;
		}
	}

	async getImportErrors(){
		ui.logToOutput('PipelineTreeView.getImportErrors Started');
		if(!Api.isApiParamsSet()) { return; }

		let result = await Api.getImportErrors();
		if(result.isSuccessful)
		{
			this.ImportErrorsJson = result.result;
			if(this.ImportErrorsJson.total_entries > 0)
			{
				ui.showOutputMessage(result.result, "Import Pipeline Errors! Check Output Panel");
			}
			
		}
	}

	saveState() {
		ui.logToOutput('PipelineTreeView.saveState Started');
		try {
			this.context.globalState.update('apiUrl', Api.apiUrl);
			this.context.globalState.update('apiUserName', Api.apiUserName);
			this.context.globalState.update('apiPassword', Api.apiPassword);
			this.context.globalState.update('filterString', this.filterString);
			this.context.globalState.update('ShowOnlyActive', this.ShowOnlyActive);
			this.context.globalState.update('ShowOnlyFavorite', this.ShowOnlyFavorite);
			this.context.globalState.update('ServerList', this.ServerList);

		} catch (error) {
			ui.logToOutput("pipelineTreeView.saveState Error !!!", error);
		}
	}

	setFilterMessage(){
		this.view.message = this.getBoolenSign(this.ShowOnlyFavorite) + 'Fav, '+this.getBoolenSign(this.ShowOnlyActive)+'Active, Filter : ' + this.filterString;
	}

	getBoolenSign(variable: boolean){
		return variable ? "✓" : "𐄂";
	}


	loadState() {
		ui.logToOutput('PipelineTreeView.loadState Started');
		try {
			let apiUrlTemp: string = this.context.globalState.get('apiUrl');
			if (apiUrlTemp) { Api.apiUrl = apiUrlTemp; }

			let apiUserNameTemp: string = this.context.globalState.get('apiUserName');
			if (apiUserNameTemp) { Api.apiUserName = apiUserNameTemp; }

			let apiPasswordTemp: string = this.context.globalState.get('apiPassword');
			if (apiPasswordTemp) { Api.apiPassword = apiPasswordTemp; }

			let filterStringTemp: string = this.context.globalState.get('filterString');
			if (filterStringTemp) {
				this.filterString = filterStringTemp;
				this.setFilterMessage();
			}

			let ShowOnlyActiveTemp: boolean = this.context.globalState.get('ShowOnlyActive');
			if (ShowOnlyActiveTemp) { this.ShowOnlyActive = ShowOnlyActiveTemp; }

			let ShowOnlyFavoriteTemp: boolean = this.context.globalState.get('ShowOnlyFavorite');
			if (ShowOnlyFavoriteTemp) { this.ShowOnlyFavorite = ShowOnlyFavoriteTemp; }

			if(apiUrlTemp && !this.ServerList.find(e => e["apiUrl"] === apiUrlTemp))
			{
				this.ServerList.push({ "apiUrl": apiUrlTemp, "apiUserName":apiUserNameTemp, "apiPassword": apiPasswordTemp });
			}

			let ServerListTemp: {}[] = this.context.globalState.get('ServerList');
			if (ServerListTemp) { this.ServerList = ServerListTemp; }
		} catch (error) {
			ui.logToOutput("pipelineTreeView.loadState Error !!!", error);
		}
	}
}

