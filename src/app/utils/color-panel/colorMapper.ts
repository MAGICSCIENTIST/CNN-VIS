import * as d3 from 'd3';
import { color, RGBColor, RGBColorFactory } from 'd3';

export class colorTransform{
    constructor(){}
    public static transform(colorScale,type,value,range=1,index:number=0):RGBColor{        
        if(type=='input'){
            return d3.rgb(colorScale[index](1-value))
        }
        else{
            // return  d3.rgb(colorScale((value + range / 2) / range));
            return  d3.rgb(colorScale((value + range / 2) / range));
        }
    }
    public static inverse(hex:string):RGBColor{
        if(hex.charAt(0)=='#'){
            hex = hex.slice(1)
        }
        var _h = (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase();
        var a:RGBColor = d3.rgb(`#${_h}`);
        return a;        
    }
    
}