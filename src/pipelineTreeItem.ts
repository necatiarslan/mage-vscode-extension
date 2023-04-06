/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';

export class PipelineTreeItem extends vscode.TreeItem {
	public IsPaused: boolean;
	public IsActive: boolean;
	public PipelineId: string;
	public Owners: string[];
	public Tags: {name:string}[];
	public ApiResponse: any;
	public FileToken: string;
	public LatestPipelineRunId: string;
	public LatestPipelineState: string;
	public IsFav: boolean = false;

	constructor(apiResponse: any) {
		super(apiResponse["pipeline_id"]);
		this.setApiResponse(apiResponse);
		this.refreshUI();
	}

	public setApiResponse(apiResponse: any) {
		this.ApiResponse = apiResponse;
		this.PipelineId = apiResponse["pipeline_id"];
		this.IsActive = apiResponse["is_active"];
		this.IsPaused = apiResponse["is_paused"];
		this.Owners = apiResponse["owners"];
		this.Tags = apiResponse["tags"];
		this.FileToken = apiResponse["file_token"];
	}

	public isPipelineRunning(): boolean {
		return (this.LatestPipelineState === 'queued' || this.LatestPipelineState === 'running');
	}

	public refreshUI() {
		super.label = this.PipelineId;

		if (this.IsPaused) {
			this.iconPath = new vscode.ThemeIcon('circle-outline');
			this.ApiResponse["is_paused"] = true;
		}
		else {
			//"queued" "running" "success" "failed"
			if (this.LatestPipelineState === 'queued') {
				this.iconPath = new vscode.ThemeIcon('loading~spin');
			}
			else if (this.LatestPipelineState === 'running') {
				this.iconPath = new vscode.ThemeIcon('loading~spin');
			}
			else if (this.LatestPipelineState === 'success') {
				this.iconPath = new vscode.ThemeIcon('check');
			}
			else if (this.LatestPipelineState === 'failed') {
				this.iconPath = new vscode.ThemeIcon('error');
			}
			else {
				this.iconPath = new vscode.ThemeIcon('circle-filled');
			}
			this.ApiResponse["is_paused"] = false;
		}
	}

	public doesFilterMatch(filterString: string): boolean {
		let words: string[] = filterString.split(',');
		let matchingWords: string[] = [];
		for (var word of words) {
			if (word === 'active' && !this.IsPaused) { matchingWords.push(word); continue; }
			if (word === 'paused' && this.IsPaused) { matchingWords.push(word); continue; }
			if (this.PipelineId.includes(word)) { matchingWords.push(word); continue; }
			if (this.Owners.includes(word)) { matchingWords.push(word); continue; }
			if (word === 'fav' && this.IsFav) { matchingWords.push(word); continue; }

			for(var t of this.Tags)
			{
				if (t.name.includes(word)) { matchingWords.push(word); continue; }
			}
		}

		return words.length === matchingWords.length;
	}
}