'use strict';
import * as vscode from 'vscode';

import { IConfig } from '../spgo';
import { Uri, WorkspaceFolder } from 'vscode';
import { FileHelper } from '../util/fileHelper';

export class WorkspaceHelper{


    static getActiveFile() : Uri {
     
        let selectedResource : Uri = Uri.parse('');

        if( vscode.window.activeTextEditor && vscode.window.activeTextEditor.document && vscode.window.activeTextEditor.document.uri.scheme !== 'output'){
            selectedResource = vscode.window.activeTextEditor.document ? vscode.window.activeTextEditor.document.uri : Uri.parse('');
        }

        return selectedResource;
    }

    // Get the URI of the currently active VSCode workspace
    static getActiveWorkspaceUri() : Promise<Uri> {
        return new Promise((resolve, reject) => {

            let activeWorkspace : Uri = vscode.workspace.workspaceFolders[0].uri; //Default to the first folder/workspace;

            if(vscode.workspace.workspaceFolders.length > 1){
                if( vscode.window.activeTextEditor && vscode.window.activeTextEditor.document && vscode.window.activeTextEditor.document.uri.scheme !== 'output'){
                    const selectedResource : Uri = vscode.window.activeTextEditor.document ? vscode.window.activeTextEditor.document.uri : Uri.parse('');
                    activeWorkspace = vscode.workspace.getWorkspaceFolder(selectedResource).uri;
                }
                else{
                    //Multiple folders in the workspace, but no active files selected. Show a QuickPick
                    let options: vscode.QuickPickOptions = {
                        canPickMany: false,
                        ignoreFocusOut: true
                    };
                    return vscode.window.showQuickPick(vscode.workspace.workspaceFolders.map((folder : WorkspaceFolder) => {return folder.uri.fsPath}), options)
                        .then((result: string) => {
                            if(!result){
                                reject("No workspace selected.")
                            }
                            activeWorkspace = FileHelper.convertToUri(result);
                            resolve(activeWorkspace);
                        });
                }
            }
            
            resolve(activeWorkspace);
        });
    }

    // Get the correct SharePoint Site (web) Uri for a provided file Uri in the active workspace
    static getSiteUriForActiveWorkspace(fileUri: string, config: IConfig) : Uri { // Promise<Uri> {

        let matchCount : number = fileUri.replace(config.sharePointSiteUrl, '').length;
        let subSiteMatchCount : number = 0;
        let siteUri : Uri = Uri.parse(config.sharePointSiteUrl)
        let matches = 0;
        if( config.subSites){
            for (let subSite of config.subSites){

                subSiteMatchCount = fileUri.replace(subSite.sharePointSiteUrl, '').length;
                if(subSiteMatchCount < matchCount){
                    siteUri = Uri.parse(subSite.sharePointSiteUrl)
                    matches++;
                }
            }
        }
        if (matches > 1) {
            throw new Error(`found more than one match for ${fileUri} in the config file. Please check your config file and try again. If you are using subSites, make sure that the subSites are listed in order of most specific to least specific. For example, if you have a subSite for /sites/MySite and a subSite for /sites, make sure that the subSite for /sites/MySite is listed first. This will ensure that the correct subSite is selected for the fileUri provide`);
        }

        return siteUri;
    }
}