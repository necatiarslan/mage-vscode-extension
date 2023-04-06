const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  const triggerPipeline = document.getElementById("run-trigger-pipeline");
  triggerPipeline.addEventListener("click", triggerPipelineClick);

  const viewLogPipeline = document.getElementById("run-view-log");
  viewLogPipeline.addEventListener("click", viewLogPipelineClick);

  const runMorePipelineRunDetail = document.getElementById("run-more-pipelinerun-detail");
  runMorePipelineRunDetail.addEventListener("click", runMorePipelineRunDetailClick);

  const otherPipelineDetail = document.getElementById("other-pipeline-detail");
  otherPipelineDetail.addEventListener("click", otherPipelineDetailClick);

  const tasksMoreDetail = document.getElementById("tasks-more-detail");
  tasksMoreDetail.addEventListener("click", tasksMoreDetailClick);

  const revRunsRefresh = document.getElementById("rev-runs-refresh");
  revRunsRefresh.addEventListener("click", revRunsRefreshClick);

  const infoSourceCode = document.getElementById("info-source-code");
  infoSourceCode.addEventListener("click", infoSourceCodeClick);

  const runPausePipeline = document.getElementById("run-pause-pipeline");
  runPausePipeline.addEventListener("click", runPausePipelineClick);

  const runUnPausePipeline = document.getElementById("run-unpause-pipeline");
  runUnPausePipeline.addEventListener("click", runUnPausePipelineClick);

  const runLastRunCheck = document.getElementById("run-lastrun-check");
  runLastRunCheck.addEventListener("click", runLastRunCheckClick);

  const runLastRunCancel = document.getElementById("run-lastrun-cancel");
  runLastRunCancel.addEventListener("click", runLastRunCancelClick);

  const tasksRefreshButton = document.getElementById("tasks-refresh");
  tasksRefreshButton.addEventListener("click", tasksRefreshClicked);

  const prevRunLinkList = document.querySelectorAll("[id^='history-pipeline-run-id']");
  for (let i = 0; i < prevRunLinkList.length; i++) {
    //prevRunLinkList[i].id
    prevRunLinkList[i].addEventListener("click", pipelineRunHistoryLinkClicked);
  }

  const taskLogLinkList = document.querySelectorAll("[id^='task-log-link-']");
  for (let i = 0; i < taskLogLinkList.length; i++) {
    //prevRunLinkList[i].id
    taskLogLinkList[i].addEventListener("click", taskLogLinkClicked);
  }

  const tabControl = document.getElementById("tab-control");
  tabControl.addEventListener("change", tabControlChanged);

}


  function triggerPipelineClick() {
  vscode.postMessage({
    command: "run-trigger-pipeline",
    config: document.getElementById("run_config").value,
    date: document.getElementById("run_date").value,
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function viewLogPipelineClick() {
  vscode.postMessage({
    command: "run-view-log",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function runMorePipelineRunDetailClick() {
  vscode.postMessage({
    command: "run-more-pipelinerun-detail",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function otherPipelineDetailClick() {
  vscode.postMessage({
    command: "other-pipeline-detail",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function tasksMoreDetailClick() {
  vscode.postMessage({
    command: "tasks-more-detail",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function revRunsRefreshClick() {
  vscode.postMessage({
    command: "rev-runs-refresh",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function infoSourceCodeClick() {
  vscode.postMessage({
    command: "info-source-code",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function runPausePipelineClick() {
  vscode.postMessage({
    command: "run-pause-pipeline",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function runUnPausePipelineClick() {
  vscode.postMessage({
    command: "run-unpause-pipeline",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function runLastRunCheckClick() {
  vscode.postMessage({
    command: "run-lastrun-check",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function runLastRunCancelClick() {
  vscode.postMessage({
    command: "run-lastrun-cancel",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function pipelineRunHistoryLinkClicked(e) {
  vscode.postMessage({
    command: "history-pipeline-run-id",
    activetabid: document.getElementById("tab-control").activeid,
    id: e.target.id,
  });
}

function tasksRefreshClicked() {
  vscode.postMessage({
    command: "tasks-refresh",
    activetabid: document.getElementById("tab-control").activeid,
  });
}

function taskLogLinkClicked(e) {
  vscode.postMessage({
    command: "task-log-link",
    activetabid: document.getElementById("tab-control").activeid,
    id: e.target.id,
  });
}

function tabControlChanged(e) {
  vscode.postMessage({
    command: "tabControlChanged",
    activeid: e.target.activeid
  });
}