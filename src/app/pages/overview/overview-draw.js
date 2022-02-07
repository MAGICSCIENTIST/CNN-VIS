import {
    svgStore, vSpaceAroundGapStore, hSpaceAroundGapStore, cnnStore,
    nodeCoordinateStore, selectedScaleLevelStore, cnnLayerRangesStore,
    detailedModeStore, cnnLayerMinMaxStore, hoverInfoStore
} from './../../services/store.service';

import {
    getExtent, getLinkData
} from './draw-utils.js';

import { environment as overviewConfig } from '../../../environments/environment';
import * as d3 from "d3";


// Shared variables
let svg = svgStore.value;
svgStore.subscribe(value => { svg = value; })

let vSpaceAroundGap = vSpaceAroundGapStore.value;
vSpaceAroundGapStore.subscribe(value => { vSpaceAroundGap = value; })

let hSpaceAroundGap = hSpaceAroundGapStore.value;
hSpaceAroundGapStore.subscribe(value => { hSpaceAroundGap = value; })

let cnn = cnnStore.value;
cnnStore.subscribe(value => { cnn = value; })

let nodeCoordinate = nodeCoordinateStore.value;
nodeCoordinateStore.subscribe(value => { nodeCoordinate = value; })

let selectedScaleLevel = selectedScaleLevelStore.value;
selectedScaleLevelStore.subscribe(value => { selectedScaleLevel = value; })

let cnnLayerRanges = cnnLayerRangesStore.value;
cnnLayerRangesStore.subscribe(value => { cnnLayerRanges = value; })

let cnnLayerMinMax = cnnLayerMinMaxStore.value;
cnnLayerMinMaxStore.subscribe(value => { cnnLayerMinMax = value; })

let detailedMode = detailedModeStore.value;
detailedModeStore.subscribe(value => { detailedMode = value; })


// Configs
const layerColorScales = overviewConfig.layerColorScales;
const nodeLength = overviewConfig.nodeLength;
const numLayers = overviewConfig.numLayers;
const edgeOpacity = overviewConfig.edgeOpacity;
const edgeInitColor = overviewConfig.edgeInitColor;
const edgeStrokeWidth = overviewConfig.edgeStrokeWidth;
const svgPaddings = overviewConfig.svgPaddings;
const gapRatio = overviewConfig.gapRatio;
const classLists = overviewConfig.classLists;
const formater = d3.format('.4f');

/**
 * Update the ranges for current CNN layers
 */
export const updateCNNLayerRanges = () => {
    // Iterate through all nodes to find a output ranges for each layer
    let cnnLayerRangesLocal = [1];
    let curRange = undefined;

    // Also track the min/max of each layer (avoid computing during intermediate
    // layer)    
    cnnLayerMinMax = [];

    for (let l = 0; l < cnn.length - 1; l++) {
        let curLayer = cnn[l];

        // Compute the min max
        let outputExtents = curLayer.map(l => getExtent(l.output));
        let aggregatedExtent = outputExtents.reduce((acc, cur) => {
            return [Math.min(acc[0], cur[0]), Math.max(acc[1], cur[1])];
        })
        cnnLayerMinMax.push({ min: aggregatedExtent[0], max: aggregatedExtent[1] });

        // conv layer refreshes curRange counting
        if (curLayer[0].type === 'conv' || curLayer[0].type === 'fc') {
            aggregatedExtent = aggregatedExtent.map(Math.abs);
            // Plus 0.1 to offset the rounding error (avoid black color)
            curRange = 2 * (0.1 +
                Math.round(Math.max(...aggregatedExtent) * 1000) / 1000);
        }

        if (curRange !== undefined) {
            cnnLayerRangesLocal.push(curRange);
        }
    }

    // Finally, add the output layer range
    cnnLayerRangesLocal.push(1);
    cnnLayerMinMax.push({ min: 0, max: 1 });

    // Support different levels of scales (1) lcoal, (2) component, (3) global
    let cnnLayerRangesComponent = [1];
    let numOfComponent = (numLayers - 2) / 5;
    for (let i = 0; i < numOfComponent; i++) {
        let curArray = cnnLayerRangesLocal.slice(1 + 5 * i, 1 + 5 * i + 5);
        let maxRange = Math.max(...curArray);
        for (let j = 0; j < 5; j++) {
            cnnLayerRangesComponent.push(maxRange);
        }
    }
    cnnLayerRangesComponent.push(1);

    let cnnLayerRangesGlobal = [1];
    let maxRange = Math.max(...cnnLayerRangesLocal.slice(1,
        cnnLayerRangesLocal.length - 1));
    for (let i = 0; i < numLayers - 2; i++) {
        cnnLayerRangesGlobal.push(maxRange);
    }
    cnnLayerRangesGlobal.push(1);

    // Update the ranges dictionary
    cnnLayerRanges.local = cnnLayerRangesLocal;
    cnnLayerRanges.module = cnnLayerRangesComponent;
    cnnLayerRanges.global = cnnLayerRangesGlobal;
    cnnLayerRanges.output = [0, d3.max(cnn[cnn.length - 1].map(d => d.output))];

    cnnLayerRangesStore.set(cnnLayerRanges);
    cnnLayerMinMaxStore.set(cnnLayerMinMax);
}

export const drawSVG = (wholeSvg) => {
    // Create SVG
    // wholeSvg = d3.select(container)
    //     .select('#cnn-svg');
    svg = wholeSvg.append('g')
        .attr('class', 'main-svg')
        .attr('transform', `translate(${svgPaddings.left}, 0)`);
    svgStore.set(svg);

    var width = Number(wholeSvg.style('width').replace('px', '')) -
        svgPaddings.left - svgPaddings.right;
    var height = Number(wholeSvg.style('height').replace('px', '')) -
        svgPaddings.top - svgPaddings.bottom;

    let cnnGroup = svg.append('g')
        .attr('class', 'cnn-group');

    // let underGroup = svg.append('g')
    //     .attr('class', 'underneath');
    return {
        wholeSvg,
        svg,
        cnnGroup,
        width,
        height
    }
}

/**
 * Draw the overview
 * @param {number} width Width of the cnn group
 * @param {number} height Height of the cnn group
 * @param {object} cnnGroup Group to appen cnn elements to
 * @param {function} nodeMouseOverHandler Callback func for mouseOver
 * @param {function} nodeMouseLeaveHandler Callback func for mouseLeave
 * @param {function} nodeClickHandler Callback func for click
 */
export const drawCNN = (width, height, cnnGroup, nodeMouseOverHandler,
    nodeMouseLeaveHandler, nodeClickHandler) => {
    // Draw the CNN
    // There are 8 short gaps and 5 long gaps
    hSpaceAroundGap = (width - nodeLength * numLayers) / (8 + 5 * gapRatio);
    hSpaceAroundGapStore.set(hSpaceAroundGap);
    let leftAccuumulatedSpace = 0;

    // Iterate through the cnn to draw nodes in each layer
    for (let l = 0; l < cnn.length; l++) {
        let curLayer = cnn[l];
        let isOutput = curLayer[0].layerName === 'output';

        nodeCoordinate.push([]);

        // Compute the x coordinate of the whole layer
        // Output layer and conv layer has long gaps
        if (isOutput || curLayer[0].type === 'conv') {
            leftAccuumulatedSpace += hSpaceAroundGap * gapRatio;
        } else {
            leftAccuumulatedSpace += hSpaceAroundGap;
        }

        // All nodes share the same x coordiante (left in div style)
        let left = leftAccuumulatedSpace;

        let layerGroup = cnnGroup.append('g')
            .attr('class', 'cnn-layer-group')
            .attr('id', `cnn-layer-group-${l}`);

        vSpaceAroundGap = (height - nodeLength * curLayer.length) /
            (curLayer.length + 1);
        vSpaceAroundGapStore.set(vSpaceAroundGap);

        let nodeGroups = layerGroup.selectAll('g.node-group')
            .data(curLayer, d => d.index)
            .enter()
            .append('g')
            .attr('class', 'node-group')
            .style('cursor', 'pointer')
            .style('pointer-events', 'all')
            .on('click', nodeClickHandler)
            .on('mouseover', nodeMouseOverHandler)
            .on('mouseleave', nodeMouseLeaveHandler)
            .classed('node-output', isOutput)
            .attr('id', (d, i) => {
                // Compute the coordinate
                // Not using transform on the group object because of a decade old
                // bug on webkit (safari)
                // https://bugs.webkit.org/show_bug.cgi?id=23113
                let top = i * nodeLength + (i + 1) * vSpaceAroundGap;
                top += svgPaddings.top;
                nodeCoordinate[l].push({ x: left, y: top });
                return `layer-${l}-node-${i}`
            });

        // Overwrite the mouseover and mouseleave function for output nodes to show
        // hover info in the UI
        layerGroup.selectAll('g.node-output')
            .on('mouseover', (d, i, g) => {
                nodeMouseOverHandler(d, i, g);
                hoverInfoStore.set({ show: true, text: `Output value: ${formater(d.output)}` });
            })
            .on('mouseleave', (d, i, g) => {
                nodeMouseLeaveHandler(d, i, g);
                hoverInfoStore.set({ show: false, text: `Output value: ${formater(d.output)}` });
            });

        if (curLayer[0].layerName !== 'output') {
            // Embed raster image in these groups
            nodeGroups.append('image')
                .attr('class', 'node-image')
                .attr('width', nodeLength)
                .attr('height', nodeLength)
                .attr('x', left)
                .attr('y', (d, i) => nodeCoordinate[l][i].y);

            // Add a rectangle to show the border
            nodeGroups.append('rect')
                .attr('class', 'bounding')
                .attr('width', nodeLength)
                .attr('height', nodeLength)
                .attr('x', left)
                .attr('y', (d, i) => nodeCoordinate[l][i].y)
                .style('fill', 'none')
                .style('stroke', 'gray')
                .style('stroke-width', 1)
                .classed('hidden', true);
        } else {
            nodeGroups.append('rect')
                .attr('class', 'output-rect')
                .attr('x', left)
                .attr('y', (d, i) => nodeCoordinate[l][i].y + nodeLength / 2 + 8)
                .attr('height', nodeLength / 4)
                .attr('width', 0)
                .style('fill', 'gray');
            nodeGroups.append('text')
                .attr('class', 'output-text')
                .attr('x', left)
                .attr('y', (d, i) => nodeCoordinate[l][i].y + nodeLength / 2)
                .style('dominant-baseline', 'middle')
                .style('font-size', '11px')
                .style('fill', 'black')
                .style('opacity', 0.5)
                .text((d, i) => classLists[i]);

            // Add annotation text to tell readers the exact output probability
            // nodeGroups.append('text')
            //   .attr('class', 'annotation-text')
            //   .attr('id', (d, i) => `output-prob-${i}`)
            //   .attr('x', left)
            //   .attr('y', (d, i) => nodeCoordinate[l][i].y + 10)
            //   .text(d => `(${d3.format('.4f')(d.output)})`);
        }
        leftAccuumulatedSpace += nodeLength;
    }

    // Share the nodeCoordinate
    nodeCoordinateStore.set(nodeCoordinate)

    // Compute the scale of the output score width (mapping the the node
    // width to the max output score)
    let outputRectScale = d3.scaleLinear()
        .domain(cnnLayerRanges.output)
        .range([0, nodeLength]);

    // Draw the canvas
    debugger
    for (let l = 0; l < cnn.length; l++) {
        let range = cnnLayerRanges[selectedScaleLevel][l];
        svg.select(`g#cnn-layer-group-${l}`)
            .selectAll('image.node-image')
            .each((d, i, g) => {
                drawOutput(d, i, g, range)
            });
    }

    svg.selectAll('g.node-output').each(
        (d, i, g) => {
            drawOutputScore(d, i, g, outputRectScale)
        }
    );

    // Add layer label
    let layerNames = cnn.map(d => {
        if (d[0].layerName === 'output') {
            return {
                name: d[0].layerName,
                dimension: `(${d.length})`
            }
        } else {
            return {
                name: d[0].layerName,
                dimension: `(${d[0].output.length}, ${d[0].output.length}, ${d.length})`
            }
        }
    });

    let svgHeight = Number(d3.select('#cnn-svg').style('height').replace('px', '')) + 150;
    let scroll = new SmoothScroll('a[href*="#"]', { offset: -svgHeight });

    let detailedLabels = svg.selectAll('g.layer-detailed-label')
        .data(layerNames)
        .enter()
        .append('g')
        .attr('class', 'layer-detailed-label')
        .attr('id', (d, i) => `layer-detailed-label-${i}`)
        .classed('hidden', !detailedMode)
        .attr('transform', (d, i) => {
            let x = nodeCoordinate[i][0].x + nodeLength / 2;
            let y = (svgPaddings.top + vSpaceAroundGap) / 2 - 6;
            return `translate(${x}, ${y})`;
        })
        .style('cursor', d => d.name.includes('output') ? 'default' : 'help')
        .on('click', (d) => {
            let target = '';
            if (d.name.includes('conv')) { target = 'convolution' }
            if (d.name.includes('relu')) { target = 'relu' }
            if (d.name.includes('max_pool')) { target = 'pooling' }
            if (d.name.includes('input')) { target = 'input' }

            // Scroll to a article element
            let anchor = document.querySelector(`#article-${target}`);
            scroll.animateScroll(anchor);
        });

    detailedLabels.append('title')
        .text('Move to article section');

    detailedLabels.append('text')
        .style('opacity', 0.7)
        .style('dominant-baseline', 'middle')
        .append('tspan')
        .style('font-size', '12px')
        .text(d => d.name)
        .append('tspan')
        .style('font-size', '8px')
        .style('font-weight', 'normal')
        .attr('x', 0)
        .attr('dy', '1.5em')
        .text(d => d.dimension);

    let labels = svg.selectAll('g.layer-label')
        .data(layerNames)
        .enter()
        .append('g')
        .attr('class', 'layer-label')
        .attr('id', (d, i) => `layer-label-${i}`)
        .classed('hidden', detailedMode)
        .attr('transform', (d, i) => {
            let x = nodeCoordinate[i][0].x + nodeLength / 2;
            let y = (svgPaddings.top + vSpaceAroundGap) / 2 + 5;
            return `translate(${x}, ${y})`;
        })
        .style('cursor', d => d.name.includes('output') ? 'default' : 'help')
        .on('click', (d) => {
            let target = '';
            if (d.name.includes('conv')) { target = 'convolution' }
            if (d.name.includes('relu')) { target = 'relu' }
            if (d.name.includes('max_pool')) { target = 'pooling' }
            if (d.name.includes('input')) { target = 'input' }

            // Scroll to a article element
            let anchor = document.querySelector(`#article-${target}`);
            scroll.animateScroll(anchor);
        });

    labels.append('title')
        .text('Move to article section');

    labels.append('text')
        .style('dominant-baseline', 'middle')
        .style('opacity', 0.8)
        .text(d => {
            if (d.name.includes('conv')) { return 'conv' }
            if (d.name.includes('relu')) { return 'relu' }
            if (d.name.includes('max_pool')) { return 'max_pool' }
            return d.name
        });

    // Add layer color scale legends
    getLegendGradient(svg, layerColorScales.conv, 'convGradient');
    getLegendGradient(svg, layerColorScales.input[0], 'inputGradient');

    let legendHeight = 5;
    let legends = svg.append('g')
        .attr('class', 'color-legend')
        .attr('transform', `translate(${0}, ${svgPaddings.top + vSpaceAroundGap * (10) + vSpaceAroundGap +
            nodeLength * 10
            })`);

    drawLegends(legends, legendHeight);

    // Add edges between nodes
    let linkGen = d3.linkHorizontal()
        .x(d => d.x)
        .y(d => d.y);

    let linkData = getLinkData(nodeCoordinate, cnn);

    let edgeGroup = cnnGroup.append('g')
        .attr('class', 'edge-group');

    edgeGroup.selectAll('path.edge')
        .data(linkData)
        .enter()
        .append('path')
        .attr('class', d =>
            `edge edge-${d.targetLayerIndex} edge-${d.targetLayerIndex}-${d.targetNodeIndex}`)
        .attr('id', d =>
            `edge-${d.targetLayerIndex}-${d.targetNodeIndex}-${d.sourceNodeIndex}`)
        .attr('d', d => linkGen({ source: d.source, target: d.target }))
        .style('fill', 'none')
        .style('stroke-width', edgeStrokeWidth)
        .style('opacity', edgeOpacity)
        .style('stroke', edgeInitColor);

    // Add input channel annotations
    let inputAnnotation = cnnGroup.append('g')
        .attr('class', 'input-annotation');

    let redChannel = inputAnnotation.append('text')
        .attr('x', nodeCoordinate[0][0].x + nodeLength / 2)
        .attr('y', nodeCoordinate[0][0].y + nodeLength + 5)
        .attr('class', 'annotation-text')
        .style('dominant-baseline', 'hanging')
        .style('text-anchor', 'middle');

    redChannel.append('tspan')
        .style('dominant-baseline', 'hanging')
        .style('fill', '#C95E67')
        .text('Red');

    redChannel.append('tspan')
        .style('dominant-baseline', 'hanging')
        .text(' channel');

    inputAnnotation.append('text')
        .attr('x', nodeCoordinate[0][1].x + nodeLength / 2)
        .attr('y', nodeCoordinate[0][1].y + nodeLength + 5)
        .attr('class', 'annotation-text')
        .style('dominant-baseline', 'hanging')
        .style('text-anchor', 'middle')
        .style('fill', '#3DB665')
        .text('Green');

    inputAnnotation.append('text')
        .attr('x', nodeCoordinate[0][2].x + nodeLength / 2)
        .attr('y', nodeCoordinate[0][2].y + nodeLength + 5)
        .attr('class', 'annotation-text')
        .style('dominant-baseline', 'hanging')
        .style('text-anchor', 'middle')
        .style('fill', '#3F7FBC')
        .text('Blue');
}

export const drawCNN2 = (width, height, cnnGroup, nodeMouseOverHandler,
    nodeMouseLeaveHandler, nodeClickHandler) => {
    debugger
    // Iterate through the cnn to draw nodes in each layer
    for (let l = 0; l < cnn.length; l++) {
        let curLayer = cnn[l];
        let isOutput = curLayer[0].layerName === 'output';

        // nodeCoordinate.push([]);

        // // Compute the x coordinate of the whole layer
        // // Output layer and conv layer has long gaps
        // if (isOutput || curLayer[0].type === 'conv') {
        //     leftAccuumulatedSpace += hSpaceAroundGap * gapRatio;
        // } else {
        //     leftAccuumulatedSpace += hSpaceAroundGap;
        // }

        // // All nodes share the same x coordiante (left in div style)
        // let left = leftAccuumulatedSpace;

        // layer group
        let layerGroup = cnnGroup.append('g')
            .attr('class', 'cnn-layer-group')
            .attr('id', `cnn-layer-group-${l}`);

        // vSpaceAroundGap = (height - nodeLength * curLayer.length) / (curLayer.length + 1);
        // vSpaceAroundGapStore.set(vSpaceAroundGap);

        // node groups
        let nodeGroups = layerGroup.selectAll('g.node-group')
            .data(curLayer, d => d.index)
            .enter()
            .append('g')
            .attr('class', 'node-group')
            .style('cursor', 'pointer')
            .style('pointer-events', 'all')
            .on('click', nodeClickHandler)
            .on('mouseover', nodeMouseOverHandler)
            .on('mouseleave', nodeMouseLeaveHandler)
            .classed('node-output', isOutput)
            // .attr('id', (d, i) => {
            //     // Compute the coordinate
            //     // Not using transform on the group object because of a decade old
            //     // bug on webkit (safari)
            //     // https://bugs.webkit.org/show_bug.cgi?id=23113
            //     let top = i * nodeLength + (i + 1) * vSpaceAroundGap;
            //     top += svgPaddings.top;
            //     nodeCoordinate[l].push({ x: left, y: top });
            //     return `layer-${l}-node-${i}`
            // });

        // // Overwrite the mouseover and mouseleave function for output nodes to show
        // // hover info in the UI
        // layerGroup.selectAll('g.node-output')
        //     .on('mouseover', (d, i, g) => {
        //         nodeMouseOverHandler(d, i, g);
        //         hoverInfoStore.set({ show: true, text: `Output value: ${formater(d.output)}` });
        //     })
        //     .on('mouseleave', (d, i, g) => {
        //         nodeMouseLeaveHandler(d, i, g);
        //         hoverInfoStore.set({ show: false, text: `Output value: ${formater(d.output)}` });
        //     });


        if (curLayer[0].layerName !== 'output') {
            // Embed raster image in these groups
            nodeGroups.append('image')
                .attr('class', 'node-image')
                .attr('width', nodeLength)
                .attr('height', nodeLength)
                .attr('x', left)
                .attr('y', (d, i) => nodeCoordinate[l][i].y);

            // Add a rectangle to show the border
            nodeGroups.append('rect')
                .attr('class', 'bounding')
                .attr('width', nodeLength)
                .attr('height', nodeLength)
                .attr('x', left)
                .attr('y', (d, i) => nodeCoordinate[l][i].y)
                .style('fill', 'none')
                .style('stroke', 'gray')
                .style('stroke-width', 1)
                .classed('hidden', true);
        } else {
            nodeGroups.append('rect')
                .attr('class', 'output-rect')
                .attr('x', left)
                .attr('y', (d, i) => nodeCoordinate[l][i].y + nodeLength / 2 + 8)
                .attr('height', nodeLength / 4)
                .attr('width', 0)
                .style('fill', 'gray');
            nodeGroups.append('text')
                .attr('class', 'output-text')
                .attr('x', left)
                .attr('y', (d, i) => nodeCoordinate[l][i].y + nodeLength / 2)
                .style('dominant-baseline', 'middle')
                .style('font-size', '11px')
                .style('fill', 'black')
                .style('opacity', 0.5)
                .text((d, i) => classLists[i]);

            // Add annotation text to tell readers the exact output probability
            // nodeGroups.append('text')
            //   .attr('class', 'annotation-text')
            //   .attr('id', (d, i) => `output-prob-${i}`)
            //   .attr('x', left)
            //   .attr('y', (d, i) => nodeCoordinate[l][i].y + 10)
            //   .text(d => `(${d3.format('.4f')(d.output)})`);
        }
        leftAccuumulatedSpace += nodeLength;
    }


    // Draw the canvas
    debugger
    for (let l = 0; l < cnn.length; l++) {
        let range = cnnLayerRanges[selectedScaleLevel][l];
        svg.select(`g#cnn-layer-group-${l}`)
            .selectAll('image.node-image')
            .each((d, i, g) => {
                drawOutput(d, i, g, range)
            });
    }
    // svg.selectAll('g.node-output').each(
    //     (d, i, g) => {
    //       drawOutputScore(d, i, g, outputRectScale)
    //     }
    //   );

    // // Add edges between nodes
    // let linkGen = d3.linkHorizontal()
    //     .x(d => d.x)
    //     .y(d => d.y);

    // let linkData = getLinkData(nodeCoordinate, cnn);

    // let edgeGroup = cnnGroup.append('g')
    //     .attr('class', 'edge-group');

    // edgeGroup.selectAll('path.edge')
    //     .data(linkData)
    //     .enter()
    //     .append('path')
    //     .attr('class', d =>
    //         `edge edge-${d.targetLayerIndex} edge-${d.targetLayerIndex}-${d.targetNodeIndex}`)
    //     .attr('id', d =>
    //         `edge-${d.targetLayerIndex}-${d.targetNodeIndex}-${d.sourceNodeIndex}`)
    //     .attr('d', d => linkGen({ source: d.source, target: d.target }))
    //     .style('fill', 'none')
    //     .style('stroke-width', edgeStrokeWidth)
    //     .style('opacity', edgeOpacity)
    //     .style('stroke', edgeInitColor);

}

/**
 * Use bounded d3 data to draw one canvas
 * @param {object} d d3 data
 * @param {index} i d3 data index
 * @param {[object]} g d3 group
 * @param {number} range color range map (max - min)
 */
 export const drawOutput = (d, i, g, range) => {
    let image = g[i];
    let colorScale = layerColorScales[d.type];
  
    if (d.type === 'input') {
      colorScale = colorScale[d.index];
    }
  
    // Set up a second convas in order to resize image
    let imageLength = d.output.length === undefined ? 1 : d.output.length;
    let bufferCanvas = document.createElement("canvas");
    let bufferContext = bufferCanvas.getContext("2d");
    bufferCanvas.width = imageLength;
    bufferCanvas.height = imageLength;
  
    // Fill image pixel array
    let imageSingle = bufferContext.getImageData(0, 0, imageLength, imageLength);
    let imageSingleArray = imageSingle.data;
  
    if (imageLength === 1) {
      imageSingleArray[0] = d.output;
    } else {
      for (let i = 0; i < imageSingleArray.length; i += 4) {
        let pixeIndex = Math.floor(i / 4);
        let row = Math.floor(pixeIndex / imageLength);
        let column = pixeIndex % imageLength;
        let color = undefined;
        if (d.type === 'input' || d.type === 'fc') {
          color = d3.rgb(colorScale(1 - d.output[row][column]))
        } else {
          color = d3.rgb(colorScale((d.output[row][column] + range / 2) / range));
        }
  
        imageSingleArray[i] = color.r;
        imageSingleArray[i + 1] = color.g;
        imageSingleArray[i + 2] = color.b;
        imageSingleArray[i + 3] = 255;
      }
    }
  
    // canvas.toDataURL() only exports image in 96 DPI, so we can hack it to have
    // higher DPI by rescaling the image using canvas magic
    let largeCanvas = document.createElement('canvas');
    largeCanvas.width = nodeLength * 3;
    largeCanvas.height = nodeLength * 3;
    let largeCanvasContext = largeCanvas.getContext('2d');
  
    // Use drawImage to resize the original pixel array, and put the new image
    // (canvas) into corresponding canvas
    bufferContext.putImageData(imageSingle, 0, 0);
    largeCanvasContext.drawImage(bufferCanvas, 0, 0, imageLength, imageLength,
      0, 0, nodeLength * 3, nodeLength * 3);
  
    let imageDataURL = largeCanvas.toDataURL();
    d3.select(image).attr('xlink:href', imageDataURL);
  
    // Destory the buffer canvas
    bufferCanvas.remove();
    largeCanvas.remove();
  }