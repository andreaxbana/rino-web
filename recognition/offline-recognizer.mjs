import { raster } from './raster.mjs';
import { loadModel, classify } from './zinnia/svm.mjs';
import { decide } from './decision.mjs';
import { joinContinuousStrokes } from './stroke-continuity.mjs';
import { fetchAsset } from './asset-loader.mjs';

export const id='kotoba-offline-trained-ensemble';
export const version='1.1.1';
export const offline=true;
const runtimeUrl=new URL('./runtime/ort.wasm.min.mjs',import.meta.url);
let initialization;
async function bytes(path) {
  const url=new URL(path,import.meta.url);
  // The Node branch exists only for local reproducible QA; browser assets are same-origin.
  if(url.protocol==='file:'&&typeof process!=='undefined'&&process.versions?.node) {
    const fs=await import('node:fs/promises');return new Uint8Array(await fs.readFile(url));
  }
  if(url.origin!==new URL(import.meta.url).origin)throw Error('Recognition assets must remain local');
  const response=await fetchAsset(url);
  if(!response.ok)throw Error('The offline handwriting model could not be loaded');
  return new Uint8Array(await response.arrayBuffer());
}
const json=async path=>JSON.parse(new TextDecoder().decode(await bytes(path)));
async function initialize() {
  const imported=await import(runtimeUrl.href);
  const ort=imported.default||imported;
  if(!ort?.InferenceSession)throw Error('Offline inference runtime is unavailable');
  ort.env.wasm.numThreads=1;
  ort.env.wasm.wasmPaths=new URL('./runtime/',import.meta.url).href;
  const [kd,dk,z,kLabels,dLabels,counts,referenceCounts]=await Promise.all([
    bytes('./kanjidnn/KanjiDNN_v3.onnx'),bytes('./dakanji/char_classifier.onnx'),
    bytes('./zinnia/tegaki-zinnia-japanese-0.3/handwriting-ja.model'),
    json('./kanjidnn/KanjiDNN_v3_classes.json'),bytes('./dakanji/char_classifier_labels.txt'),json('./zinnia/stroke-counts.json'),json('./reference-stroke-counts.json')
  ]);
  const k=await ort.InferenceSession.create(kd,{executionProviders:['wasm']});
  const d=await ort.InferenceSession.create(dk,{executionProviders:['wasm']});
  return {ort,k,d,z:loadModel(z),kLabels,dLabels:Array.from(new TextDecoder().decode(dLabels).trim()),counts:{...counts,...referenceCounts.characters},classSets:{kanjidnn:new Set(kLabels)}};
}
export async function ready() {
  if(!initialization)initialization=initialize().catch(error=>{initialization=null;throw error;});
  await initialization;
}
function validStrokes(input,canvas) {
  if(!Array.isArray(input)||!input.length||input.length>40)return null;
  let points=0;
  for(const s of input){
    if(!Array.isArray(s)||s.length<2||s.length>10000)return null;
    for(const p of s){if(!Array.isArray(p)||p.length!==2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||p.some(v=>v<0||v>canvas))return null;points++;}
  }
  if(points>40000)return null;
  return input.map(s=>s.map(p=>[p[0]*109/canvas,p[1]*109/canvas]));
}
function rank(values,labels) {
  return Array.from(values,(score,index)=>({character:labels[index],score})).sort((a,b)=>b.score-a.score).slice(0,10);
}
// No target argument exists: classification is independent of the practice question.
export async function recognize(input,{canvas=109}={}) {
  const start=performance.now();
  const width=typeof canvas==='number'?canvas:canvas?.width;
  if(!Number.isFinite(width)||width<=0)return {candidates:[],decision:'uncertain',reason:'invalid-input'};
  const strokes=validStrokes(input,width);
  if(!strokes?.length)return {candidates:[],decision:'uncertain',reason:'invalid-input'};
  const points=strokes.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  if(span<2)return {candidates:[],decision:'uncertain',reason:'not-enough-ink'};
  // A tap or tiny retraced speck cannot stand in for a missing stroke while
  // manufacturing the model's required stroke count. Compare with this ink's
  // size, not a fixed canvas distance, so small handwriting and real dots stay
  // usable. This agrees with the reference matcher's 0.8% minimum-ink guard;
  // extent also rejects repeated motion inside one negligible speck.
  if(strokes.some(stroke=>{
    const x=stroke.map(p=>p[0]),y=stroke.map(p=>p[1]);
    return Math.max(Math.max(...x)-Math.min(...x),Math.max(...y)-Math.min(...y))<span*.008;
  }))return {candidates:[],decision:'uncertain',reason:'insufficient-stroke-extent'};
  await ready();
  const {ort,k,d,z,kLabels,dLabels,counts,classSets}=await initialization;
  const tensor=new ort.Tensor('float32',raster(strokes),[1,1,64,64]);
  const kr=await k.run({[k.inputNames[0]]:tensor}),dr=await d.run({[d.inputNames[0]]:tensor});
  const logits=kr[k.outputNames[0]].data,max=Math.max(...logits);
  const exp=Array.from(logits,x=>Math.exp(x-max)),sum=exp.reduce((a,b)=>a+b,0);
  const continuous=joinContinuousStrokes(strokes);
  const evidence={kanjidnn:rank(exp.map(x=>x/sum),kLabels),dakanji:rank(dr[d.outputNames[0]].data,dLabels),zinnia:classify(z,continuous,{limit:10})};
  if(continuous.length!==strokes.length)evidence.zinniaRaw=classify(z,strokes,{limit:10});
  const decision=decide(evidence,continuous.length,counts,classSets,continuous);
  return {id,version,offline,...decision,candidates:evidence[decision.selectedModel],evidence,
    segmentation:{submitted:strokes.length,continuous:continuous.length},
    scoreMeaning:decision.selectedModel==='zinnia'?'uncalibrated-svm-margin':'uncalibrated-softmax',
    latencyMs:performance.now()-start};
}
export default {id,version,offline,ready,recognize};
if(typeof window!=='undefined')window.KotobaOfflineRecognizer={id,version,offline,ready,recognize};
