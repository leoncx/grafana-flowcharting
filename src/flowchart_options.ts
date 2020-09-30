import { FlowchartHandler } from 'flowchartHandler';

import XGraph from 'graph_class';
import { Flowchart } from 'flowchart_class';
import { $GF } from 'globals_class';

import $ from 'jquery';

export class FlowchartOptionsCtrl {
  $scope: gf.TIFlowchartOptionsScope;
  ctrl: any; //TODO: redefine any
  flowchartHandler: FlowchartHandler;
  panel: any;
  sourceTypes = $GF.CONSTANTS.SOURCE_TYPES;
  themes = $GF.CONSTANTS.DIOTHEME_TYPES;
  errorSourceFlag = false;
  errorSourceMsg = '';
  errorDownloadFlag = false;
  errorDownloadMsg = '';
  editMode = false;
  currentFlowchart: Flowchart | undefined;
  newName = '';
  currentFlowchartName = 'Main';
  /** @ngInject */
  constructor($scope: gf.TIFlowchartOptionsScope) {
    $scope.editor = this;
    $scope.$GF = $GF.me();
    this.$scope = $scope;
    this.ctrl = $scope.ctrl;
    this.panel = this.ctrl.panel;
    this.flowchartHandler = this.ctrl.flowchartHandler;
    this.currentFlowchart = this.flowchartHandler.getFlowchart();
  }

  /**
   * Render
   *
   * @memberof FlowchartOptionsCtrl
   */
  render() {
    this.flowchartHandler.render();
  }

  /**
   * onSourceChange event when source changes
   *
   * @memberof FlowchartOptionsCtrl
   */
  onSourceChange() {
    const name = this.flowchartHandler.getCurrentFlowchartName();
    this.flowchartHandler.onSourceChange(name);
    this.render();
  }

  /**
   * onOptionChange event when options change
   *
   * @memberof FlowchartOptionsCtrl
   */
  onOptionChange() {
    const name = this.flowchartHandler.getCurrentFlowchartName();
    this.flowchartHandler.onOptionsChange(name);
    this.render();
  }

  // onColorChange() {
  //   this.onOptionChange();
  // }

  checkSource_onSourceChange(source: string): boolean {
    const bool = XGraph.isValidXml(source);
    this.errorSourceFlag = !bool;
    if (!bool) {
      $GF.message.setMessage('Invalid Xml definition', 'error');
    } else {
      $GF.message.clearMessage();
      this.onSourceChange();
      this.$scope.$applyAsync();
    }
    return bool;
  }

  addFlowchart() {
    this.editMode = true;
    this.currentFlowchart = this.flowchartHandler.addFlowchart(this.flowchartHandler.getFlowchartTmpName());
    this.flowchartHandler.setCurrentFlowchart(this.currentFlowchart.getName());
    $GF.message.setMessage(this.currentFlowchart.getName());
    this.newName = this.currentFlowchart.getName();
  }

  removeFlowchart() {
    const current = this.flowchartHandler.getCurrentFlowchart();
    if (current !== undefined && current.getName() !== 'Main') {
      this.currentFlowchart = this.flowchartHandler.setCurrentFlowchart();
      this.currentFlowchartName = this.flowchartHandler.getCurrentFlowchartName();
      $GF.message.setMessage(this.currentFlowchartName);
      this.flowchartHandler.removeFlowchart(current.getName());
    }
  }

  selectFlowchart() {
    this.flowchartHandler.setCurrentFlowchart(this.flowchartHandler.currentFlowchartName);
    this.currentFlowchart = this.flowchartHandler.getCurrentFlowchart();
    if (this.currentFlowchart) {
      this.currentFlowchartName = this.flowchartHandler.getCurrentFlowchartName();
      $GF.message.setMessage(this.currentFlowchartName);
    }
  }

  cancelFlowchart() {
    this.editMode = false;
    const canceled = this.currentFlowchart;
    this.currentFlowchart = this.flowchartHandler.setCurrentFlowchart('Main');
    if (canceled) {
      this.flowchartHandler.removeFlowchart(canceled.getName());
      if (this.currentFlowchart) {
        this.currentFlowchartName = this.currentFlowchart.getName();
      }
    }
    $GF.message.setMessage(this.currentFlowchartName);
  }

  isValideFlowchart(): boolean {
    const fcs = this.flowchartHandler.getFlowchartNames();
    if (this.newName === undefined) {
      return false;
    }
    if (this.newName.length === 0) {
      return false;
    }
    if (fcs.includes(this.newName) && this.currentFlowchart && this.newName !== this.currentFlowchart.getName()) {
      $GF.message.setMessage(`Flowchart with name "${this.newName}" already exist`, 'error');
      return false;
    }
    return true;
  }

  validateFlowchart() {
    this.editMode = false;
    if (this.currentFlowchart) {
      this.currentFlowchart.setName(this.newName);
    }
    this.currentFlowchartName = this.newName;
    this.currentFlowchart = this.flowchartHandler.setCurrentFlowchart(this.newName);
  }

  checkUrl_onSourceChange(data: gf.TFlowchartData): boolean {
    this.errorDownloadFlag = false;
    // this.errorDownloadMsg = '';
    let response;
    try {
      const url = this.ctrl.templateSrv.replaceWithText(data.url);
      const ajaxOptions = {
        method: 'GET',
        url: url,
        async: false,
        success: data => (response = data),
        error: error => {
          this.errorDownloadFlag = true;
          $GF.message.setMessage(`Error : ${error.statusText}`, 'error');
          this.$scope.$applyAsync();
        },
        beforeSend: xhr => {},
      };
      let authString;
      if (data.remoteAuthType !== 'none') {
        if (data.remoteAuthType === 'basic') {
          authString = `Basic ${btoa(`${data.remoteAuthBasicUsername}:${data.remoteAuthBasicPassword}`)}`;
        } else {
          authString = `Bearer ${data.remoteAuthBearerToken}`;
        }
        ajaxOptions.beforeSend = xhr => {
          xhr.setRequestHeader('Authorization', authString);
        };
      }
      $.ajax(ajaxOptions);
      if (this.errorDownloadFlag) {
        return true;
      }
      const text = response;
      const fc = this.flowchartHandler.getCurrentFlowchart();
      if (fc && fc.data.type === 'xml') {
        const bool = XGraph.isValidXml(text);
        this.errorSourceFlag = !bool;
        if (this.errorSourceFlag) {
          $GF.message.setMessage('Response is an invalid Xml definition', 'error');
          $GF.log.error('Response is an invalid Xml definition');
          // this.errorSourceMsg = 'Response is an invalid Xml definition';
        } else {
          $GF.message.clearMessage();
          // this.errorDownloadMsg = '';
          this.onSourceChange();
        }
      } else {
        // this.errorDownloadMsg = '';
        this.onSourceChange();
      }
      this.$scope.$applyAsync();
    } catch (error) {
      this.errorDownloadFlag = true;
      $GF.message.setMessage('Error when call url', 'error');
      // this.errorDownloadMsg = 'Error when call url';
    }
    return true;
  }

  /**
   * Open graph in index in draw.io
   *
   * @param {Number} name - index of graph
   * @memberof FlowchartOptionsCtrl
   * @see flowchartHandler:openDrawEditor
   */
  edit(name: string) {
    this.flowchartHandler.openDrawEditor(name);
  }

  getFlowcharts() {
    return this.flowchartHandler.getFlowcharts();
  }

  getNames(): string[] {
    return this.flowchartHandler.getFlowchartNames();
  }

  getCurrentFlowchart(): Flowchart[] {
    const current = this.flowchartHandler.getCurrentFlowchart();
    if (current) {
      return [current];
    }
    return [this.flowchartHandler.flowcharts[0]];
  }
}

/** @ngInject */
export function flowchartOptionsTab($q, $sce, uiSegmentSrv) {
  return {
    restrict: 'E',
    scope: true,
    templateUrl: `${$GF.plugin.getPartialPath()}/flowchart/index.html`,
    controller: FlowchartOptionsCtrl,
  };
}
