import {id,version,ready,recognize} from './offline-recognizer.mjs';
import './reference-matcher.js';

let references;
async function loadReferences(){
  if(!references)references=(async()=>{
    const response=await fetch(new URL('./reference-templates.json.gz',import.meta.url),{credentials:'same-origin'});
    if(!response.ok||!response.body)throw Error('Reference data could not be loaded');
    const decoded=response.body.pipeThrough(new DecompressionStream('gzip'));
    const templates=await new Response(decoded).json();
    if(!templates||typeof templates!=='object'||!Object.keys(templates).length)throw Error('Reference data is empty');
    return templates;
  })().catch(error=>{references=null;throw error;});
  return references;
}

// The worker never receives the practice question, its answer or lesson scope.
// Both recognizers retain their complete independent character collections.
self.addEventListener('message',async event=>{
  const {requestId,strokes}=event.data||{};
  if(!Number.isSafeInteger(requestId)||!Array.isArray(strokes))return;
  try{
    self.postMessage({requestId,type:'progress',phase:'loading'});
    const [,templates]=await Promise.all([ready(),loadReferences()]);
    self.postMessage({requestId,type:'progress',phase:'checking'});
    const prediction=await recognize(strokes,{canvas:{width:109,height:109}});
    const candidate=prediction?.candidates?.[0];
    const probe=templates[candidate?.character]?candidate.character:Object.keys(templates).sort()[0];
    // Failure of the independent veto cannot silently weaken the grader.
    const baseline=globalThis.KotobaHandwriting.recognize(strokes,probe,templates);
    self.postMessage({requestId,type:'result',id,version,prediction,baseline});
  }catch{
    self.postMessage({requestId,type:'error',message:'Offline recognition could not finish'});
  }
});
