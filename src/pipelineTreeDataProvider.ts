/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import { PipelineTreeItem } from './pipelineTreeItem';
import { PipelineTreeView } from './pipelineTreeView';

export class PipelineTreeDataProvider implements vscode.TreeDataProvider<PipelineTreeItem>
{
	private _onDidChangeTreeData: vscode.EventEmitter<PipelineTreeItem | undefined | void> = new vscode.EventEmitter<PipelineTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<PipelineTreeItem | undefined | void> = this._onDidChangeTreeData.event;
	pipelinelistResponse: any;
	pipelineList: PipelineTreeItem[] = [];
	visiblePipelineList: PipelineTreeItem[] = [];

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	loadPipelineTreeItemsFromApiResponse() {
		this.pipelineList = [];
		if (this.pipelinelistResponse) {
			for (var pipeline of this.pipelinelistResponse["pipelines"]) {
				if (pipeline) {
					let treeItem = new PipelineTreeItem(pipeline);
					this.pipelineList.push(treeItem);
				}
			}
		}
	}

	getChildren(element: PipelineTreeItem): Thenable<PipelineTreeItem[]> {
		if (!element) {
			this.visiblePipelineList = this.getVisiblePipelineList();
			return Promise.resolve(this.visiblePipelineList);
		}
		return Promise.resolve([]);
	}

	getVisiblePipelineList(): PipelineTreeItem[]{
		var result: PipelineTreeItem[] = [];
		for (var node of this.pipelineList) {
			if (PipelineTreeView.Current.filterString && !node.doesFilterMatch(PipelineTreeView.Current.filterString)) { continue; }
			if (PipelineTreeView.Current.ShowOnlyActive && node.IsPaused) { continue; }
			if (PipelineTreeView.Current.ShowOnlyFavorite && !node.IsFav) { continue; }

			result.push(node);
		}
		return result;
	}

	getTreeItem(element: PipelineTreeItem): PipelineTreeItem {
		return element;
	}
}