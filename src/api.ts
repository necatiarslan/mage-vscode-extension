/* eslint-disable @typescript-eslint/naming-convention */
import { encode } from 'base-64';
import * as ui from './ui';
import { MethodResult } from './methodResult';
import fetch from 'node-fetch';

export class Api {

	public static apiUrl: string = '';
	public static apiUserName: string = '';
	public static apiPassword: string = '';

	public static getHeaders() {
		ui.logToOutput("api.getHeaders started");
		let result = {
			'Content-Type': 'application/json',
			'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
		};
		ui.logToOutput("api.getHeaders completed");
		return result;
	}

	public static isApiParamsSet() {
		if (!this.apiUrl || !this.apiUserName || !this.apiPassword) {
			ui.showWarningMessage("Please set Api URL, UserName and PassWord");
			return false;
		}
		return true;
	}

	public static async triggerPipeline(pipelineId: string, config: string = undefined, date: string = undefined): Promise<MethodResult<any>> {
		ui.logToOutput("api.triggerPipeline started");
		if (!Api.isApiParamsSet()) { return; }

		let result: MethodResult<any> = new MethodResult<any>();

		if (!config) {
			config = "{}";
		}
		let logicalDateParam: string = "";
		if (date) {
			logicalDateParam = ', "logical_date": "' + date + 'T00:00:00Z",';
		}

		try {

			let params = {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				},
				body: '{"conf": ' + config + logicalDateParam + '}',
			};

			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns', params);

			result.result = await response.json();
			if (response.status === 200) {
				ui.showInfoMessage(pipelineId + " Pipeline Triggered.");
				result.isSuccessful = true;
				ui.logToOutput("api.triggerPipeline completed");
				return result;
			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.triggerPipeline completed");
				return result;
			}
		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.triggerPipeline Error !!!", error);
			return result;
		}
	}

	public static async getPipelineRun(pipelineId: string, pipelineRunId: string): Promise<MethodResult<any>> {
		ui.logToOutput("api.getPipelineRun started");
		let result: MethodResult<any> = new MethodResult<any>();
		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			//https://mage.apache.org/api/v1/pipelines/{pipeline_id}/pipelineRuns/{pipeline_run_id}
			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns/' + pipelineRunId, params);

			result.result = await response.json();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.getPipelineRun completed");
				return result;
			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.getPipelineRun completed");
				return result;
			}
		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getPipelineRun Error !!!", error);
			return result;
		}
	}

	public static async cancelPipelineRun(pipelineId: string, pipelineRunId: string): Promise<MethodResult<any>> {
		ui.logToOutput("api.cancelPipelineRun started");
		let result: MethodResult<any> = new MethodResult<any>();
		try {
			let params = {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				},				
				body: JSON.stringify(
					{
						"state": "failed"
					}),
			};

			//https://mage.apache.org/api/v1/pipelines/{pipeline_id}/pipelineRuns/{pipeline_run_id}
			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns/' + pipelineRunId, params);

			result.result = await response.json();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.cancelPipelineRun completed");
				return result;
			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.cancelPipelineRun completed");
				return result;
			}
		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.cancelPipelineRun Error !!!", error);
			return result;
		}
	}

	public static async pausePipeline(pipelineId: string, is_paused: boolean = true): Promise<MethodResult<any>> {
		ui.logToOutput("api.pausePipeline started");
		let result: MethodResult<any> = new MethodResult<any>();
		try {
			let params = {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				},
				body: JSON.stringify(
					{
						"is_paused": is_paused
					}),
			};

			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId, params);

			result.result = response.json();
			if (response.status === 200) {
				ui.showInfoMessage(pipelineId + ' Pipeline ' + (is_paused ? "PAUSED" : "UN-PAUSED"));
				result.isSuccessful = true;
				ui.logToOutput("api.pausePipeline completed");
				return result;
			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.pausePipeline completed");
				return result;
			}

		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.pausePipeline Error !!!", error);
			return result;
		}
	}

	public static async getSourceCode(pipelineId: string, fileToken: string): Promise<MethodResult<any>> {
		ui.logToOutput("api.getSourceCode started");
		let result: MethodResult<any> = new MethodResult<any>();
		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			let response = await fetch(Api.apiUrl + '/pipelineSources/' + fileToken, params);

			result.result = await response.text();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.getSourceCode completed");
				return result;

			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.getSourceCode completed");
				return result;
			}

		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getSourceCode Error !!!", error);
			return result;
		}
	}

	public static async getPipelineInfo(pipelineId: string): Promise<MethodResult<any>> {
		ui.logToOutput("api.getPipelineInfo started");
		let result: MethodResult<any> = new MethodResult<any>();
		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/details', params);

			result.result = await response.json();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.getPipelineInfo completed");
				return result;
			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.getPipelineInfo completed");
				return result;
			}
		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getPipelineInfo Error !!!", error);
			return result;
		}

	}

	public static async getPipelineTasks(pipelineId: string): Promise<MethodResult<any>> {
		ui.logToOutput("api.getPipelineTasks started");
		let result: MethodResult<any> = new MethodResult<any>();
		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/tasks', params);

			result.result = await response.json();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.getPipelineTasks completed");
				return result;
			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.getPipelineTasks completed");
				return result;
			}
		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getPipelineTasks Error !!!", error);
			return result;
		}

	}

	public static async getLastPipelineRun(pipelineId: string): Promise<MethodResult<any>> {
		ui.logToOutput("api.getLastPipelineRun started");
		let result = await this.getPipelineRunHistory(pipelineId, 1);
		if (result.isSuccessful && Object.keys(result.result.pipeline_runs).length>0 )
		{
			return this.getPipelineRun(pipelineId, result.result.pipeline_runs[0].pipeline_run_id);
		}
		else
		{
			result.isSuccessful = false;
			result.result = undefined;
			result.error = new Error('No Pipeline Run Found for ' + pipelineId);
			return result;
		}
		
	}

	public static async getPipelineRunHistory(pipelineId: string, limit: number): Promise<MethodResult<any>> {
		ui.logToOutput("api.getPipelineRunHistory started");
		let result: MethodResult<any> = new MethodResult<any>();
		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns?order_by=-start_date&limit=' + limit, params);

			result.result = await response.json();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.getPipelineRunHistory completed");
				return result;
			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.getPipelineRunHistory completed");
				return result;
			}

		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getPipelineRunHistory Error !!!", error);
			return result;
		}

	}

	public static async getTaskInstances(pipelineId: string, pipelineRunId: string): Promise<MethodResult<any>> {
		ui.logToOutput("api.getTaskInstances started");
		let result: MethodResult<any> = new MethodResult<any>();
		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			//https://mage.apache.org/api/v1/pipelines/{pipeline_id}/pipelineRuns/{pipeline_run_id}/taskInstances
			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns/' + pipelineRunId + '/taskInstances', params);

			result.result = await response.json();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.getTaskInstances completed");
				return result;
			}
			else {
				ui.showApiErrorMessage(pipelineId + ' Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.getTaskInstances completed");
				return result;
			}

		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getTaskInstances Error !!!", error);
			return result;
		}

	}

	public static async getLastPipelineRunLog(pipelineId: string): Promise<MethodResult<string>> {
		ui.logToOutput("api.getLastPipelineRunLog started");
		let result: MethodResult<string> = new MethodResult<any>();
		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			ui.showInfoMessage('Fecthing Latest Pipeline Run Logs, wait please ...');

			let response = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns?order_by=-start_date&limit=1', params);

			if (response.status === 200) {
				let pipelineRunResponse = await response.json();
				let pipelineRunId = pipelineRunResponse['pipeline_runs'][0]['pipeline_run_id'];
				let responseTaskInstances = await (await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns/' + pipelineRunId + '/taskInstances', params));
				let responseTaskInstancesJson = await responseTaskInstances.json();

				result.result = '###################### BEGINING OF Pipeline RUN ######################\n\n';
				for (var taskInstance of responseTaskInstancesJson['task_instances']) {
					let responseLogs = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns/' + pipelineRunId + '/taskInstances/' + taskInstance['task_id'] + '/logs/' + taskInstance['try_number'], params);
					let responseLogsText = await responseLogs.text();
					result.result += '############################################################\n';
					result.result += 'Pipeline=' + pipelineId + '\n';
					result.result += 'PipelineRun=' + pipelineRunId + '\n';
					result.result += 'TaskId=' + taskInstance['task_id'] + '\n';
					result.result += 'Try=' + taskInstance['try_number'] + '\n';
					result.result += '############################################################\n\n';
					result.result += responseLogsText;
				}
				result.result += '###################### END OF Pipeline RUN ######################\n\n';
				result.isSuccessful = true;
				ui.logToOutput("api.getLastPipelineRunLog completed");
				return result;
			}
			else {
				ui.showErrorMessage('Error !!!\n' + response.statusText);
				result.isSuccessful = false;
				ui.logToOutput("api.getLastPipelineRunLog completed");
				return result;
			}

		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getLastPipelineRunLog Error !!!", error);
			return result;
		}
	}

	public static async getTaskInstanceLog(pipelineId: string, pipelineRunId:string, taskId:string): Promise<MethodResult<string>> {
		ui.logToOutput("api.getTaskInstanceLog started");
		let result: MethodResult<string> = new MethodResult<any>();
		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			ui.showInfoMessage('Fecthing Latest Pipeline Run Logs, wait please ...');

			let responseTaskInstances = await (await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns/' + pipelineRunId + '/taskInstances', params));
			let responseTaskInstancesJson = await responseTaskInstances.json();

			result.result = '';
			for (var taskInstance of responseTaskInstancesJson['task_instances']) {
				if (taskInstance['task_id'] !== taskId){ continue; }

				let responseLogs = await fetch(Api.apiUrl + '/pipelines/' + pipelineId + '/pipelineRuns/' + pipelineRunId + '/taskInstances/' + taskInstance['task_id'] + '/logs/' + taskInstance['try_number'], params);
				let responseLogsText = await responseLogs.text();
				result.result += '############################################################\n';
				result.result += 'Pipeline=' + pipelineId + '\n';
				result.result += 'PipelineRun=' + pipelineRunId + '\n';
				result.result += 'TaskId=' + taskInstance['task_id'] + '\n';
				result.result += 'Try=' + taskInstance['try_number'] + '\n';
				result.result += '############################################################\n\n';
				result.result += responseLogsText;
			}
			result.result += '';
			result.isSuccessful = true;
			ui.logToOutput("api.getTaskInstanceLog completed");
			return result;

		} catch (error) {
			ui.showErrorMessage(pipelineId + ' System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getTaskInstanceLog Error !!!", error);
			return result;
		}
	}

	public static async getPipelineList(): Promise<MethodResult<any>> {
		ui.logToOutput("api.getPipelineList started");
		let result: MethodResult<any> = new MethodResult<any>();

		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			let response = await fetch(Api.apiUrl + '/pipelines', params);

			result.result = await response.json();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.getPipelineList completed");
				return result;
			}
			else {
				ui.showApiErrorMessage('Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.getPipelineList completed");
				return result;
			}
		} catch (error) {
			ui.showErrorMessage('Can not connect to Mage. Please check Url, UserName and Password.\n', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getPipelineList Error !!!", error);
			return result;
		}
	}

	/*
	{
    "import_errors": [
        {
            "filename": "/opt/mage/pipelines/pipeline_load_error.py",
            "import_error_id": 98,
            "stack_trace": "Traceback (most recent call last):\n  File \"<frozen importlib._bootstrap>\", line 219, in _call_with_frames_removed\n  File \"/opt/mage/pipelines/pipeline_load_error.py\", line 73, in <module>\n    this_will_skip2 >> run_this_last\nNameError: name 'this_will_skip2' is not defined\n",
            "timestamp": "2022-09-21T03:00:58.618426+00:00"
        }
    ],
    "total_entries": 1
	}
	 */
	public static async getImportErrors(): Promise<MethodResult<any>> {
		ui.logToOutput("api.getImportErrors started");
		let result: MethodResult<any> = new MethodResult<any>();

		try {
			let params = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Basic ' + encode(Api.apiUserName + ":" + Api.apiPassword)
				}
			};

			let response = await fetch(Api.apiUrl + '/importErrors', params);

			result.result = await response.json();
			if (response.status === 200) {
				result.isSuccessful = true;
				ui.logToOutput("api.getImportErrors completed");
				return result;
			}
			else {
				ui.showApiErrorMessage('Api Call Error !!!', result.result);
				result.isSuccessful = false;
				ui.logToOutput("api.getImportErrors completed");
				return result;
			}
		} catch (error) {
			ui.showErrorMessage('System Error !!!', error);
			result.isSuccessful = false;
			result.error = error;
			ui.logToOutput("api.getImportErrors Error !!!", error);
			return result;
		}
	}

}