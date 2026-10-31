// Count bytes as the consumer reads them. This also works for cached responses;
// the UI calls them loaded bytes, never an invented network percentage.
const transfers=new Map(),listeners=new Set(),active=new Set();
let consumedBytes=0,downloadedBytes=0;
const snapshot=()=>({loadedBytes:[...transfers.values()].reduce((sum,bytes)=>sum+bytes,0),downloadedBytes,
  activity:[...active].some(transfer=>transfer.source==='download')?'downloading':[...active].some(transfer=>transfer.source==='cache')?'saved':'starting'});
function notify(){const value=snapshot();for(const listener of listeners)try{listener(value);}catch{}}
export function subscribeAssetLoading(listener,{fresh=false}={}){
  const started=consumedBytes,downloadStart=downloadedBytes;
  const update=fresh?()=>listener({...snapshot(),loadedBytes:consumedBytes-started,downloadedBytes:downloadedBytes-downloadStart}):listener;
  listeners.add(update);update(snapshot());return()=>listeners.delete(update);
}
export async function fetchAsset(url){
  const key=String(url),transfer={source:null};transfers.set(key,0);active.add(transfer);notify();
  const finish=()=>{active.delete(transfer);notify();};
  try{
    const response=await fetch(url,{credentials:'same-origin'});
    if(!response.ok||!response.body)throw Error('Handwriting data could not be loaded');
    transfer.source=response.headers.get('X-Rino-Asset-Source');notify();
    const reader=response.body.getReader();
    const body=new ReadableStream({
      async pull(controller){
        try{
          const {done,value}=await reader.read();
          if(done){finish();controller.close();return;}
          consumedBytes+=value.byteLength;
          if(transfer.source==='download')downloadedBytes+=value.byteLength;
          transfers.set(key,(transfers.get(key)||0)+value.byteLength);notify();controller.enqueue(value);
        }catch(error){finish();controller.error(error);}
      },
      cancel(reason){finish();return reader.cancel(reason);}
    });
    return new Response(body,{status:response.status,headers:response.headers});
  }catch(error){finish();throw error;}
}
