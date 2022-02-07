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
}