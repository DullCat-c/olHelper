import olMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import * as olProj from 'ol/proj';
import * as olExtent from 'ol/extent';
import WMTS from 'ol/source/WMTS';
import XYZ from 'ol/source/XYZ';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import ScaleLine from 'ol/control/ScaleLine';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Zoom from 'ol/control/Zoom';
import olSelect from 'ol/interaction/Select';
import Style from 'ol/style/Style';
import WKT from 'ol/format/WKT.js';
import { circular } from 'ol/geom/Polygon';
import { defaults as defaultInteractions } from 'ol/interaction';

//all map class collection
let mapCollection = {};


//all layer class collection
let layerCollection = {};
// make a map object though  user config or default config
interface  mapConfigType {
  mapName:string,
  targetDomId : string,
  layers:string[],
  TDKey?:string,
  view:{
    center?:[number,number],
    projection:string,
    zoom: number,
    maxZoom:number,
    minZoom:number,
  }
}

// default center is Beijing China  center point
const defaultMapConfig: mapConfigType = {
  mapName:'map',
  targetDomId:'map',
  view:{
    center:[116.3912757,39.906217],
    projection: 'EPSG:4326',
    zoom:14,
    maxZoom:22,
    minZoom:8,
  },
  layers:['preset_tiandi_vec','preset_tiandi_cva'],
}


// input tiandi key  and projection to auto generate layers
export function makePresetTDLayer(TDKey:string,projectionStr:string = 'EPSG:4326') {
  const projection = olProj.get(projectionStr);
  if(!projection){
    throw Error("This project doesn't exist, please check it")
  }else{

  }
  const projectionExtent = projection.getExtent();
  const size = olExtent.getWidth(projectionExtent) / 256;
  const resolutions = [];
  const matrixIds = [];
  for (let z = 0; z < 19; ++z) {
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = z;
  }
  // console.log(TDKey);
  let layers =  {
    preset_tiandi_vec: new TileLayer({
      type: 'baseLayer',
      title: '天地图矢量底图',
      name: 'preset_tiandi_vec',
      source: new WMTS({
        url: 'http://t{0-7}.tianditu.gov.cn/vec_c/wmts?tk=' + TDKey,
        layer: 'vec',
        style: 'default',
        matrixSet: 'c',
        format: 'tiles',
        crossOrigin: 'anonymous',
        wrapX: true,
        tileGrid: new WMTSTileGrid({
          origin: olExtent.getTopLeft(projectionExtent),
          resolutions: resolutions.slice(6, 20),
          matrixIds: matrixIds.slice(6, 20),
        }),
      }),
      visible: true,
    }),
    preset_tiandi_cva: new TileLayer({
      type: 'baseLayer',
      title: '天地图矢量注记',
      name: 'preset_tiandi_cva',
      source: new WMTS({
        url: 'http://t{0-7}.tianditu.gov.cn/cva_c/wmts?tk=' + TDKey,
        layer: 'cva',
        style: 'default',
        matrixSet: 'c',
        format: 'tiles',
        crossOrigin: 'anonymous',
        wrapX: true,
        tileGrid: new WMTSTileGrid({
          origin: olExtent.getTopLeft(projectionExtent),
          resolutions: resolutions.slice(6, 20),
          matrixIds: matrixIds.slice(6, 20),
        }),
      }),
      visible: true,
    }),
    preset_tiandi_img: new TileLayer({
      type: 'baseLayer',
      title: '天地图影像底图',
      name: 'preset_tiandi_img',
      source: new WMTS({
        url: 'http://t{0-7}.tianditu.gov.cn/img_c/wmts?tk=' + TDKey,
        layer: 'img',
        style: 'default',
        matrixSet: 'c',
        format: 'tiles',
        crossOrigin: 'anonymous',
        wrapX: true,
        tileGrid: new WMTSTileGrid({
          origin: olExtent.getTopLeft(projectionExtent),
          resolutions: resolutions.slice(6, 20),
          matrixIds: matrixIds.slice(6, 20),
        }),
      }),
      visible: false,
    }),
    preset_tiandi_cia: new TileLayer({
      type: 'baseLayer',
      title: '天地图影像注记',
      name: 'preset_tiandi_cia',
      source: new WMTS({
        url: 'http://t{0-7}.tianditu.gov.cn/cia_c/wmts?tk=' + TDKey,
        layer: 'cia',
        style: 'default',
        matrixSet: 'c',
        format: 'tiles',
        crossOrigin: 'anonymous',
        wrapX: true, // 地图缩小后，防止在一个页面出现多个一样的地图
        tileGrid: new WMTSTileGrid({
          origin: olExtent.getTopLeft(projectionExtent),
          resolutions: resolutions.slice(6, 20),
          matrixIds: matrixIds.slice(6, 20),
        }),
      }),
      maxResolution: resolutions[7],
      minResolution: resolutions[22],
      visible: false,
    }),
  }
  Object.assign(layerCollection,layers)
  return layerCollection;
}



// generate a new Map class , if you defined layers , you can via layer name to add it
export function makeMap(config: Partial<mapConfigType> = {}){
  let mapConfig:mapConfigType = Object.assign({},defaultMapConfig,config);
  let projection = olProj.get(mapConfig.view.projection)
  if(!projection){
    throw Error("This project doesn't exist, please check it")
  }else{

  }

  if(mapConfig.TDKey){
    makePresetTDLayer(mapConfig.TDKey,mapConfig.view.projection)
  }
  let layers = []
  mapConfig.layers.forEach(layer=>{
    if(layerCollection?.[layer]){
      layers.push(layerCollection[layer]);
    }else{
      console.warn(`layer ${layer} is not define`);
    }
  })

  // let a  = olProj.get(mapConfig.projection)!;
  let map = new olMap({
    target: mapConfig.targetDomId,
    view: new View({
      center: mapConfig.view.center,
      maxZoom: mapConfig.view.maxZoom,
      minZoom: mapConfig.view.minZoom,
      zoom: mapConfig.view.zoom,
      projection: olProj.get(mapConfig.view.projection)!,
    }),
    layers,
    // 设置openlayers的控制插件
    controls: [
      new ScaleLine(), // 比例尺
      new Zoom(),
    ],
    interactions: new defaultInteractions({
      doubleClickZoom: false, // 屏蔽双击放大事件
    }),
  });

  return map;
}


