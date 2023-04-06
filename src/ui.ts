import * as vscode from 'vscode';
import { Uri, Webview } from "vscode";
import { readFileSync } from 'fs';
import { join } from 'path';

var outputChannel: vscode.OutputChannel;
var logsOutputChannel: vscode.OutputChannel;

var NEW_LINE:string = "\n\n";

export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
  return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}

export function showOutputMessage(message: any, popupMessage: string = "Results are printed to OUTPUT / Mage-Extension"): void {

  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel("Mage-Extension");
  }

  outputChannel.clear();

  if (typeof message === "object") {
    outputChannel.appendLine(JSON.stringify(message, null, 4));
  }
  else {
    outputChannel.appendLine(message);
  }
  outputChannel.show();
  showInfoMessage(popupMessage);
}

export function logToOutput(message: any, error: Error = undefined): void {
  let now = new Date().toLocaleString();

  if (!logsOutputChannel) {
    logsOutputChannel = vscode.window.createOutputChannel("Mage-Log");
  }

  if (typeof message === "object") {
    logsOutputChannel.appendLine("[" + now + "] " + JSON.stringify(message, null, 4));
  }
  else {
    logsOutputChannel.appendLine("[" + now + "] " + message);
  }

  if (error) {
    logsOutputChannel.appendLine(error.name);
    logsOutputChannel.appendLine(error.message);
    logsOutputChannel.appendLine(error.stack);
  }
}

export function showInfoMessage(message: string): void {
  vscode.window.showInformationMessage(message);
}

export function showWarningMessage(message: string): void {
  vscode.window.showWarningMessage(message);
}

export function showErrorMessage(message: string, error: Error = undefined): void {
  if (error) {
    vscode.window.showErrorMessage(message + NEW_LINE + error.name + NEW_LINE + error.message);
  }
  else {
    vscode.window.showErrorMessage(message);
  }
}

export function showApiErrorMessage(message: string, jsonResult): void {
  let preText:string = "";
  if (jsonResult) {
    if (jsonResult.status === 403)
    {
      preText = "Permission Denied !!!";
      vscode.window.showErrorMessage(preText);
    }
    else if (jsonResult.status === 401)
    {
      preText = "Invalid Authentication Info !!!";
      vscode.window.showErrorMessage(preText);
    }
    else if (jsonResult.status === 404)
    {
      preText = "Resource Not Found !!!";
      vscode.window.showErrorMessage(preText);
    }
    else
    {
      vscode.window.showErrorMessage(preText);
    }
  }
  else {
    vscode.window.showErrorMessage(message);
  }

  /*
  {
  "type": "string",
  "title": "string",
  "status": 0,
  "detail": "string",
  "instance": "string"
  }
  */
}

export function getExtensionVersion() {
  const { version: extVersion } = JSON.parse(
    readFileSync(join(__dirname, '..', 'package.json'), { encoding: 'utf8' })
  );
  return extVersion;
}

export function openFile(file: string) {
  vscode.commands.executeCommand('vscode.open', vscode.Uri.file(file), vscode.ViewColumn.One);
  //vscode.workspace.openTextDocument(vscode.Uri.file(file));
}

function padTo2Digits(num: number) {
  return num.toString().padStart(2, '0');
}

export function getDuration(startDate: Date, endDate: Date): string {
  if(!startDate)
  {
    return "";
  }

  if(!endDate || endDate < startDate)
  {
    endDate = new Date();//now
  }

  var duration = endDate.valueOf() - startDate.valueOf();
  return (convertMsToTime(duration));
}

export function convertMsToTime(milliseconds: number): string {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}:${padTo2Digits(seconds,)}`;
}

export function isJsonString(jsonString: string): boolean {
  try {
    var json = JSON.parse(jsonString);
    return (typeof json === 'object');
  } catch (e) {
    return false;
  }
}

export function isValidDate(dateString: string): boolean {
  var regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) {
    return false;  // Invalid format
  }
  var d = new Date(dateString);
  var dNum = d.getTime();
  if (!dNum && dNum !== 0) {
    return false; // NaN value, Invalid date
  }
  return d.toISOString().slice(0, 10) === dateString;
}