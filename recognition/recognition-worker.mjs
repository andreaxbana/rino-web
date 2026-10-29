import {id,version,ready,prepareInk,isPrepared,recognize} from './offline-recognizer.mjs';
import './reference-matcher.js';
import {subscribeAssetLoading} from './asset-loader.mjs';
import {loadReferences,referencesReady} from './reference-loader.mjs';

let coreReady=false;

// The worker never receives the practice question, its answer or lesson scope.
// Every trained class and every geometrically eligible reference remains in
// contention. Only data with zero contribution for this ink is left unloaded.
self.addEventListener('message',async event=>{
  const {requestId,strokes,type}=event.data||{},preparing=type==='prepare';
  if(!Number.isSafeInteger(requestId)||(!preparing&&!Array.isArray(strokes)))return;
  let unsubscribe=()=>{},lastUpdate=0;
  try{
    if(preparing?!coreReady:!isPrepared(strokes)||!referencesReady(strokes)){
      self.postMessage({requestId,type:'progress',phase:'loading'});
      unsubscribe=subscribeAssetLoading(({loadedBytes})=>{
        const now=Date.now();
        if(loadedBytes>0&&now-lastUpdate>=200){lastUpdate=now;self.postMessage({requestId,type:'progress',phase:'loading',loadedBytes});}
      },{fresh:true});
    }
    if(preparing){await ready();coreReady=true;self.postMessage({requestId,type:'prepared'});return;}
    const [,templates]=await Promise.all([prepareInk(strokes),loadReferences(strokes)]);
    coreReady=true;
    unsubscribe();
    self.postMessage({requestId,type:'progress',phase:'checking'});
    const prediction=await recognize(strokes,{canvas:{width:109,height:109}});
    const candidate=prediction?.candidates?.[0];
    const probe=templates[candidate?.character]?candidate.character:Object.keys(templates).sort()[0];
    // Failure of the independent veto cannot silently weaken the grader.
    const baseline=globalThis.KotobaHandwriting.recognize(strokes,probe,templates);
    self.postMessage({requestId,type:'result',id,version,prediction,baseline});
  }catch{
    self.postMessage({requestId,type:'error',message:'Offline recognition could not finish'});
  }finally{unsubscribe();}
});
