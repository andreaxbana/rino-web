import { features } from './svm.mjs';

// Lossless transport for the same trained weights. Blocks are selected by the
// drawing's actual feature indices, never by a question, class or lesson.
export const BLOCK_SIZE=1000;
const META_MAGIC=0x31504d5a, BLOCK_MAGIC=0x3142505a;
const viewOf=bytes=>new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
export function encodeMetadata(models){
  const bytes=new Uint8Array(8+models.length*8),view=viewOf(bytes);
  view.setUint32(0,META_MAGIC,true);view.setUint32(4,models.length,true);
  models.forEach((model,i)=>{
    if(Array.from(model.character).length!==1||!Number.isFinite(model.bias)||!Object.is(Math.fround(model.bias),model.bias))throw Error('Unsupported Zinnia metadata');
    view.setUint32(8+i*8,model.character.codePointAt(0),true);view.setFloat32(12+i*8,model.bias,true);
  });
  return bytes;
}
export function decodeMetadata(bytes){
  const view=viewOf(bytes);
  if(bytes.length<8||view.getUint32(0,true)!==META_MAGIC)throw Error('Invalid Zinnia metadata');
  const count=view.getUint32(4,true);
  if(!count||count>100000||bytes.length!==8+count*8)throw Error('Invalid Zinnia metadata size');
  const labels=[],biases=new Float32Array(count),seen=new Set();
  for(let i=0;i<count;i++){
    const codepoint=view.getUint32(8+i*8,true),bias=view.getFloat32(12+i*8,true);
    if(codepoint>0x10ffff||(codepoint>=0xd800&&codepoint<=0xdfff)||!Number.isFinite(bias)||seen.has(codepoint))throw Error('Invalid Zinnia class');
    labels.push(String.fromCodePoint(codepoint));biases[i]=bias;seen.add(codepoint);
  }
  return {labels,biases};
}
export function encodeBlock(models,id){
  const lists=models.map(model=>{
    const selected=[];
    for(let i=0;i<model.indices.length;i++)if(Math.floor(model.indices[i]/BLOCK_SIZE)===id)selected.push(i);
    return selected;
  });
  const entries=lists.reduce((sum,list)=>sum+list.length,0);
  const indexStart=16+(models.length+1)*4,weightStart=indexStart+entries*2;
  const bytes=new Uint8Array(weightStart+entries*4),view=viewOf(bytes);
  view.setUint32(0,BLOCK_MAGIC,true);view.setUint32(4,id,true);view.setUint32(8,models.length,true);view.setUint32(12,entries,true);
  let offset=0;
  for(let model=0;model<models.length;model++){
    view.setUint32(16+model*4,offset,true);
    for(const position of lists[model]){
      view.setUint16(indexStart+offset*2,models[model].indices[position]%BLOCK_SIZE,true);
      view.setFloat32(weightStart+offset*4,models[model].weights[position],true);offset++;
    }
  }
  view.setUint32(16+models.length*4,offset,true);
  return bytes;
}
export function decodeBlock(bytes,id,classCount){
  const view=viewOf(bytes);
  if(bytes.length<16||view.getUint32(0,true)!==BLOCK_MAGIC||view.getUint32(4,true)!==id||view.getUint32(8,true)!==classCount)throw Error('Invalid Zinnia feature block');
  const entries=view.getUint32(12,true),indexStart=16+(classCount+1)*4,weightStart=indexStart+entries*2;
  if(bytes.length!==weightStart+entries*4)throw Error('Invalid Zinnia feature block size');
  const offsets=new Uint32Array(classCount+1),indices=new Uint16Array(entries),weights=new Float32Array(entries);
  for(let i=0;i<=classCount;i++){
    offsets[i]=view.getUint32(16+i*4,true);
    if(offsets[i]>entries||(i&&offsets[i]<offsets[i-1]))throw Error('Invalid Zinnia block offsets');
  }
  if(offsets[0]!==0||offsets[classCount]!==entries)throw Error('Invalid Zinnia block bounds');
  for(let model=0;model<classCount;model++)for(let i=offsets[model];i<offsets[model+1];i++){
    indices[i]=view.getUint16(indexStart+i*2,true);weights[i]=view.getFloat32(weightStart+i*4,true);
    if(indices[i]>=BLOCK_SIZE||!Number.isFinite(weights[i])||(i>offsets[model]&&indices[i]<=indices[i-1]))throw Error('Invalid Zinnia block weights');
  }
  return {id,offsets,indices,weights};
}
export const featureBlocks=strokes=>[...new Set([...features(strokes).keys()].map(index=>Math.floor(index/BLOCK_SIZE)))].sort((a,b)=>a-b);
export function classifyBlocks(metadata,blocks,strokes,{width=109,height=109,limit=10}={}){
  const feature=features(strokes,width,height);
  const ordered=[...blocks].sort((a,b)=>a.id-b.id);
  const active=ordered.map(block=>{
    const values=new Float32Array(BLOCK_SIZE);
    for(const [index,value] of feature)if(Math.floor(index/BLOCK_SIZE)===block.id)values[index%BLOCK_SIZE]=value;
    return {block,values};
  });
  return metadata.labels.map((character,model)=>{
    let score=metadata.biases[model];
    // Preserve the original per-class index order and Float32 product rounding.
    // Omitted blocks contain no nonzero input features, so add exactly zero.
    for(const {block,values} of active)for(let i=block.offsets[model];i<block.offsets[model+1];i++){
      score+=Math.fround(block.weights[i]*(values[block.indices[i]]||0));
    }
    return {character,score};
  }).sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function createPackedModel(read){
  let metadata,index,initializing;
  const blocks=new Map(),pending=new Map();
  async function ready(){
    if(!initializing)initializing=(async()=>{
      const [manifest,labels]=await Promise.all([read('index.json').then(bytes=>JSON.parse(new TextDecoder().decode(bytes))),read('labels.bin.gz')]);
      const decoded=decodeMetadata(labels);
      if(manifest.version!==1||manifest.blockSize!==BLOCK_SIZE||manifest.classes!==decoded.labels.length||!Array.isArray(manifest.blocks))throw Error('Invalid Zinnia block index');
      const next=new Map();
      for(const block of manifest.blocks){
        if(!Number.isSafeInteger(block.id)||block.id<0||block.id>2000||block.path!==`block-${block.id}.bin.gz`||next.has(block.id))throw Error('Invalid Zinnia block entry');
        next.set(block.id,block.path);
      }
      index=next;metadata=decoded;
    })().catch(error=>{initializing=null;throw error;});
    await initializing;
  }
  async function prepare(strokes){
    await ready();
    await Promise.all(featureBlocks(strokes).filter(id=>index.has(id)).map(id=>{
      if(blocks.has(id))return;
      if(!pending.has(id))pending.set(id,read(index.get(id)).then(bytes=>{blocks.set(id,decodeBlock(bytes,id,metadata.labels.length));}).finally(()=>pending.delete(id)));
      return pending.get(id);
    }));
  }
  function isPrepared(strokes){return !!metadata&&featureBlocks(strokes).every(id=>!index.has(id)||blocks.has(id));}
  function classify(strokes,options){
    if(!isPrepared(strokes))throw Error('Zinnia feature blocks are not ready');
    return classifyBlocks(metadata,featureBlocks(strokes).filter(id=>index.has(id)).map(id=>blocks.get(id)),strokes,options);
  }
  return {ready,prepare,isPrepared,classify};
}
