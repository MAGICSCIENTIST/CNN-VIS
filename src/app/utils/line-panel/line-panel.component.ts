import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Node, Link } from '../../../utils/node';
import * as d3 from 'd3';

@Component({
  selector: 'app-line-panel',
  templateUrl: './line-panel.component.html',
  styleUrls: ['./line-panel.component.less']
})
export class LinePanelComponent implements OnInit {

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


  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {    
    // if (this.data.layerName == 'output') {
    //   this.drawLine()
    // } else {
    //   this.drawImage()
    // }
    this.drawLine()
  }
  drawLine(): void {    
    this.canvasEl = this.canvas.nativeElement;
    this.ctx = this.canvasEl.getContext('2d');
    let type = this.data.type


    for (let i = 0; i < this.data.inputLinks.length; i++) {
      const inputLink = this.data.inputLinks[i];      
      
    }
    
  }

}
