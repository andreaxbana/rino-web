// Count bytes as the consumer reads them. This also works for cached responses;
// the UI calls them loaded bytes, never an invented network percentage.
const transfers=new Map(),listeners=new Set();
let consumedBytes=0;
const snapshot=()=>({loadedBytes:[...transfers.values()].reduce((sum,bytes)=>sum+bytes,0)});
function notify(){const value=snapshot();for(const listener of listeners)try{listener(value);}catch{}}
export function subscribeAssetLoading(listener,{fresh=false}={}){
  const started=consumedBytes;
  const update=fresh?()=>listener({loadedBytes:consumedBytes-started}):listener;
  listeners.add(update);update(snapshot());return()=>listeners.delete(update);
}
export async function fetchAsset(url){
  const key=String(url);transfers.set(key,0);notify();
  const response=await fetch(url,{credentials:'same-origin'});
  if(!response.ok||!response.body)throw Error('Handwriting data could not be loaded');
  const body=response.body.pipeThrough(new TransformStream({transform(chunk,controller){
    consumedBytes+=chunk.byteLength;
    transfers.set(key,(transfers.get(key)||0)+chunk.byteLength);notify();controller.enqueue(chunk);
  }}));
  return new Response(body,{status:response.status,headers:response.headers});
}
