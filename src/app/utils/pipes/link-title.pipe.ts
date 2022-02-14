import { Pipe, PipeTransform } from '@angular/core';
import { Link } from 'src/utils/node';

@Pipe({
  name: 'linkTitle'
})
export class LinkTitlePipe implements PipeTransform {

  transform(value: Link): string {
    if(!value){
      return ""
    }
    return `${value.source.layerName}(${value.source.index}) -> ${value.dest.layerName}(${value.dest.index})`
  }

}
