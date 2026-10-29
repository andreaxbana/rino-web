import {fetchAsset} from './asset-loader.mjs';
import {decodeReferenceTemplates} from './reference-codec.mjs';

// Candidate membership depends only on the supplied ink's stroke count. These
// are exactly the counts searched by the unchanged matcher, including a joined
// pen-lift variant. No question, lesson or chosen answer reaches this loader.
let catalog;
const shards=new Map(),windows=new Map(),readyWindows=new Set();
async function loadCatalog(){
  if(!catalog)catalog=(async()=>{
    const response=await fetchAsset(new URL('./reference-shards.json',import.meta.url));
    if(!response.ok)throw Error('Reference catalog could not be loaded');
    const data=await response.json();
    if(data?.version!==1||!Array.isArray(data.characters)||!data.characters.length||!Array.isArray(data.files))throw Error('Invalid reference catalog');
    const known=new Set(),counts=new Map();
    for(const pair of data.characters){
      if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||Array.from(pair[0]).length!==1||known.has(pair[0])||!Number.isInteger(pair[1])||pair[1]<1||pair[1]>40)throw Error('Invalid reference catalog character');
      known.add(pair[0]);counts.set(pair[1],(counts.get(pair[1])||0)+1);
    }
    const found=new Set();
    for(const file of data.files){
      if(!Number.isInteger(file.strokeCount)||found.has(file.strokeCount)||!counts.has(file.strokeCount)||file.characters!==counts.get(file.strokeCount)||file.path!==`reference/${String(file.strokeCount).padStart(2,'0')}.bin.gz`)throw Error('Invalid reference catalog file');
      found.add(file.strokeCount);
    }
    if(found.size!==counts.size)throw Error('Incomplete reference catalog');
    return data;
  })().catch(error=>{catalog=null;throw error;});
  return catalog;
}
async function loadShard(file,data){
  if(!shards.has(file.strokeCount))shards.set(file.strokeCount,(async()=>{
    const response=await fetchAsset(new URL(file.path,import.meta.url));
    if(!response.ok||!response.body)throw Error('Reference data could not be loaded');
    const packed=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    const templates=decodeReferenceTemplates(packed),expected=data.characters.filter(([,count])=>count===file.strokeCount).map(([character])=>character);
    const actual=Object.keys(templates);
    if(actual.length!==expected.length||expected.some((character,i)=>actual[i]!==character||templates[character].strokes.length!==file.strokeCount))throw Error('Reference shard does not match catalog');
    return templates;
  })().catch(error=>{shards.delete(file.strokeCount);throw error;}));
  return shards.get(file.strokeCount);
}
export async function loadReferences(strokes){
  const count=Array.isArray(strokes)?strokes.length:0;
  if(!Number.isInteger(count)||count<1||count>40)throw Error('Invalid handwriting stroke count');
  if(!windows.has(count))windows.set(count,(async()=>{
    const data=await loadCatalog();
    let files=data.files.filter(file=>Math.abs(file.strokeCount-count)<=2);
    // The matcher needs one valid reference key even when no supported count
    // can match. A smallest-count anchor preserves its ordinary abstention.
    if(!files.length)files=[data.files.reduce((smallest,file)=>file.strokeCount<smallest.strokeCount?file:smallest)];
    const loaded=await Promise.all(files.map(file=>loadShard(file,data))),merged=Object.assign({},...loaded),ordered={};
    // Keep original global insertion order: stable-sort ties must not change.
    for(const [character] of data.characters)if(merged[character])ordered[character]=merged[character];
    readyWindows.add(count);return Object.freeze(ordered);
  })().catch(error=>{windows.delete(count);readyWindows.delete(count);throw error;}));
  return windows.get(count);
}
export function referencesReady(strokes){return Array.isArray(strokes)&&readyWindows.has(strokes.length);}
