/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode";
import * as ui from './ui';
import { Api } from './api';
import { PipelineTreeView } from "./pipelineTreeView";

export class PipelineView {
    public static Current: PipelineView | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private extensionUri: vscode.Uri;

    public pipelineId: string;
    public triggeredPipelineRunId: string;

    public pipelineJson: any;
    public pipelineRunJson: any;
    public pipelineRunHistoryJson: any;
    public pipelineTaskInstancesJson: any;
    public pipelineTasksJson: any;

    private pipelineStatusInterval: NodeJS.Timer;
    private activetabid: string = "tab-1";

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, pipelineId: string) {
        ui.logToOutput('PipelineView.constructor Started');
        this.pipelineId = pipelineId;
        this.extensionUri = extensionUri;

        this._panel = panel;
        this._panel.onDidDispose(this.dispose, null, this._disposables);
        this._setWebviewMessageListener(this._panel.webview);
        this.loadAllPipelineData();
        ui.logToOutput('PipelineView.constructor Completed');
    }

    public resetPipelineData(){
        this.activetabid = "tab-1";
        this.triggeredPipelineRunId = undefined;
        this.pipelineJson = undefined;
        this.pipelineRunJson = undefined;
        this.pipelineRunHistoryJson = undefined;
        this.pipelineTaskInstancesJson = undefined;
        this.pipelineTasksJson = undefined;
        this.stopCheckingPipelineRunStatus();
    }

    public async loadAllPipelineData() {
        ui.logToOutput('PipelineView.loadAllPipelineData Started');
        await this.getPipelineInfo();
        await this.getLastRun();
        await this.getPipelineTasks();
        //await this.getRunHistory();
        await this.renderHmtl();
    }

    public async loadPipelineDataOnly() {
        ui.logToOutput('PipelineView.loadPipelineDataOnly Started');
        await this.getPipelineInfo();
        await this.renderHmtl();
    }

    public async renderHmtl() {
        ui.logToOutput('PipelineView.renderHmtl Started');
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, this.extensionUri);
        //ui.showOutputMessage(this._panel.webview.html);
        ui.logToOutput('PipelineView.renderHmtl Completed');
    }

    public static render(extensionUri: vscode.Uri, pipelineId: string) {
        ui.logToOutput('PipelineView.render Started');
        if (PipelineView.Current) {
            this.Current.pipelineId = pipelineId;
            PipelineView.Current._panel.reveal(vscode.ViewColumn.Two);
            PipelineView.Current.resetPipelineData();
            PipelineView.Current.loadAllPipelineData();
        } else {
            const panel = vscode.window.createWebviewPanel("pipelineView", "Pipeline View", vscode.ViewColumn.Two, {
                enableScripts: true,
            });

            PipelineView.Current = new PipelineView(panel, extensionUri, pipelineId);
        }
    }

    public async getLastRun() {
        ui.logToOutput('PipelineView.getLastRun Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getLastPipelineRun(this.pipelineId);
        if (result.isSuccessful) {
            this.pipelineRunJson = result.result;
            this.getTaskInstances(this.pipelineRunJson.pipeline_run_id);

            if(this.pipelineRunJson && this.pipelineRunJson.state === "running" )
            {
                this.startCheckingPipelineRunStatus(this.pipelineRunJson.pipeline_run_id);
            }
        }

    }

    public async getPipelineRun(pipelineId: string, pipelineRunId: string) {
        ui.logToOutput('PipelineView.getPipelineRun Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getPipelineRun(pipelineId, pipelineRunId);
        if (result.isSuccessful) {
            this.pipelineRunJson = result.result;
            this.getTaskInstances(this.pipelineRunJson.pipeline_run_id);
        }
        await this.renderHmtl();
    }

    public async getRunHistory() {
        ui.logToOutput('PipelineView.getRunHistory Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getPipelineRunHistory(this.pipelineId, 10);
        if (result.isSuccessful) {
            this.pipelineRunHistoryJson = result.result;
        }

    }

    public async getTaskInstances(pipelineRunId: string) {
        ui.logToOutput('PipelineView.getTaskInstances Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getTaskInstances(this.pipelineId, pipelineRunId);
        if (result.isSuccessful) {
            this.pipelineTaskInstancesJson = result.result;
        }

    }

    public async getPipelineInfo() {
        ui.logToOutput('PipelineView.getPipelineInfo Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getPipelineInfo(this.pipelineId);
        if (result.isSuccessful) {
            this.pipelineJson = result.result;
        }
    }

    public async getPipelineTasks() {
        ui.logToOutput('PipelineView.getPipelineTasks Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getPipelineTasks(this.pipelineId);
        if (result.isSuccessful) {
            this.pipelineTasksJson = result.result;
        }
    }

    public dispose() {
        ui.logToOutput('PipelineView.dispose Started');
        PipelineView.Current = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        ui.logToOutput('PipelineView._getWebviewContent Started');

        //file URIs
        const toolkitUri = ui.getUri(webview, extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js", // A toolkit.min.js file is also available
        ]);

        const mainUri = ui.getUri(webview, extensionUri, ["media", "main.js"]);
        const styleUri = ui.getUri(webview, extensionUri, ["media", "style.css"]);

        //LATEST Pipeline RUN
        let state:string = "";
        let logical_date:Date = undefined;
        let start_date:Date = undefined;
        let end_date:Date = undefined;
        let logical_date_string:string = "";
        let start_date_string:string = "";
        let duration:string = "";
        let isPipelineRunning:boolean = false;
        let hasPipelineLatestRun:boolean = false;

        if(this.pipelineRunJson){
            state = this.pipelineRunJson.state;
            logical_date = this.pipelineRunJson.logical_date;
            start_date = this.pipelineRunJson.start_date;
            end_date = this.pipelineRunJson.end_date;
            logical_date_string = new Date(logical_date).toLocaleDateString();
            start_date_string = new Date(start_date).toLocaleString();
            duration = ui.getDuration(new Date(start_date), new Date(end_date));
            isPipelineRunning = (state === "queued" || state === "running") ? true : false;
            hasPipelineLatestRun = true;
        }

        let runningOrFailedTasks: string = "";
        if (this.pipelineTaskInstancesJson) {
            for (var t of this.pipelineTaskInstancesJson["task_instances"]) {
                if(t.state === "running" || t.state === "failed")
                {
                    runningOrFailedTasks += t.task_id + ", " ;
                }
            }
        }

        //INFO TAB
        let owners = (this.pipelineJson) ? this.pipelineJson["owners"].join(", ") : "";
        let tags: string = "";
        this.pipelineJson["tags"].forEach(item => { tags += item.name + ", "; });
        let schedule_interval = (this.pipelineJson && this.pipelineJson["schedule_interval"] && this.pipelineJson["schedule_interval"].value) ? this.pipelineJson["schedule_interval"].value : "";
        let isPausedText = (this.pipelineJson) ? this.pipelineJson.is_paused ? "true" : "false" : "unknown";
        let isPaused = isPausedText === "true";
        
        //TASKS TAB
        let taskRows: string = "";
        if (this.pipelineTaskInstancesJson) {
            for (var t of this.pipelineTaskInstancesJson["task_instances"].sort((a, b) => (a.start_date > b.start_date) ? 1 : -1)) {
                taskRows += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center;">
                            <div class="state-${t.state}" title="${t.state}" ></div>
                            &nbsp; ${t.task_id} (${t.try_number})
                        </div>
                    </td>
                    <td><vscode-link id="task-log-link-${t.task_id}">Log</vscode-link></td>
                    <td>${ui.getDuration(new Date(t.start_date), new Date(t.end_date))}</td>
                    <td>${t.operator}</td>
                </tr>
                `;
            }
        }

        //HISTORY TAB
        let runHistoryRows: string = "";
        if (this.pipelineRunHistoryJson) {
            for (var t of this.pipelineRunHistoryJson["pipeline_runs"]) {
                runHistoryRows += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center;">
                            <div class="state-${t.state}" title="${t.state}"></div>
                            &nbsp; ${t.state}
                        </div>
                    </td>
                    <td><vscode-link id="history-pipeline-run-id-${t.pipeline_run_id}">${new Date(t.start_date).toLocaleString()}</vscode-link></td>
                    <td>${ui.getDuration(new Date(t.start_date), new Date(t.end_date))}</td>
                </tr>
                `;
            }
        }


        let result = /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <script type="module" src="${toolkitUri}"></script>
        <script type="module" src="${mainUri}"></script>
        <link rel="stylesheet" href="${styleUri}">
        <title>Pipeline</title>
      </head>
      <body>  


        <div style="display: flex; align-items: center;">
            <div class="pipeline-paused-${isPausedText}"></div>
            &nbsp; &nbsp; <h2>${this.pipelineId}</h2>
            <div style="visibility: ${isPipelineRunning ? "visible" : "hidden"}; display: flex; align-items: center;">
            &nbsp; &nbsp; <vscode-progress-ring></vscode-progress-ring>
            </div>
        </div>
                    

        <vscode-panels id="tab-control" activeid="${this.activetabid}">
            <vscode-panel-tab id="tab-1">RUN</vscode-panel-tab>
            <vscode-panel-tab id="tab-2">TASKS</vscode-panel-tab>
            <vscode-panel-tab id="tab-3">INFO</vscode-panel-tab>
            <vscode-panel-tab id="tab-4">PREV RUNS</vscode-panel-tab>
            
            <vscode-panel-view id="view-1">
                
            <section>

                    <table>
                        <tr>
                            <th colspan=3>Last Run</th>
                        </tr>
                        <tr>
                            <td>State</td>
                            <td>:</td>
                            <td>
                                <div style="display: flex; align-items: center;">
                                    <div class="state-${state}"></div> &nbsp; ${state}
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td>Tasks</td>
                            <td>:</td>
                            <td>${runningOrFailedTasks}</td>
                        </tr>
                        <tr>
                            <td>Date</td>
                            <td>:</td>
                            <td>${logical_date_string}</td>
                        </tr>
                        <tr>
                            <td>StartDate</td>
                            <td>:</td>
                            <td>${start_date_string}</td>
                        </tr>
                        <tr>
                            <td>Duration</td>
                            <td>:</td>
                            <td>${duration}</td>
                        </tr>
                        <tr>
                            <td colspan="3">
                                <vscode-button appearance="primary" id="run-lastrun-check" ${isPaused ? "disabled" : ""}>Check</vscode-button>  
                                <vscode-button appearance="primary" id="run-lastrun-cancel" ${isPaused || !isPipelineRunning ? "disabled" : ""}>Cancel</vscode-button>     
                                <vscode-button appearance="primary" id="run-view-log" ${!hasPipelineLatestRun ? "disabled" : ""}>View Log</vscode-button>  
                                <vscode-button appearance="primary" id="run-more-pipelinerun-detail" ${!hasPipelineLatestRun ? "disabled" : ""}>More</vscode-button>
                            </td>
                        </tr>
                    </table>
            
                    <br>
            
                    <table>
                        <tr>
                            <th colspan="3">Trigger</th>
                        </tr>
                        <tr>
                            <td>Date</td>
                            <td>:</td>
                            <td><vscode-text-field size="30" id="run_date" placeholder="YYYY-MM-DD (Optional)" maxlength="10"></vscode-text-field></td>
                        </tr>
                        <tr>
                            <td>Config</td>
                            <td>:</td>
                            <td><vscode-text-area id="run_config" cols="50" placeholder="Config in JSON Format (Optional)"></vscode-text-area></td>
                        </tr>
                        <tr>           
                            <td colspan="3"><vscode-button appearance="primary" id="run-trigger-pipeline" ${isPaused ? "disabled" : ""}>
                            Run
                            </vscode-button></td>
                        </tr>
                    </table>

                    <br>

                    <table>
                        <tr>
                            <th colspan="3">
                            <vscode-button appearance="primary" id="run-pause-pipeline" ${isPaused ? "disabled" : ""}>
                            Pause
                            </vscode-button>
                            <vscode-button appearance="primary" id="run-unpause-pipeline" ${!isPaused ? "disabled" : ""}>
                            Un Pause
                            </vscode-button>
                            </th>
                        </tr>
                    </table>

                    <br>
                    <br>
                    <br>
                    
                    <table>
                        <tr>
                            <td colspan="3">
                                <vscode-link href="https://github.com/necatiarslan/mage-vscode-extension/issues/new">Bug Report & Feature Request</vscode-link>
                            </td>
                        </tr>
                    </table>
                    <table>
                        <tr>
                            <td colspan="3">
                                <vscode-link href="https://bit.ly/mage-extension-survey">New Feature Survey</vscode-link>
                            </td>
                        </tr>
                    </table>
            </section>
            </vscode-panel-view>


            <vscode-panel-view id="view-2">

            <section>

                    <table>
                        <tr>
                            <th colspan="4">Tasks</th>
                        </tr>
                        <tr>
                            <td>Task</td>
                            <td></td>
                            <td>Duration</td>            
                            <td>Operator</td>
                        </tr>

                        ${taskRows}

                        <tr>          
                            <td colspan="4">
                                <vscode-button appearance="primary" id="tasks-refresh">Refresh</vscode-button>
                                <vscode-button appearance="primary" id="tasks-more-detail" ${!this.pipelineTaskInstancesJson ? "disabled" : ""}>More</vscode-button>
                            </td>
                        </tr>
                    </table>

            </section>
            </vscode-panel-view>
            
            <vscode-panel-view id="view-3">
            <section>

                    <table>
                    <tr>
                        <th colspan=3>Other</th>
                    </tr>
                    <tr>
                        <td>Owners</td>
                        <td>:</td>
                        <td>${owners}</td>
                    </tr>
                    <tr>
                        <td>Tags</td>
                        <td>:</td>
                        <td>${tags}</td>
                    </tr>
                    <tr>
                        <td>Schedule</td>
                        <td>:</td>
                        <td>${schedule_interval}</td>
                    </tr>
                    <tr>           
                        <td colspan="3"><vscode-button appearance="primary" id="info-source-code">Source Code</vscode-button> <vscode-button appearance="primary" id="other-pipeline-detail">More</vscode-button></td>
                    </tr>
                    </table>

            </section>
            </vscode-panel-view>

            <vscode-panel-view id="view-4">

            <section>
    
                    <table>
                        <tr>
                            <th colspan=3>PREV RUNS</th>
                        </tr>
                        <tr>
                            <td></td>
                            <td>Start Time</td>            
                            <td>Duration</td>
                        </tr>
                        ${runHistoryRows}

                        <tr>
                            <td colspan="3"><vscode-button appearance="primary" id="rev-runs-refresh">Refresh</vscode-button></td>
                        </tr>
                    </table>   
    
            </section>
            </vscode-panel-view>

        </vscode-panels>
      </body>
    </html>
    `;
        ui.logToOutput('PipelineView._getWebviewContent Completed');
        return result;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        ui.logToOutput('PipelineView._setWebviewMessageListener Started');
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                let activetabid = message.activetabid;

                if (["tab-1", "tab-2", "tab-3", "tab-4"].includes(activetabid)) {
                    this.activetabid = message.activetabid;
                }

                ui.logToOutput('PipelineView._setWebviewMessageListener Message Received ' + message.command);
                switch (command) {
                    case "run-trigger-pipeline":
                        this.triggerPipelineWConfig(message.config, message.date);
                        return;
                    case "run-view-log":
                        this.showLastPipelineRunLog();
                        return;
                    case "run-more-pipelinerun-detail":
                        ui.showOutputMessage(this.pipelineRunJson);
                        return;
                    case "other-pipeline-detail":
                        ui.showOutputMessage(this.pipelineJson);
                        return;
                    case "tasks-more-detail":
                        ui.showOutputMessage(this.pipelineTaskInstancesJson);
                        return;
                    case "rev-runs-refresh":
                        this.getRunHistoryAndRenderHtml();
                        return;
                    case "info-source-code":
                        this.showSourceCode();
                        return;
                    case "run-pause-pipeline":
                        this.pausePipeline(true);
                        return;
                    case "run-unpause-pipeline":
                        this.pausePipeline(false);
                        return;

                    case "run-lastrun-check":
                        this.getLastRun();
                        if(this.pipelineRunJson)
                        {
                            this.startCheckingPipelineRunStatus(this.pipelineRunJson.pipeline_run_id);
                        }
                        
                        return;

                    case "run-lastrun-cancel":
                        if(this.pipelineRunJson)
                        {
                            this.cancelPipelineRun(this.pipelineRunJson.pipeline_run_id);
                        }
                        
                        return;

                    case "history-pipeline-run-id":
                        let pipelineRunId:string = message.id;
                        pipelineRunId = pipelineRunId.replace("history-pipeline-run-id-", "");
                        this.activetabid = "tab-1";
                        this.getPipelineRun(this.pipelineId, pipelineRunId);
                        return;

                    case "task-log-link":
                        let taskId:string = message.id;
                        taskId = taskId.replace("task-log-link-", "");
                        this.showLastTaskInstanceLog(this.pipelineId, this.pipelineRunJson.pipeline_run_id, taskId);
                        return;

                    case "tasks-refresh":
                        this.getTasksAndRenderHtml();
                        return;
                    
                    case "tabControlChanged":
                        this.activetabid = message.activeid;
                        ui.logToOutput("tab changed to " + message.activeid);
                        return;
                }

            },
            undefined,
            this._disposables
        );
    }

    private async getTasksAndRenderHtml() {
        this.getPipelineTasks();
        this.renderHmtl();
    }

    async cancelPipelineRun(pipelineRunId:string){
        ui.logToOutput('PipelineView.cancelPipelineRun Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.cancelPipelineRun(this.pipelineId, pipelineRunId);
        if (result.isSuccessful) {
            
        }
    }

    async pausePipeline(is_paused: boolean) {
        ui.logToOutput('PipelineTreeView.pausePipeline Started');
        if (!Api.isApiParamsSet()) { return; }

        if (is_paused && this.pipelineJson.is_paused) { ui.showWarningMessage(this.pipelineId + 'Pipeline is already PAUSED'); return; }
        if (!is_paused && !this.pipelineJson.is_paused) { ui.showWarningMessage(this.pipelineId + 'Pipeline is already ACTIVE'); return; }

        let result = await Api.pausePipeline(this.pipelineId, is_paused);
        if (result.isSuccessful) {
            this.loadPipelineDataOnly();
            is_paused ? PipelineTreeView.Current.notifyPipelinePaused(this.pipelineId) : PipelineTreeView.Current.notifyPipelineUnPaused(this.pipelineId);
        }

    }

    async showSourceCode() {
        ui.logToOutput('PipelineView.showSourceCode Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getSourceCode(this.pipelineId, this.pipelineJson.file_token);
        if (result.isSuccessful) {
            const tmp = require('tmp');
            var fs = require('fs');

            const tmpFile = tmp.fileSync({ mode: 0o644, prefix: this.pipelineId, postfix: '.py' });
            fs.appendFileSync(tmpFile.name, result.result);
            ui.openFile(tmpFile.name);
        }
    }

    async getRunHistoryAndRenderHtml() {
        ui.logToOutput('PipelineView.getRunHistoryAndRenderHtml Started');
        await this.getRunHistory();
        await this.renderHmtl();
    }

    async showLastPipelineRunLog() {
        ui.logToOutput('PipelineView.lastPipelineRunLog Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getLastPipelineRunLog(this.pipelineId);
        if (result.isSuccessful) {
            const tmp = require('tmp');
            var fs = require('fs');
            const tmpFile = tmp.fileSync({ mode: 0o644, prefix: this.pipelineId, postfix: '.log' });
            fs.appendFileSync(tmpFile.name, result.result);
            ui.openFile(tmpFile.name);
        }
    }

    async showLastTaskInstanceLog(pipelineId: string, pipelineRunId:string, taskId:string) {
        ui.logToOutput('PipelineView.showLastTaskInstanceLog Started');
        if (!Api.isApiParamsSet()) { return; }

        let result = await Api.getTaskInstanceLog(pipelineId, pipelineRunId, taskId);
        if (result.isSuccessful) {
            const tmp = require('tmp');
            var fs = require('fs');
            const tmpFile = tmp.fileSync({ mode: 0o644, prefix: pipelineId + '-' + taskId, postfix: '.log' });
            fs.appendFileSync(tmpFile.name, result.result);
            ui.openFile(tmpFile.name);
        }
    }

    async triggerPipelineWConfig(config: string = "", date: string = "") {
        ui.logToOutput('PipelineView.triggerPipelineWConfig Started');
        if (!Api.isApiParamsSet()) { return; }

        if (config && !ui.isJsonString(config)) {
            ui.showWarningMessage("Config is not a valid JSON");
            return;
        }

        if (date && !ui.isValidDate(date)) {
            ui.showWarningMessage("Date is not a valid DATE");
            return;
        }

        if (!config) {
            config = "{}";
        }


        if (config !== undefined) {

            let result = await Api.triggerPipeline(this.pipelineId, config);

            if (result.isSuccessful) {
                this.startCheckingPipelineRunStatus(result.result["pipeline_run_id"]);
                PipelineTreeView.Current.notifyPipelineStateWithPipelineId(this.pipelineId);
            }
        }
    }

    async startCheckingPipelineRunStatus(pipelineRunId:string) {
        ui.logToOutput('PipelineView.startCheckingPipelineRunStatus Started');
        this.triggeredPipelineRunId = pipelineRunId;
        await this.refreshRunningPipelineState(this);
        if (this.pipelineStatusInterval) {
            clearInterval(this.pipelineStatusInterval);//stop prev checking
        }
        this.pipelineStatusInterval = setInterval(this.refreshRunningPipelineState, 5 * 1000, this);
    }

    async stopCheckingPipelineRunStatus() {
        ui.logToOutput('PipelineView.stopCheckingPipelineRunStatus Started');
        if (this.pipelineStatusInterval) {
            clearInterval(this.pipelineStatusInterval);//stop prev checking
        }
    }

    async refreshRunningPipelineState(pipelineView: PipelineView) {
        ui.logToOutput('PipelineView.refreshRunningPipelineState Started');
        if (!Api.isApiParamsSet()) { return; }
        if (!pipelineView.pipelineId || !pipelineView.triggeredPipelineRunId)
        {
            pipelineView.stopCheckingPipelineRunStatus();
            return;
        }

        let result = await Api.getPipelineRun(pipelineView.pipelineId, pipelineView.triggeredPipelineRunId);
        if (result.isSuccessful) {
            pipelineView.pipelineRunJson = result.result;

            let resultTasks = await Api.getTaskInstances(pipelineView.pipelineId, pipelineView.triggeredPipelineRunId);
            if (result.isSuccessful) {
                pipelineView.pipelineTaskInstancesJson = resultTasks.result;
            }
        }
        else {
            pipelineView.stopCheckingPipelineRunStatus();
            return;
        }

        let state = (pipelineView.pipelineRunJson) ? pipelineView.pipelineRunJson.state : "";

        //"queued" "running" "success" "failed"
        if (state === "queued" || state === "running") {
            //go on for the next check
        }
        else {
            pipelineView.stopCheckingPipelineRunStatus();
        }

        pipelineView.renderHmtl();
    }

}