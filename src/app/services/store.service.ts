import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

class writable{
  value :any
  _eventHandle: EventEmitter<any> = new EventEmitter();
  constructor(startValue: any){
    this.value = startValue;
  }
  set(value: any) {
    this.value = value
    this._eventHandle.emit(value)
  }
  update(value: any){
    this.value = value
    this._eventHandle.emit(value)
  }
  subscribe(onFulfilled: (value: any) => void, onRejected?: (reason: any) => void){
    this._eventHandle.subscribe(onFulfilled, onRejected)
  }  
  
}

export const cnnStore = new writable([]);
export const svgStore = new writable(undefined);

export const vSpaceAroundGapStore = new writable(undefined);
export const hSpaceAroundGapStore = new writable(undefined);

export const nodeCoordinateStore = new writable([]);
export const selectedScaleLevelStore = new writable(undefined);

export const cnnLayerRangesStore = new writable({
  local:[],
  module:[],
  global:[],
  output:[]
});
export const cnnLayerMinMaxStore = new writable([]);

export const needRedrawStore = new writable([undefined, undefined]);

export const detailedModeStore = new writable(true);

export const shouldIntermediateAnimateStore = new writable(false);

export const isInSoftmaxStore = new writable(false);
export const softmaxDetailViewStore = new writable({});
export const allowsSoftmaxAnimationStore = new writable(false);

export const hoverInfoStore = new writable({});

export const modalStore = new writable({});
 
export const intermediateLayerPositionStore = new writable({});
