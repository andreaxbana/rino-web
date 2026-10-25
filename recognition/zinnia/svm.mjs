// JavaScript port of Zinnia's BSD-3-Clause feature extraction and linear SVM inference.
// Copyright (c) 2005-2008 Taku Kudo. See COPYING beside this file.
// Model weights are trained Tegaki data, not stroke-reference matching.
export function loadModel(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if ((view.getUint32(0, true) ^ 0xef71821) !== bytes.byteLength || view.getUint32(4,true)!==1) throw Error('Invalid Zinnia model');
  let offset=12;
  const models=[], decoder=new TextDecoder();
  for(let i=0; i<view.getUint32(8,true); i++) {
    const character=decoder.decode(bytes.subarray(offset,offset+16)).split('\0')[0]; offset+=16;
    const bias=view.getFloat32(offset,true); offset+=4;
    const indices=[], weights=[];
    while(view.getInt32(offset,true)!==-1) { indices.push(view.getInt32(offset,true));weights.push(view.getFloat32(offset+4,true));offset+=8; }
    offset+=8;
    models.push({character,bias,indices:Int32Array.from(indices),weights:Float32Array.from(weights)});
  }
  if(offset!==bytes.byteLength)throw Error('Invalid Zinnia model length');
  return models;
}
export function features(strokes,width=109,height=109) {
  const out=new Map([[0,1]]), f=Math.fround;
  const add=(i,v)=>out.set(i,f(v));
  const basic=(offset,a,b)=>{
    add(offset+1,10*Math.hypot(a[0]-b[0],a[1]-b[1]));
    add(offset+2,Math.atan2(b[1]-a[1],b[0]-a[0]));
    add(offset+3,10*(a[0]-.5));add(offset+4,10*(a[1]-.5));
    add(offset+5,10*(b[0]-.5));add(offset+6,10*(b[1]-.5));
    add(offset+7,Math.atan2(a[1]-.5,a[0]-.5));add(offset+8,Math.atan2(b[1]-.5,b[0]-.5));
    add(offset+9,10*Math.hypot(a[0]-.5,a[1]-.5));add(offset+10,10*Math.hypot(b[0]-.5,b[1]-.5));
    add(offset+11,5*(b[0]-a[0]));add(offset+12,5*(b[1]-a[1]));
  };
  const nodes=strokes.map(s=>s.map(p=>[f(p[0]/width),f(p[1]/height)]));
  nodes.forEach((stroke,sid)=>{
    const split=(first,last,id)=>{
      const a=stroke[first],b=stroke[last];
      if(id<=50)basic(sid*1000+20*id,a,b);
      if(first===last)return;
      const dx=f(b[0]-a[0]),dy=f(b[1]-a[1]),c=f(b[1]*a[0]-b[0]*a[1]);
      let max=-1,best=first;
      for(let i=first;i<last;i++){const d=Math.abs(f(dx*stroke[i][1]-dy*stroke[i][0]+c));if(d>max){max=d;best=i;}}
      if(max*max/(dx*dx+dy*dy)>.001 && best>first && best<last) {split(first,best,id*2+1);split(best,last,id*2+2);}
    };
    split(0,stroke.length-1,0);
    if(sid)basic(100000+sid*1000,nodes[sid-1].at(-1),stroke[0]);
  });
  add(2000000,nodes.length);add(2000000+nodes.length,10);
  return out;
}
const scratch = new WeakMap();
export function classify(models,strokes,{width=109,height=109,limit=10}={}) {
  const feature=features(strokes,width,height);
  let dense=scratch.get(models);
  if(!dense){dense=new Float32Array(2000051);scratch.set(models,dense);}
  dense.fill(0);for(const [index,value] of feature)dense[index]=value;
  return models.map(({character,bias,indices,weights})=>{
    let score=bias;
    for(let i=0;i<indices.length;i++)score+=Math.fround(weights[i]*(dense[indices[i]]||0));
    return {character,score};
  }).sort((a,b)=>b.score-a.score).slice(0,limit);
}
