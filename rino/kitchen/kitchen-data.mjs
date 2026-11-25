const things = {
    table:{id:'VO-ff161262dd',name:'table',hint:'It has legs and holds the whole breakfast.',after:'There is room for one more place.'},
    cup:{id:'VO-2da7034c1e',name:'glass',hint:'You drink from this.',after:'RiNO sets out a glass for the visitor.'},
    plate:{id:'VO-101d46a061',name:'plate',hint:'Toast sits on its blue rim.',after:'A spot on the rim catches RiNO’s eye.'},
    fridge:{id:'VO-f7a15687a1',name:'fridge',hint:'It keeps the milk cold.',after:'A little light glows behind the door.'},
    bread:{id:'VO-098e9e7e67',name:'bread',hint:'The slices have a golden crust.',after:'Two slices, one for each guest.'},
    milk:{id:'VO-797ae8d562',name:'milk',hint:'It comes in the blue carton.',after:'The milk is ready to pour.'},
    open:{id:'VO-321963ed35',name:'to open',hint:'Watch what happens to the closed door.',after:'Cold air tickles RiNO’s ear.',phrase:'冷蔵庫を開ける',meaning:'Open the fridge.'},
    wash:{id:'V0050',name:'to wash',hint:'Watch the sponge and the soap bubbles.',after:'The last spot is gone. The plate is ready.',phrase:'お皿を洗う',meaning:'Wash the plate.'}
  };
  const nouns=['table','cup','plate','fridge','bread','milk'];
  const verbs=['open','wash'];
  const guests=[
    {name:'Pip',image:'sparrow',title:'Toast for a visitor',brief:'Someone is tapping at the window. Set out toast and get a clean plate.',ending:'Pip hops onto the table. Two slices of toast, just in time.'},
    {name:'Momo',image:'kitten',title:'A voice at the door',brief:'Your visitor calls for something to drink. Listen, then find it in the kitchen.',ending:'Momo peeks around the table. RiNO has saved a place by the window.'}
  ];
  const parts=['kitchen','table-detail','fridge','fridge-open','cup','plate','bread','milk','kitten','sparrow','rino-open','rino-wash','rino-serve'];
  const files=['episode.mjs','kitchen-data.mjs','kitchen-audio.mjs','kitchen.css','credits.txt',
    ...parts.map(name=>name+'.webp'),...Object.keys(things).map(key=>key+'.wav')];
  function wordsFor(catalog){
    const source=new Map(catalog.vocabulary.map(word=>[word.id,word]));
    const words={close:{word:'閉める',reading:'しめる'},eat:{word:'食べる',reading:'たべる'}};
    for(const [key,item] of Object.entries(things)){
      const entry=source.get(item.id);
      if(!entry?.word||!entry.reading)throw new Error('Missing breakfast vocabulary '+item.id);
      words[key]={word:entry.word,reading:entry.reading};
    }
    return words;
  }
  function optionsFor(key,seed){
    // Keep each question stable between retries and visits to another tab.
    let value=seed>>>0;
    for(const letter of key)value=(Math.imul(value,31)+letter.charCodeAt(0))>>>0;
    const draw=()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
    function mix(array){
      const result=[...array];
      for(let i=result.length-1;i>0;i--){const j=Math.floor(draw()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
      return result;
    }
    const bank=verbs.includes(key)?[...verbs,'close','eat']:nouns;
    return mix([key,...mix(bank.filter(other=>other!==key)).slice(0,3)]);
  }
  function newRound(targets,variant,kind='practice'){
    const id='scene-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
    return {id,startedAt:new Date().toISOString(),kind,variant,targets:[...targets],solved:[],hinted:[],results:{},
      seed:Math.floor(Math.random()*0x7fffffff),current:kind==='review'?targets[0]:null,
      listen:kind==='practice'&&variant===1?'cup':null,choices:kind!=='review',draft:''};
  }
  function record(r,key,status,solved=false){
    if(!r.targets.includes(key)||r.solved.includes(key))return false;
    if(!r.results[key])r.results[key]={status,assisted:r.hinted.includes(key)||status==='skipped'};
    if(status==='skipped')r.results[key].assisted=true;
    if(solved)r.solved.push(key);
    return true;
  }
  function canonical(text){
    return String(text||'').normalize('NFKC').trim().toLowerCase().replace(/[ぁ-ゖ]/gu,c=>String.fromCodePoint(c.codePointAt(0)+96));
  }
  function matchesAnswer(key,answer,words){
    const word=words[key],forms=[word.word,word.reading];
    if(key==='plate')forms.push('皿','さら');
    const romaji=globalThis.RinoDictionary?.romanize?.(word.reading);
    if(romaji)forms.push(romaji);
    return !!answer.trim()&&forms.some(form=>canonical(form)===canonical(answer));
  }

export {things,nouns,verbs,guests,parts,files,wordsFor,optionsFor,newRound,record,matchesAnswer};
