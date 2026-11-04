/* Large reference parsing and searches stay off the UI thread. */
'use strict';
importScripts('dictionary-reference.js','word-forms.js','dictionary.js');
const ref=RinoDictionaryReference, api=RinoDictionary;
let source,byId,ready;
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
async function load(metadata){
  const url=new URL('reference.json.gz',self.location.href).href;
  const key=new URL('../reference-'+metadata.sha256+'.json.gz',self.location.href).href;
  let cache,response;
  try{cache=await caches.open('rino-dictionary-reference-v1');response=await cache.match(key);}catch{}
  let bytes=response?await response.arrayBuffer():null;
  if(!bytes||await hash(bytes)!==metadata.sha256){
    response=await fetch(url,{cache:'no-cache'});if(!response.ok)throw Error('Reference unavailable');
    bytes=await response.arrayBuffer();if(bytes.byteLength!==metadata.bytes||await hash(bytes)!==metadata.sha256)throw Error('Reference integrity check failed');
    try{await cache?.put(key,new Response(bytes));}catch{}
  }
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  source=JSON.parse(await new Response(stream).text());
  if(source.version!==1)throw Error('Unsupported reference version');
  byId=new Map(source.entries.map(entry=>[entry[0],entry]));
  return source.entries.length;
}
function search({query,mode,automatic,core,page=0,pageSize=8}){
  const exact=api.key(query).trim(), terms=exact.split(/\s+/).filter(Boolean), aliases=api.romajiKeys(query), candidates=new Set(api.deinflectCandidates(query));
  if(!terms.length)return {items:[],total:0,page:0};
  if(automatic&&mode==='romaji'&&source.entries.some(entry=>{const tokens=entry[3].flatMap(s=>s[1]).flatMap(g=>api.key(g).split(/[^a-z0-9]+/));return terms.every(t=>tokens.includes(t));}))return {resolvedMode:'english'};
  const included=new Set(core.map(w=>w.reference_key).filter(Boolean));
  const results=core.map(w=>({coreId:w.id,score:w.score,sort:w.word}));
  for(const entry of source.entries){
    // Reject most entries before expanding a reading or building any word forms.
    let english;
    if(mode==='english') {english=api.englishMatch({glosses:entry[3].flatMap(s=>s[1])},query);if(!english)continue;}
    for(const reading of entry[2]){
      if(included.has(ref.identity(entry[0],reading[0])))continue;
      const spellings=ref.allowedForms(entry,reading).map(f=>f[0]);
      let score=0,form,readingEnglish=english;
      if(mode==='english')score=readingEnglish.score;
      else if(mode==='romaji'){
        const keys=api.romajiKeys(api.romanize(reading[0]));
        if(!aliases.some(a=>keys.some(k=>k.includes(a))))continue;
        score=aliases.some(a=>keys.includes(a))?200:10;
      }else if(mode==='mixed'){
        const text=api.key([...spellings,reading[0],...entry[3].flatMap(s=>s[1])].join(' ')),romaji=api.romajiKeys(api.romanize(reading[0]));
        if(!terms.every(t=>text.includes(t)||api.romajiKeys(t).some(a=>romaji.some(r=>r.includes(a)))))continue;
        score=10;
      }else{
        const forms=[...spellings,reading[0]].map(api.key);
        if(terms.every(t=>forms.some(f=>f.includes(t))))score=spellings.some(f=>api.key(f)===exact)?300:api.key(reading[0])===exact?200:10;
        else if(forms.some(f=>candidates.has(f))){form=api.inflections(ref.expand(entry,reading)).find(f=>[f.text,f.reading].some(v=>api.key(v)===exact));if(form)score=190;}
        if(!score)continue;
      }
      // Apply reading / spelling restrictions before accepting an English hit.
      if(mode==='english'&&(entry[3].some(s=>s[3]?.length||s[4]?.length))){readingEnglish=api.englishMatch(ref.expand(entry,reading),query);if(!readingEnglish)continue;score=readingEnglish.score;}
      const common=entry[1].some(f=>f[2]?.some(p=>/^(ichi1|news1|spec1|gai1)$/.test(p)))||reading[4]?.some(p=>/^(ichi1|news1|spec1|gai1)$/.test(p));
      results.push({entry,reading,score:score+(common?2:0),snippet:readingEnglish?.snippet,form:form?.label,sort:spellings[0]||reading[0]});
    }
  }
  results.sort((a,b)=>b.score-a.score || a.sort.localeCompare(b.sort,'ja'));
  page=Math.min(Math.max(0,page),Math.max(0,Math.ceil(results.length/pageSize)-1));
  return {total:results.length,page,items:results.slice(page*pageSize,(page+1)*pageSize).map(result=>result.coreId?{coreId:result.coreId}:{word:{...ref.expand(result.entry,result.reading),_match:{score:result.score,snippet:result.snippet,form:result.form}}})};
}
self.onmessage=async ({data})=>{
  try{
    if(data.type==='init'){ready=load(data.reference);postMessage({type:'ready',entries:await ready});return;}
    await ready;
    if(data.type==='search')postMessage({type:'results',request:data.request,...search(data)});
    if(data.type==='entry'){
      const [,id,reading]=data.id.split(':'),entry=byId.get(id);
      const row=entry?.[2].find(r=>ref.readingId(r[0])===reading);
      postMessage({type:'entry',id:data.id,word:row?ref.expand(entry,row):null});
    }
  }catch(error){postMessage({type:'error',request:data.request,message:error.message});}
};
