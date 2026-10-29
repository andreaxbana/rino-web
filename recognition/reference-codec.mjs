// Lossless transport for the browser's Float32 SVG samples. The matcher still
// receives the original numbers and performs the same normalization/comparisons.
const MAGIC=0x46524e52, VERSION=1, SAMPLES=41, HEADER=16;
const characterCode=character=>{
  const points=Array.from(character);
  if(points.length!==1)throw Error('Reference character must be one Unicode scalar');
  const code=character.codePointAt(0);
  if(code>=0xd800&&code<=0xdfff)throw Error('Invalid reference character');
  return code;
};

export function encodeReferenceTemplates(templates){
  const entries=Object.entries(templates||{});
  if(!entries.length)throw Error('Reference data is empty');
  let coordinates=0;
  for(const [character,entry] of entries){
    characterCode(character);
    if(!Array.isArray(entry?.strokes)||!entry.strokes.length||entry.strokes.length>40)throw Error('Invalid reference strokes');
    for(const stroke of entry.strokes){
      if(!Array.isArray(stroke)||stroke.length!==SAMPLES)throw Error('Unexpected reference sample count');
      for(const point of stroke){
        if(!Array.isArray(point)||point.length!==2||point.some(value=>!Number.isFinite(value)||Math.fround(value)!==value))throw Error('Reference coordinates must be exact Float32 values');
        coordinates+=2;
      }
    }
  }
  const dataOffset=HEADER+entries.length*6;
  const packed=new Uint8Array(dataOffset+coordinates*4),view=new DataView(packed.buffer);
  view.setUint32(0,MAGIC,true);view.setUint16(4,VERSION,true);view.setUint16(6,SAMPLES,true);
  view.setUint32(8,entries.length,true);view.setUint32(12,coordinates,true);
  const scalar=new DataView(new ArrayBuffer(4)),previous=[0,0];let offset=HEADER,index=0;
  for(const [character,entry] of entries){
    view.setUint32(offset,characterCode(character),true);view.setUint16(offset+4,entry.strokes.length,true);offset+=6;
    for(const stroke of entry.strokes)for(const point of stroke)for(const value of point){
      scalar.setFloat32(0,value,true);const word=scalar.getUint32(0,true),delta=(word^previous[index%2])>>>0;
      previous[index%2]=word;
      for(let lane=0;lane<4;lane++)packed[dataOffset+lane*coordinates+index]=(delta>>>(lane*8))&255;
      index++;
    }
  }
  return packed;
}

export function decodeReferenceTemplates(input){
  const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
  if(bytes.byteLength<HEADER)throw Error('Truncated reference data');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if(view.getUint32(0,true)!==MAGIC||view.getUint16(4,true)!==VERSION||view.getUint16(6,true)!==SAMPLES)throw Error('Unsupported reference data');
  const count=view.getUint32(8,true),coordinates=view.getUint32(12,true),dataOffset=HEADER+count*6;
  if(!count||dataOffset+coordinates*4!==bytes.byteLength)throw Error('Invalid reference data length');
  const entries=[],seen=new Set();let expected=0;
  for(let i=0;i<count;i++){
    const code=view.getUint32(HEADER+i*6,true),strokes=view.getUint16(HEADER+i*6+4,true);
    if(code>0x10ffff||(code>=0xd800&&code<=0xdfff)||!strokes||strokes>40)throw Error('Invalid reference entry');
    const character=String.fromCodePoint(code);
    if(seen.has(character))throw Error('Duplicate reference character');
    seen.add(character);entries.push([character,strokes]);expected+=strokes*SAMPLES*2;
  }
  if(expected!==coordinates)throw Error('Invalid reference coordinate count');
  const templates={},scalar=new DataView(new ArrayBuffer(4)),previous=[0,0];let index=0;
  const value=()=>{
    let delta=0;for(let lane=0;lane<4;lane++)delta|=bytes[dataOffset+lane*coordinates+index]<<(lane*8);
    const word=(delta^previous[index%2])>>>0;previous[index%2]=word;index++;
    scalar.setUint32(0,word,true);const number=scalar.getFloat32(0,true);
    if(!Number.isFinite(number))throw Error('Invalid reference coordinate');
    return number;
  };
  for(const [character,count] of entries)templates[character]={strokes:Array.from({length:count},()=>Array.from({length:SAMPLES},()=>[value(),value()]))};
  return templates;
}
