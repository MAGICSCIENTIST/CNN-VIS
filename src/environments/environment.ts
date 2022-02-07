// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
import * as d3 from "d3";

const layerColorScales = {
  input: [d3.interpolateGreys, d3.interpolateGreys, d3.interpolateGreys],
  conv: d3.interpolateRdBu,
  relu: d3.interpolateRdBu,
  pool: d3.interpolateRdBu,
  fc: d3.interpolateGreys,
  weight: d3.interpolateBrBG,
  logit: d3.interpolateOranges,
  output: d3.interpolateRdBu
};

let nodeLength = 80;

export const environment = {
  production: false,

  nodeLength : nodeLength,
  plusSymbolRadius : nodeLength / 5,
  numLayers : 12,
  edgeOpacity : 0.8,
  edgeInitColor : 'rgb(230, 230, 230)',
  edgeHoverColor : 'rgb(130, 130, 130)',
  edgeHoverOuting : false,
  edgeStrokeWidth : 0.7,
  intermediateColor : 'gray',
  layerColorScales: layerColorScales,
  svgPaddings: {top: 25, bottom: 25, left: 50, right: 50},
  kernelRectLength: 8/3,
  gapRatio: 4,
  overlayRectOffset: 12,
  classLists: ['lifeboat', 'ladybug', 'pizza', 'bell pepper', 'school bus',
    'koala', 'espresso', 'red panda', 'orange', 'sport car']
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
