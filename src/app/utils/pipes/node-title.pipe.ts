import { Pipe, PipeTransform } from '@angular/core';
import { Node } from '../../../utils/node';
import { environment as overviewConfig } from '../../../environments/environment';

@Pipe({
  name: 'nodeTitle'
})
export class NodeTitlePipe implements PipeTransform {

  transform(index: string, node: Node=undefined): string {    
    if(!node){
      return index
    }
    if (node.type === 'input') {
      var dic = ['red','green','blue','alpha'];
      return dic[index]
    } 
    else if(node.layerName === 'output'){
      return overviewConfig.classLists[index]
    }
    else {
      return index + ""
    }

  }

}
