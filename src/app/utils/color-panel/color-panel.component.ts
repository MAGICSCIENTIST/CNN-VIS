import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { Node, Link } from '../../../utils/node';
import * as d3 from 'd3';

@Component({
  selector: 'app-color-panel',
  templateUrl: './color-panel.component.html',
  styleUrls: ['./color-panel.component.less']
})
export class ColorPanelComponent implements OnInit {

  @Input() public width = 400;
  @Input() public height = 400;
  @Input() public data: Node
  @Input() public layerColorScales: any
  @Input() public isScale: boolean = true;
  @Input() public  lineStorke: number = 4
  @Input() public  minLineWidth: number = 4

  @ViewChild("graphCanvas") canvas: ElementRef;
  ctx: CanvasRenderingContext2D;
  canvasEl: HTMLCanvasElement;
  imageSource: string
  

  constructor() { }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.

  }
  ngAfterViewInit(): void {    
    if (this.data.layerName == 'output') {
      this.drawLine()
    } else {
      this.drawImage()
    }
  }

  drawLine(): void {    
    this.canvasEl = this.canvas.nativeElement;
    this.ctx = this.canvasEl.getContext('2d');
    let type = this.data.type
    let colorScale = this.layerColorScales[this.data.layerName];

    var _: any = this.data.output
    var value: number = _
    var color = d3.rgb(colorScale(value))

    var lineWidth = Math.max((this.width -8)*value,this.minLineWidth)
    this.ctx.beginPath();
    this.ctx.rect(4, (this.height-this.lineStorke)/2, lineWidth, this.lineStorke);
    this.ctx.fillStyle = color+"";
    this.ctx.fill();

    this.ctx.font = "24px serif";
    this.ctx.fillStyle = 'black';
    var label = (value*100).toFixed(4) + "%"
    this.ctx.fillText(label, 0, this.height,this.width);
  }



  //functions
  drawImage(): void {
    this.canvasEl = this.canvas.nativeElement;
    this.ctx = this.canvasEl.getContext('2d');
    let type = this.data.type
    let colorScale = this.layerColorScales[type];
    if (type === 'input') {
      colorScale = colorScale[this.data.index];
    }

    // array type
    let dataWidth = this.data.output.length
    // let dataHeight = this.data.output[0].length
    let dataHeight = dataWidth
    let imageSingle = this.ctx.getImageData(0, 0, dataWidth, dataHeight);
    let imageSingleArray = imageSingle.data;
    // if (dataWidth === 1) {
    //   imageSingleArray[0] = this.data;
    // } else {
    for (let i = 0; i < imageSingleArray.length; i += 4) {
      let pixeIndex = Math.floor(i / 4);
      let row = Math.floor(pixeIndex / dataWidth);
      let column = pixeIndex % dataWidth;
      let color = undefined;
      var a = this.data.output[row][column]

      color = d3.rgb(colorScale(1 - this.data.output[row][column]));
      if (type === 'input' || type === 'fc') {
        // color = d3.rgb(colorScale(1 - this.data.output[row][column]))
      } else {
        // color = d3.rgb(colorScale((d.output[row][column] + range / 2) / range));
      }

      imageSingleArray[i] = color.r;
      imageSingleArray[i + 1] = color.g;
      imageSingleArray[i + 2] = color.b;
      imageSingleArray[i + 3] = 255;
      this.ctx.putImageData(imageSingle, 0, 0);
      if (this.isScale) {
        this.ctx.drawImage(this.canvasEl, 0, 0, dataWidth, dataHeight, 0, 0, this.width, this.height);
      }

      // if (this.isScale) {
      //   let largeCanvas = document.createElement('canvas');
      //   largeCanvas.width = this.width * 3;
      //   largeCanvas.height = this.height * 3;
      //   let largeCanvasContext = largeCanvas.getContext('2d');
      //   largeCanvasContext.drawImage(this.canvas.nativeElement, 0, 0, this.width, this.height,
      //     0, 0, this.width * 3, this.height * 3);
      //   let imageDataURL = largeCanvas.toDataURL();
      //   this.imageSource = imageDataURL;
      //   // this.ctx.drawImage(imageDataURL,0,0,this.width,this.height)
      // }
      // this.ctx.scale(1.5,1.5)      
      // this.ctx.drawImage(this.canvasEl, 0, 0, dataWidth, dataHeight);
    }
  }


}
