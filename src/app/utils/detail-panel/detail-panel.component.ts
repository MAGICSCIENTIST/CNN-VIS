import { colorTransform } from './../color-panel/colorMapper';
import { Observable, fromEvent, forkJoin, of } from 'rxjs';
import { map, catchError, debounceTime, throttleTime } from 'rxjs/operators';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Node, Link, ConvViewItem } from '../../../utils/node';
import * as d3 from 'd3';

@Component({
  selector: 'app-detail-panel',
  templateUrl: './detail-panel.component.html',
  styleUrls: ['./detail-panel.component.less']
})
export class DetailPanelComponent implements OnInit {

  @Input() public width = 400;
  @Input() public height = 400;
  @Input() public data: Link = undefined
  @Input() public layerColorScales: any
  @Input() public isScale: boolean = true;
  @Input() public lineStorke: number = 4
  @Input() public minLineWidth: number = 4
  lastData: any = null
  @ViewChild("graphCanvas_input") canvas_input: ElementRef;
  ctx_input: CanvasRenderingContext2D;
  canvasEl_input: HTMLCanvasElement;
  weightType = "other"


  @ViewChild("graphCanvas_output") canvas_output: ElementRef;
  ctx_output: CanvasRenderingContext2D;
  canvasEl_output: HTMLCanvasElement;
  // imageSource: string

  values: ConvViewItem[][] = []
  valuse_result: ConvViewItem = new ConvViewItem()
  // result: number=0


  constructor() { }

  ngOnInit(): void {

    this.generateWeight(this.data)
  }

  ngAfterViewChecked(): void {
    //Called after every check of the component's or directive's content.
    //Add 'implements AfterContentChecked' to the class.
    if (this.lastData == this.data) {

    } else {
      this.lastData = this.data
      this.generateWeight(this.data)
      this.refreshView()
    }


  }
  generateWeight(link: Link): void {
    console.log(this.data)
    if (link.dest.type == "relu") {
      this.weightType = "relu"
      this.values = [[new ConvViewItem(0, 1, 'white')]]
    } else if (link.dest.type == "pool") {
      this.weightType = "pool"
      var sourceSize = this.data.source.output.length
      var destSize = this.data.dest.output.length
      var scaleRatio = sourceSize / destSize
      this.values = new Array(scaleRatio).fill([]).map(x => new Array(scaleRatio).fill(new ConvViewItem(0, 1, 'white')))
    } else {
      this.weightType = "other"
      var _weight: any = this.data.weight
      this.values = _weight.map(x => x.map(y => new ConvViewItem(0, x, 'white')));
    }
    // var _weight: any = this.data.weight
    // if (!_weight) {
    //   this.values = [[new ConvViewItem(0,1,'white')]]
    // } else {
    //   this.values = _weight.map(x => x.map(y => new ConvViewItem(0,x, 'white')));
    // }
  }
  refreshView(): void {
    this.canvasEl_input = this.canvas_input.nativeElement;
    this.ctx_input = this.canvasEl_input.getContext('2d');
    const mouseMove$ = fromEvent(this.canvasEl_input, 'mousemove').pipe(map(res => {
      return [
        [res, this.data.source, "input"],
        [res, this.data.dest, "output"]
      ]
    })).subscribe(res => {
      for (var i = 0; i < res.length; i++) {
        this.onMouseMoveHandle(res[i])
      }
    });

    this.canvasEl_output = this.canvas_output.nativeElement;
    this.ctx_output = this.canvasEl_output.getContext('2d');
    const mouseMove$2 = fromEvent(this.canvasEl_output, 'mousemove').pipe(map(res => {
      return [[res, this.data.dest, "output"], [res, this.data.source, "input"]]
    }))
      // .pipe(      
      //   throttleTime(500)
      // )
      .subscribe(res => {
        for (var i = 0; i < res.length; i++) {
          this.onMouseMoveHandle(res[i])
        }
      });

    this.drawBackImage()
  }

  onMouseMoveHandle(arg): void {
    var e: MouseEvent = arg[0]
    var node: Node = arg[1]
    var whichCanvas = arg[2]
    var colorScale = this.layerColorScales[node.type]

    var layerSize_height = node.output.length
    var layerSize_width = node.output[0].length

    var canvasWidth = this.width
    var canvasHeight = this.height

    var postionX = e.offsetX
    var postionY = e.offsetY

    var postionX_relative;
    var postionY_relative;
    if (this.isScale) {
      postionX_relative = Math.max(~~(postionX * layerSize_width / canvasWidth + 0.5) - 1, 0)
      postionY_relative = Math.max(~~(postionY * layerSize_height / canvasHeight + 0.5) - 1, 0)
    }

    //get value     
    if (whichCanvas == "input") {
      // var weights: any = this.data.weight;
      var weights: any = this.values;
      var values = this.getWeightValue(weights, postionX_relative, postionY_relative, node.output)
      this.values = this.generateWeightView(values[0], colorScale, node)
      this.values.forEach((e, i) => { e.forEach((f, j) => { f.weight = weights[i][j].weight }) })
      // this.clear("input")
      // this.drawBackImage("input")
      // var _v:any = values[1]
      // this.drawConv(this.canvasEl_input, _v, this.isScale, this.width, this.height)
    } else {
      this.valuse_result = new ConvViewItem()
      var value = node.output[postionY_relative][postionX_relative]
      this.valuse_result.value = value
      this.valuse_result.color = colorTransform.transform(colorScale, node.type, value, 1, node.index).formatHex()
      this.valuse_result.fontColor = colorTransform.inverse(this.valuse_result.color).formatHex()
      // this.clear("output")
      // this.drawBackImage("output")
      // this.drawConv(this.canvasEl_output, [[[postionX_relative, postionY_relative]]], this.isScale, layerSize_width, layerSize_height, this.width, this.height)
    }

  }

  getWeightValue(weights: number[][], ox: number, oy: number, datas: number[][]): number[][][] {
    var res = new Array(weights.length).fill([]).map(x => { return new Array(weights[0].length) })
    var res_postion = new Array(weights.length).fill([]).map(x => { return new Array(weights[0].length) })

    var weight_height_half = weights.length % 2 == 0 ? ~~(weights.length / 2) - 1 : ~~(weights.length / 2)
    // 超界处理_height    
    var offsetY = oy - weight_height_half < 0 ? -oy + weight_height_half : 0
    offsetY = oy + weight_height_half >= datas.length ? -(oy + weight_height_half - datas.length + 1) : offsetY
    for (let i = 0; i <= weight_height_half; i++) {
      const columns = weights[i];
      var weight_width_half = columns.length % 2 == 0 ? ~~(columns.length / 2) - 1 : ~~(columns.length / 2)
      for (let j = 0; j <= weight_width_half; j++) {
        const weight = columns[j];
        var offsetX = ox - weight_width_half < 0 ? -ox + weight_width_half : 0
        offsetX = ox + weight_width_half >= datas[0].length ? -(ox + weight_width_half - datas[0].length + 1) : offsetX
        var index_row = weight_height_half - i
        var index_column = weight_width_half - j
        var v = columns.length % 2 == 0 ? this.getValueByPostion_even(datas, ox, oy, index_row, index_column, offsetX, offsetY,columns.length,weights.length) : this.getValueByPostion(datas, ox, oy, index_row, index_column, offsetX, offsetY)
        //left top
        res[i][j] = v[0][0]
        res_postion[i][j] = v[1][0]
        //right top
        res[i][columns.length - j - 1] = v[0][1]
        res_postion[i][columns.length - j - 1] = v[1][1]
        //left bottom
        res[weights.length - i - 1][j] = v[0][2]
        res_postion[weights.length - i - 1][j] = v[1][2]
        //right bottom
        res[weights.length - i - 1][columns.length - j - 1] = v[0][3]
        res_postion[weights.length - i - 1][columns.length - j - 1] = v[1][3]
      }
    }

    return [res, res_postion];
  }
  getValueByPostion(datas: number[][], ox: number, oy: number, index_row: number, index_column: number, offsetX: number, offsetY: number): number[][] {
    var res = []
    var res_postion = []

    // 镜像
    // left top
    var x = ox + offsetX - index_column
    var y = oy + offsetY - index_row
    var value = datas[y][x]
    var postion = [x, y]
    res.push(value)
    res_postion.push(postion)

    // right top
    var x = ox + offsetX + index_column
    var y = oy + offsetY - index_row
    var value = datas[y][x]
    var postion = [x, y]
    res.push(value)
    res_postion.push(postion)

    //left bottom
    var x = ox + offsetX - index_column
    var y = oy + offsetY + index_row
    var value = datas[y][x]
    var postion = [x, y]
    res.push(value)
    res_postion.push(postion)

    //right bottom
    var x = ox + offsetX + index_column
    var y = oy + offsetY + index_row
    var value = datas[y][x]
    var postion = [x, y]
    res.push(value)
    res_postion.push(postion)



    return [res, res_postion]

  }
  getValueByPostion_even(datas: number[][], ox: number, oy: number, index_row: number, index_column: number, offsetX: number, offsetY: number, weightWidth: number, weightHeight: number): number[][] {
    var res = []
    var res_postion = []

    // 镜像
    // right
    var x = ox + offsetX + index_column
    var y = oy + offsetY + index_row
    var value = datas[y][x]
    var postion = [x, y]
    res.push(value)
    res_postion.push(postion)

    // right inverr
    var x = weightWidth - index_column + ox + offsetX-1
    var y = oy + offsetY + index_row
    var value = datas[y][x]
    var postion = [x, y]
    res.push(value)
    res_postion.push(postion)

    //bottom
    var x = ox + offsetX + index_column
    var y = weightHeight - index_row + oy + offsetY-1
    var value = datas[y][x]
    var postion = [x, y]
    res.push(value)
    res_postion.push(postion)

    //bottom right
    var x = weightWidth - index_column + ox + offsetX-1
    var y = weightHeight - index_row + oy + offsetY-1
    var value = datas[y][x]
    var postion = [x, y]
    res.push(value)
    res_postion.push(postion)



    return [res, res_postion]

  }
  generateWeightView(datas: number[][], colorScale: any, node: Node): ConvViewItem[][] {
    var res = []
    for (let i = 0; i < datas.length; i++) {
      const row = datas[i];
      var new_row = []
      for (let j = 0; j < row.length; j++) {
        const value = row[j];
        var item = new ConvViewItem()
        item.color = colorTransform.transform(colorScale, node.type, value, 1, node.index).formatHex()
        item.fontColor = colorTransform.inverse(item.color).formatHex()
        item.value = value
        new_row.push(item)
      }
      res.push(new_row)
    }
    return res;
  }
  //functions
  clear(which: string = "all") {
    if (which != "input") {
      this.canvasEl_output.getContext('2d').clearRect(0, 0, this.canvasEl_output.width, this.canvasEl_output.height);
    }
    if (which != "output") {
      this.canvasEl_input.getContext('2d').clearRect(0, 0, this.canvasEl_input.width, this.canvasEl_input.height);
    }

  }
  drawBackImage(which: string = "all"): void {

    if (which != "input") {
      var colorScale = this.layerColorScales[this.data.dest.type];
      this.drawImage(this.canvasEl_output, this.data.dest, colorScale, this.isScale, this.width, this.height)
    }
    if (which != "output") {
      var colorScale = this.layerColorScales[this.data.source.type];
      this.drawImage(this.canvasEl_input, this.data.source, colorScale, this.isScale, this.width, this.height)
    }


  }
  drawConv(canvasEl: HTMLCanvasElement, postions: number[][][], isScale: boolean = false, originWidth: number = 0, originHeight: number = 0, scaleWidth: number = 0, scaleHeight: number = 0): void {
    var ctx = canvasEl.getContext('2d');

    var scale = [1, 1]
    if (isScale) {
      scale = [scaleHeight / originHeight, scaleWidth / originWidth]
    }
    for (let i = 0; i < postions.length; i++) {
      const row = postions[i];
      for (let j = 0; j < row.length; j++) {
        var position_Rel = row[j]
        var position_Abs = [position_Rel[0] * scale[0], position_Rel[1] * scale[1]]
        ctx.beginPath();
        ctx.rect(20, 20, 150, 100);
        ctx.rect(position_Abs[0], position_Abs[1], position_Abs[0] + scale[0], position_Abs[1] + scale[1])
        ctx.stroke();
      }
    }

  }
  drawImage(canvasEl: HTMLCanvasElement, data: Node, colorScale: any, isScale: boolean = false, scaleWidth: number = 0, scaleHeight: number = 0): void {
    var ctx = canvasEl.getContext('2d');
    let type = data.type

    // array type
    let dataWidth = data.output.length
    // let dataHeight = data.output[0].length
    let dataHeight = dataWidth
    let imageSingle = ctx.getImageData(0, 0, dataWidth, dataHeight);
    let imageSingleArray = imageSingle.data;
    // if (dataWidth === 1) {
    //   imageSingleArray[0] = data;
    // } else {
    for (let i = 0; i < imageSingleArray.length; i += 4) {
      let pixeIndex = Math.floor(i / 4);
      let row = Math.floor(pixeIndex / dataWidth);
      let column = pixeIndex % dataWidth;
      let value = data.output[row][column];
      let color = colorTransform.transform(colorScale, type, value, 1, data.index);

      imageSingleArray[i] = color.r;
      imageSingleArray[i + 1] = color.g;
      imageSingleArray[i + 2] = color.b;
      imageSingleArray[i + 3] = 255;
      ctx.putImageData(imageSingle, 0, 0);
      if (isScale) {
        ctx.drawImage(canvasEl, 0, 0, dataWidth, dataHeight, 0, 0, scaleWidth, scaleHeight);
      }
    }
  }

}
