import { Link, Node,OutPutMapOBJ } from './../../../utils/node';
import { Component, OnInit, ViewChild, ElementRef, ViewChildren, QueryList, TemplateRef } from '@angular/core';
import { loadTrainedModel, constructCNN } from '../../../utils/cnn-tf';
import { cnnStore } from './../../services/store.service';
import { updateCNNLayerRanges, drawSVG, drawCNN, drawCNN2 } from './overview-draw.js'
import { environment as overviewConfig } from '../../../environments/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as d3 from "d3";
@Component({
  selector: 'app-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.less']
})
export class OverviewComponent implements OnInit {

  @ViewChildren('node') nodes: QueryList<ElementRef>
  @ViewChildren('background') linksGroups: QueryList<ElementRef>
  @ViewChild('overview') wrapper: ElementRef;
  @ViewChild('titleTemplate', { static: false }) template?: TemplateRef<{}>;
  @ViewChild('detailTemplate', { static: false }) detailTemplate?: TemplateRef<{}>;
  // ctx: CanvasRenderingContext2D;
  // canvasEl: HTMLCanvasElement;

  // Wait to load
  lastCNN = null;
  cnn:Node[][]|any = undefined;
  outputObjList: OutPutMapOBJ[] = []
  width = undefined;
  height = undefined;
  model = undefined;
  selectedImage = undefined;
  imageOptions = [
    { file: 'boat_1.jpeg', class: 'lifeboat' },
    { file: 'bug_1.jpeg', class: 'ladybug' },
    { file: 'pizza_1.jpeg', class: 'pizza' },
    { file: 'pepper_1.jpeg', class: 'bell pepper' },
    { file: 'bus_1.jpeg', class: 'bus' },
    { file: 'koala_1.jpeg', class: 'koala' },
    { file: 'espresso_1.jpeg', class: 'espresso' },
    { file: 'panda_1.jpeg', class: 'red panda' },
    { file: 'orange_1.jpeg', class: 'orange' },
    { file: 'car_1.jpeg', class: 'sport car' }
  ];  

  nodeSize = overviewConfig.nodeLength;
  layerColorScales = overviewConfig.layerColorScales;
  isScale = true
  isDetailVisible =false
  detailLink:Link

  constructor(private notificationService: NzNotificationService) { }

  ngOnInit(): void {
    this.selectedImage = this.imageOptions[6].file;
    this.Init()
  }

  ngAfterViewChecked(): void {
    //Called after every check of the component's or directive's content.
    //Add 'implements AfterContentChecked' to the class.
    if (this.lastCNN == this.cnn) {
      console.log("None change")
    } else {
      this.lastCNN = this.cnn
      console.log("changed")
      this.drawLines(Array.prototype.concat.apply([], this.cnn))
    }


  }
  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.    
    //set link canvas size
    this.width = this.wrapper.nativeElement.getBoundingClientRect().width
    this.height = 200

  }

  // custom event
  onNodeMouseOverHandler(node: any): void {

  }
  onNodeMouseLeaveHandler(node: any): void {

  }
  onNodeMouseClickHandler(node: Node): void {
    this.drawLines(Array.prototype.concat.apply([], this.cnn), '#f1f1f1', true)    
    var data: Node;    
    if (node.layerName == "input") {
      data = new Node(node);
      data.inputLinks = node.outputLinks
      this.drawLines([data], "black")
    } else if(node.layerName == "output"){      
      var flattenList = []
      // for (let i = 0; i < node.inputLinks.length; i++) {
      //   const inputLink = node.inputLinks[i];
      //   inputLink.weight
      //   var flattenNode = inputLink.source.inputLinks[0].source
      //   var xy = inputLink.source.inputLinks[0].weight
      //   flattenNode.index
        
      // }
      
      var outPutMapOBJ =new OutPutMapOBJ(node)
      outPutMapOBJ.outputName = overviewConfig.classLists[node.index]      
      console.log(outPutMapOBJ)
      this.notificationService.template(this.template!, { nzData: outPutMapOBJ,nzDuration: 0 });      
      data = node;
      this.drawLines([data], "black")
    }
    else {
      data = node;
      this.notificationService.template(this.detailTemplate!, { nzData: node.inputLinks,nzDuration: 0 });      
      this.drawLines([data], "black")
    }
    
  }
  showDetailView(link: Link): void {
    this.isDetailVisible = true
    this.detailLink = link
  }
  closeDetailView(): void {    
    this.isDetailVisible = false;
  }

  getLineHeight(layer: Node[]): number {
    var type = layer[0].type
    if (type == "relu" || type == "pool") {
      return 40;
    } else {
      return this.height
    }
  }



  // functions
  drawLines(nodes: Node[], style = "#f1f1f1", clear = false): void {
    if (nodes == null) {
      console.log("None")
      return
    }
    var ctxLinks = []
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      for (let k = 0; k < node.inputLinks.length; k++) {
        var sourceNode;
        var destNode;
        if (node.layerName == "output") {          
          var inputLink = node.inputLinks[k];
          sourceNode = inputLink.source.inputLinks[0].source
          destNode = inputLink.dest
          // console.log(inputLink.weight)
        }
        else {
          var inputLink = node.inputLinks[k];
          sourceNode = inputLink.source
          destNode = inputLink.dest
        }

        let sourceNodeEl = this.getNodeElement(sourceNode)

        let sourceRect: DOMRect = sourceNodeEl.nativeElement.getBoundingClientRect()
        let destNodeEl = this.getNodeElement(destNode)
        let destRect: DOMRect = destNodeEl.nativeElement.getBoundingClientRect()
        let canvasEl = this.getLinkCanvas(sourceNodeEl.nativeElement.getAttribute("layer"), destNodeEl.nativeElement.getAttribute("layer"))
        let canvasRect = canvasEl.nativeElement.getBoundingClientRect()
        var ctx_link = canvasEl.nativeElement.getContext('2d');
        //not included then add and clear
        if (!ctxLinks.includes(ctx_link)) {
          ctxLinks.push(ctx_link)
          if (clear) {
            ctx_link.clearRect(0, 0, canvasRect.width, canvasRect.height);
          }
        }
        ctx_link.beginPath();
        // ctx_link.moveTo(sourceRect.x, 0);
        var offset_s_X = sourceRect.width / 2
        var offset_d_X = destRect.width / 2
        var start = [sourceRect.x - canvasRect.x + offset_s_X, 0]
        var p1 = [sourceRect.x - canvasRect.x + offset_s_X, canvasEl.nativeElement.height]
        var p2 = [destRect.x - canvasRect.x + offset_d_X, 0]
        var end = [destRect.x - canvasRect.x + offset_d_X, canvasEl.nativeElement.height]
        // console.log(start,p1,p2,end)

        ctx_link.moveTo(start[0], start[1]);
        // ctx_link.bezierCurveTo(destRect.x-canvasRect.x, 0, sourceRect.x-canvasRect.x, canvasEl.nativeElement.height, destRect.x-canvasRect.x, canvasEl.nativeElement.height);
        ctx_link.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], end[0], end[1]);
        ctx_link.strokeStyle = style
        ctx_link.stroke();
      }


    }





  }
  getNodeElement(node: Node): ElementRef {
    let nodeElement = this.nodes.find(el => el.nativeElement.getAttribute("node") == node.index && el.nativeElement.getAttribute("layerName") == node.layerName)
    return nodeElement
  }
  getLinkCanvas(sourceLayerIndex: string, desLayerIndex: string): ElementRef {
    let canvasElement = this.linksGroups.find(el => el.nativeElement.getAttribute("from") == sourceLayerIndex && el.nativeElement.getAttribute("to") == desLayerIndex)
    return canvasElement
  }


  async Init(): Promise<void> {

    console.time('Construct cnn');
    './assets/public'

    this.model = await loadTrainedModel('./assets/public/assets/data/model.json');

    this.cnn = await constructCNN(`./assets/public/assets/img/${this.selectedImage}`, this.model);
    console.timeEnd('Construct cnn');

    cnnStore.set(this.cnn);

    // Ignore the flatten layer for now
    let flatten = this.cnn[this.cnn.length - 2];
    this.cnn.splice(this.cnn.length - 2, 1);
    this.cnn.flatten = flatten;
    
    // construct output layerObj    
    for (let i = 0; i < this.cnn.length; i++) {
      const layer = this.cnn[i];
      if(layer[0].layerName == "output"){
        for (let k = 0; k < layer.length; k++) {
          const node = layer[k];
          var outputObj = new OutPutMapOBJ(node)  
          outputObj.outputName = overviewConfig.classLists[node.index]
          this.outputObjList.push(outputObj)
        }                
        break;
      }      
    }

    // //test
    // var a = []
    // a.push (this.cnn[11])
    // this.cnn = a

    console.log(this.cnn);



    updateCNNLayerRanges();
    // var wholeSvg = d3.select("#overview-svg")
    //   .select('#cnn-svg');
    // var svgStruct = drawSVG(wholeSvg);
    // Create and draw the CNN view
    //drawCNN2(svgStruct.width, svgStruct.height, svgStruct.cnnGroup, this.onNodeMouseOverHandler,      this.onNodeMouseLeaveHandler, this.onNodeMouseClickHandler);
  }



}
