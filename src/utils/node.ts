

export class Link{
    source: Node;
    dest: Node;
    weight: number;
}


export class Node{
    bias: number;
    index: number;
    inputLinks: Link[];
    layerName: string;
    output: number[][];    
    outputLinks: Link[];
    type:string
    constructor(node:Node = undefined){
        if(node){
            this.bias = node.bias
            this.index = node.index
            this.inputLinks = node.inputLinks
            this.layerName = node.layerName
            this.output = node.output
            this.outputLinks = node.outputLinks
            this.type = node.type            
        }
    }
}
export class ConvViewItem{
    weight?:number
    value?:number
    color:string
    fontColor?:string
    constructor(value:number=undefined,weight:number=undefined,color:string=undefined,fontColor:string=undefined){
        this.value = value
        this.color = color        
        this.fontColor = fontColor
        this.weight = weight
    }
}
export class OutPutMapOBJ{    

    /**
     * 第几个输出
     *
     * @type {number}
     * @memberof outPutMapOBJ
     */
    index:number;
    outputName :string;
    output:number
    bias:number;
    mapList:nodeMapOBJ[];
    sum:number;
    logit:number;

    constructor(outputNode:Node){
        this.index = outputNode.index
        // this.outputName = outputNode.layerName
        this.bias = outputNode.bias
        var _:any = outputNode.output;
        this.output =_;
        this.mapList = []
        this.sum = 0;    
        this.logit= 0 ;
        for (let i = 0; i < outputNode.inputLinks.length; i++) {
            const inputLink = outputNode.inputLinks[i];
            var source = inputLink.source.inputLinks[0].source
            var existNode =  this.mapList.find(x=>x.index == source.index)
            if(!existNode){
                existNode = new nodeMapOBJ()
                existNode.index = source.index
                existNode.layerName = source.layerName
                existNode.pixMaps = []
                existNode.sum = 0
                this.mapList.push(existNode)
            }
            
            var pix = new pixMapOBJ()
            var _:any = inputLink.source.inputLinks[0].weight
            pix.xy = _
            pix.value = source.output[pix.xy[0]][pix.xy[1]]
            pix.weight = inputLink.weight
            existNode.pixMaps.push(pix)  
            existNode.sum += pix.weight * pix.value
            this.sum += pix.weight * pix.value
        }   
        this.logit = this.bias + this.sum
    }
}
export class nodeMapOBJ{
    layerName:string;
    index:number;
    pixMaps:pixMapOBJ[]
    sum:number;


}

export class pixMapOBJ{
    xy: number[];
    value: number;
    weight: number;
}