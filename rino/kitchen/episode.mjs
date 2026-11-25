import {things,nouns,verbs,guests,files,wordsFor,optionsFor,newRound,record,matchesAnswer} from './kitchen-data.mjs';
import {createVoice} from './kitchen-audio.mjs';

function createEpisode({root,data,esc,get,keys,day,change,save,finish}){
    const doc=root.ownerDocument,words=wordsFor(data),base=new URL('.',import.meta.url);
    const href=name=>new URL(name,base).href;
    let seen=new Set(),exploring=null,previewVerb=null,feedback=null,focusNext=null;
    let warming=null,offline='waiting',lastRound=null;
    const voice=createVoice(words,()=>get().settings.voice,()=>message('Pronunciation is unavailable. You can still read the word.','note'));
    const style=doc.createElement('link');
    style.rel='stylesheet';style.href=href('kitchen.css');doc.head.append(style);
    const button=(label,id,val='',attrs='',cls='')=>`<button type="button" class="game-button ${cls}" data-action="game-scene-${id}" data-value="${esc(val)}" ${attrs}>${label}</button>`;
    const image=(name,attrs='')=>`<img src="${esc(href(name+'.webp'))}" alt="" draggable="false" ${attrs}>`;
    const wordMarkup=key=>{
      const w=words[key];
      return /[\u3400-\u9fff]/u.test(w.word)?`<ruby lang="ja">${esc(w.word)}<rt>${esc(w.reading)}</rt></ruby>`:`<span lang="ja">${esc(w.word)}</span>`;
    };
    const sound=good=>{try{globalThis.RinoSounds?.play(good?'correct':'incorrect');}catch{}};
    const due=()=>keys.filter(key=>get().due[key]&&get().due[key]<=day());
    function message(text,type='note'){
      feedback={text,type};
      const el=root.querySelector('.bk-feedback');
      if(el){el.className='bk-feedback '+type;el.textContent=text;}
    }
    function stop(){voice.stop();}
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop();});
    function offlineStatus(){
      const el=root.querySelector('[data-breakfast-offline]');
      if(!el)return;
      const text={ready:'Kitchen saved offline',saving:'Saving kitchen for offline play…',waiting:'',failed:'Offline download incomplete.'};
      el.innerHTML=esc(text[offline])+(offline==='failed'?' '+button('Retry download','download'):'');
    }
    async function warm(){
      if(warming||!navigator.serviceWorker?.controller)return;
      offline='saving';offlineStatus();
      warming=(async()=>{
        const queue=[...files];
        await Promise.all(Array.from({length:3},async()=>{
          while(queue.length){
            const url=href(queue.shift()),response=await fetch(url);
            if(!response.ok)throw Error('Unavailable asset');
            await response.arrayBuffer();
            if(!response.headers.has('X-Rino-Asset-Sha256')||!await caches.match(url))throw Error('Asset not saved');
          }
        }));
      })();
      try{await warming;offline='ready';}catch{offline='failed';}finally{warming=null;offlineStatus();}
    }
    if(navigator.serviceWorker){
      navigator.serviceWorker.addEventListener('controllerchange',()=>void warm());
      void warm();
    }
    const statusHTML=()=>`<div class="bk-feedback ${feedback?.type||''}" aria-live="polite" role="status">${esc(feedback?.text||'')}</div>`;
    function context(){
      const s=get(),r=s.stage==='result'?s.history.find(r=>r.id===s.resultId):s.session;
      return {s,r,guest:guests[r?.variant??s.totals.sessions%2],won:s.stage==='result'&&r?.kind==='practice'&&r.solved.length===r.targets.length};
    }
    function board({s,r,guest,won}){
      const exploration=s.stage==='setup',play=s.stage==='session',review=play&&r.kind==='review';
      const labels=exploration?seen:new Set(r?.solved||[]);
      const active=exploration?(previewVerb||exploring):play?(r.listen?null:r.current):null;
      const verb=verbs.includes(active)?active:null;
      const moved=key=>!exploration&&labels.has(key);
      const display=r?.kind==='review'?'recall':r?.variant===1?'milk':'toast';
      function prop(key){
        const pinned=labels.has(key);
        const interactive=exploration||play&&(!review||r.current===key);
        const classes=['bk-prop','bk-'+key,pinned?'pinned':'',active===key?'target':'',moved(key)?'placed':'',play&&active===key&&pinned?'just-placed':''].join(' ');
        const id=key==='fridge'&&(verb==='open'||exploring==='fridge'&&exploration||play&&r.current==='fridge'||moved('open'))?'fridge-open':key;
        const artwork=key==='table'?'':key==='fridge'&&verb==='open'?image('fridge','class="bk-door-shut"')+image('fridge-open','class="bk-door-open"'):image(id);
        const tag=pinned?`<span class="bk-label" lang="ja">${esc(words[key].word)}</span>`:'';
        return `<button type="button" class="${classes}" data-action="game-scene-object" data-value="${key}" aria-label="${esc(things[key].name)}" ${interactive?'':'disabled'}>${artwork}${tag}<i class="bk-marker" aria-hidden="true"></i></button>`;
      }
      const actorLabel=verb?'Replay the movement':'Watch RiNO move';
      const host=won?'rino-serve':verb==='wash'?'rino-wash':'rino-open';
      const actor=`<button type="button" class="bk-host ${verb?'acting-'+verb:''}" data-action="game-scene-move" aria-label="${actorLabel}" ${play||exploration?'':'disabled'}>${image(host)}<span class="bk-motion-mark" aria-hidden="true">▶</span></button>`;
      const verbLabels=verbs.filter(key=>labels.has(key)).map(key=>`<span class="bk-verb-pin pin-${key}" lang="ja">${esc(words[key].word)}</span>`).join('');
      return `<div class="bk-board ${won?'served':''} ${verb?'show-'+verb:''}" data-breakfast-board data-visit="${display}" role="group" aria-label="Interactive breakfast kitchen">
        ${image('kitchen','class="bk-room"')}${nouns.map(prop).join('')}${actor}${verbLabels}
        ${won?`<div class="bk-guest">${image(guest.image)}</div>`:''}
      </div>`;
    }
    function listenButton(key,label='Listen again'){
      return button(label,'hear',key,get().settings.voice?'':'disabled');
    }
    function explorePanel(){
      const key=previewVerb||exploring,weak=due();
      const detailArt=key==='table'?'table-detail':key==='open'?'fridge-open':key==='wash'?'rino-wash':key||'rino-serve';
      const details=key?`<div class="bk-word">${wordMarkup(key)}</div><p>${esc(things[key].name)}${verbs.includes(key)?` · <span lang="ja">${things[key].phrase}</span>`:''}</p>`:
        '<h2>Explore the kitchen</h2><p>Touch an object to learn its name. Touch RiNO to watch a movement.</p>';
      const act=exploring==='plate'?'wash':exploring==='fridge'?'open':null;
      return `<div class="bk-discovery"><div class="bk-detail-art" aria-hidden="true">${image(detailArt)}</div><div class="bk-study">${details}</div></div><div class="bk-controls">${key?listenButton(key):''}
        ${act?button('Watch the action','explore-verb',act):''}</div>
        ${statusHTML()}<div class="bk-bottom"><span class="bk-count">${[...seen].filter(k=>nouns.includes(k)).length} / 6 objects discovered</span>
        ${button('Set the table','start','','','game-primary')}${weak.length?button('Recall '+weak.length+' due '+(weak.length===1?'word':'words'),'due'):''}</div>`;
    }
    function takeAnswer(r,key,correct,reveal=false){
      if(!key||r.solved.includes(key))return;
      record(r,key,reveal?'skipped':correct?'correct':'incorrect',correct||reveal);
      if(reveal||correct){
        r.listen=null;r.current=key;r.draft='';
        feedback={type:reveal?'note':'success',text:(reveal?'Shown · ':'✓ Correct · ')+things[key].after};
        if(!reveal)sound(true);
        voice.play(key,reveal?0:480);
        focusNext=r.solved.length===r.targets.length?'serve':r.kind==='review'?'next':null;
      }else{
        feedback={type:'error',text:r.listen?'✕ Try another object. Listen to the request again.':'✕ Try again. You can ask for a clue.'};sound(false);
      }
      change();
    }
    function chooseTarget(r,key){
      if(r.solved.includes(key)){voice.play(key);return;}
      r.current=key;r.draft='';r.choices=r.kind!=='review';
      feedback=null;focusNext=r.kind==='review'?'input':'answer';
      voice.stop();change();
    }
    function choiceButtons(r,key,locked=false){
      return '<div class="bk-answers" role="group" aria-label="Choose a Japanese word">'+optionsFor(key,r.seed).map(value=>
        button(wordMarkup(value),'answer',value,locked?'disabled':'',locked&&value===key?'bk-correct-choice':'')).join('')+'</div>';
    }
    function question(r){
      const key=r.listen||r.current;
      if(r.solved.length===r.targets.length){
        return `<div class="bk-study"><h2>${r.kind==='review'?'Recall complete':'Breakfast is ready'}</h2><p>${r.kind==='review'?'Your words are ready to review.':'The second place is set. Who is at the door?'}</p></div>${statusHTML()}<div class="bk-bottom">${button(r.kind==='review'?'See results':'Welcome your guest','serve','','','game-primary')}</div>`;
      }
      if(r.listen){
        return `<div class="bk-study"><h2>What did the guest ask for?</h2><p>Listen, then touch the matching object in the kitchen.</p>
          <div class="bk-controls">${listenButton(key,'Play request')}${button('Read request','transcript',key)}</div></div>${statusHTML()}
          <div class="bk-bottom">${button('Clue','hint',key)}${button('Show me','show',key)}</div>`;
      }
      if(key&&r.solved.includes(key)&&r.kind!=='review'){
        return `<div class="bk-study"><h2>${wordMarkup(key)}</h2><p>${esc(things[key].name)}</p></div>
          ${choiceButtons(r,key,true)}${statusHTML()}<div class="bk-bottom">${listenButton(key)}${verbs.some(k=>!r.solved.includes(k))?button('Watch RiNO move','move'):''}
          <span class="bk-count">Touch another object to name it.</span></div>`;
      }
      if(!key||r.solved.includes(key)){
        const remaining=verbs.filter(k=>r.targets.includes(k)&&!r.solved.includes(k));
        return `<div class="bk-study"><h2>${key?wordMarkup(key):'Set a second place'}</h2><p>${key?esc(things[key].name):esc(guests[r.variant].brief)+' Touch an object to begin.'}</p>
          <div class="bk-controls">${key?listenButton(key):''}</div></div>${statusHTML()}<div class="bk-bottom">
          ${r.kind==='review'?button('Next word','next','','','game-primary'):
            `${remaining.length?button('Watch RiNO move','move','','','game-primary'):''}<span class="bk-count">Touch another object to name it.</span>`}</div>`;
      }
      const verb=verbs.includes(key);
      let answers;
      if(r.kind==='review'&&!r.choices){
        answers=`<label class="bk-recall-label" for="bk-answer">Say the word, or type it here</label>
          <input id="bk-answer" class="bk-input" value="${esc(r.draft)}" maxlength="100" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ja">
          <div class="bk-controls">${button('Check word','type',key,'','game-primary')}${button('Show four choices','choices',key)}</div>`;
      }else{
        answers=choiceButtons(r,key);
      }
      return `<div class="bk-study"><h2>${verb?'What did RiNO do?':r.kind==='review'?'Can you recall its name?':'What is this called?'}</h2>
        <p>${verb?'Watch the movement and name the action.':'Look at the highlighted object.'}</p></div>${answers}
        ${statusHTML()}<div class="bk-bottom">${verb?button('Replay motion','move'):''}${button('Clue','hint',key)}${button('Show me','show',key)}</div>`;
    }
    function resultPanel(r,guest,won){
      const records=Object.values(r.results),correct=records.filter(a=>a.status==='correct').length;
      const weak=r.targets.filter(key=>r.results[key]&&(r.results[key].status!=='correct'||r.results[key].assisted));
      return `<div class="bk-study"><h2>${won&&r.kind==='practice'?'Meet '+guest.name:r.kind==='review'?'Words recalled':'Round saved'}</h2>
        <p>${won&&r.kind==='practice'?esc(guest.ending):'Your first answers are in Game progress.'}</p></div>
        <strong>${records.length?correct+' / '+records.length+' first answers correct':'No answers recorded'}</strong>
        <ul class="bk-results">${r.targets.filter(key=>r.results[key]).map(key=>{
          const a=r.results[key],label=a.status==='skipped'?'Shown':a.status==='incorrect'?'Try again':a.assisted?'Correct with help':'Correct';
          return `<li>${button(wordMarkup(key),'hear',key,`aria-label="Listen to ${esc(words[key].word)}"`)}<span>${label}${a.status==='incorrect'&&a.assisted?' · clue used':''}</span></li>`;
        }).join('')}</ul><div class="bk-bottom">${button('Another breakfast','start','','','game-primary')}
        ${weak.length?button('Recall these '+weak.length,'retry'):''}${button('Explore kitchen','setup')}</div>`;
    }
    function render(){
      const ctx=context(),{s,r,guest}=ctx;
      if(lastRound!==(r?.id||null)){feedback=null;lastRound=r?.id||null;}
      const exploring=s.stage==='setup';
      const line=exploring?'Someone is at the door. Make room for breakfast.':
        s.stage==='result'?'A place for two':r.kind==='review'?'Recall the words you met in the kitchen.':guest.title;
      return `<header class="bk-header"><div><h1 id="game-title" tabindex="-1">${s.stage==='result'?'Breakfast results':'A place for two'}</h1><p>${esc(line)}</p></div>
        <div class="bk-controls">${button(s.settings.voice?'Voice on':'Voice off','voice','',`aria-pressed="${s.settings.voice}"`)}
        ${s.stage==='session'?button('Finish round','end'):''}</div></header>
        <div class="bk-layout">${board(ctx)}<section class="bk-panel" aria-label="Kitchen activity">
        ${s.stage==='session'?`<div class="bk-progress"><span>${r.kind==='review'?'Words recalled':'Breakfast prepared'}</span><b>${r.solved.length} / ${r.targets.length}</b></div><progress max="${r.targets.length}" value="${r.solved.length}" aria-label="Episode progress"></progress>`:''}
        ${exploring?explorePanel():s.stage==='result'?resultPanel(r,guest,ctx.won):question(r)}</section></div>
        <footer class="bk-footer"><span data-breakfast-offline></span><a href="${esc(href('credits.txt'))}" target="_blank" rel="noopener">Audio credits</a></footer>`;
    }
    function start(targets,review=false){
      if(!targets?.length||get().session)return;
      const s=get(),previous=s.history.findLast(round=>round.kind==='practice');
      const variant=previous?1-previous.variant:0,r=newRound(targets,variant,review?'review':'practice');
      s.session=r;s.stage='session';s.resultId=null;feedback=null;exploring=null;previewVerb=null;
      if(r.listen)voice.play(r.listen);
      else voice.stop();
      focusNext=review?'input':null;change();
    }
    function handle(action,value){
      if(!action.startsWith('game-scene-'))return false;
      voice.unlock();
      const cmd=action.slice('game-scene-'.length),{s,r}=context(),exploration=s.stage==='setup',play=s.stage==='session';
      if(cmd==='voice'){
        s.settings.voice=!s.settings.voice;if(!s.settings.voice)stop();change();return true;
      }
      if(cmd==='download'){void warm();return true;}
      if(cmd==='hear'){if(keys.includes(value))voice.play(value);return true;}
      if(cmd==='start'){if(!play)start(keys);return true;}
      if(cmd==='due'&&exploration){start(due(),true);return true;}
      if(cmd==='retry'&&s.stage==='result'){start(r.targets.filter(k=>r.results[k]&&(r.results[k].status!=='correct'||r.results[k].assisted)),true);return true;}
      if(cmd==='setup'&&!play){s.stage='setup';s.resultId=null;seen=new Set();exploring=null;previewVerb=null;feedback=null;stop();change();return true;}
      if(cmd==='end'&&play){stop();finish();return true;}
      if(cmd==='serve'&&play&&r.solved.length===r.targets.length){stop();finish();return true;}
      if(exploration){
        if(cmd==='object'&&nouns.includes(value)){
          exploring=value;previewVerb=null;seen.add(value);feedback=null;voice.play(value);change();
        }else if(cmd==='explore-verb'||cmd==='move'){
          const key=cmd==='move'?(previewVerb==='open'?'wash':'open'):value;
          if(verbs.includes(key)){previewVerb=key;exploring=key==='wash'?'plate':'fridge';seen.add(key);feedback=null;voice.play(key);change();}
        }
        return true;
      }
      if(!play)return true;
      const key=r.listen||r.current;
      if(cmd==='transcript'&&r.listen){message(words[key].word+' · Touch the matching object.');return true;}
      if(cmd==='object'&&nouns.includes(value)){
        if(r.listen)takeAnswer(r,key,value===key);
        else if(r.kind!=='review'&&r.targets.includes(value))chooseTarget(r,value);
        return true;
      }
      if(cmd==='next'&&r.kind==='review'&&r.solved.includes(r.current)){
        const next=r.targets.find(k=>!r.solved.includes(k));if(next)chooseTarget(r,next);
        return true;
      }
      if(cmd==='move'&&!r.listen){
        const next=verbs.includes(r.current)&&!r.solved.includes(r.current)?r.current:verbs.find(k=>r.targets.includes(k)&&!r.solved.includes(k));
        if(next&&(r.kind!=='review'||next===r.current))chooseTarget(r,next);return true;
      }
      if(!key||r.solved.includes(key))return true;
      if(cmd==='hint'){
        if(!r.hinted.includes(key))r.hinted.push(key);
        if(r.results[key])r.results[key].assisted=true;
        feedback={text:things[key].hint,type:'note'};change();
      }else if(cmd==='show')takeAnswer(r,key,false,true);
      else if(cmd==='choices'&&r.kind==='review'){
        r.choices=true;if(!r.hinted.includes(key))r.hinted.push(key);if(r.results[key])r.results[key].assisted=true;
        focusNext='answer';change();
      }else if(cmd==='answer'&&!r.listen&&r.choices&&optionsFor(key,r.seed).includes(value))takeAnswer(r,key,value===key);
      else if(cmd==='type'&&r.kind==='review'&&!r.choices){
        const answer=root.querySelector('#bk-answer')?.value||'';
        if(answer.trim())takeAnswer(r,key,matchesAnswer(key,answer,words));
        else message('Type a word or show the four choices.');
      }
      return true;
    }
    function mount(){
      offlineStatus();
      const field=root.querySelector('#bk-answer'),r=get().session;
      if(field&&r){
        field.oninput=()=>{r.draft=field.value.slice(0,100);save();};
        field.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing&&e.keyCode!==229){e.preventDefault();handle('game-scene-type',r.current);}};
      }
      if(focusNext){
        const focus=focusNext;focusNext=null;
        // Opening the phone keyboard is an explicit tap on the recall field.
        if(focus!=='input')root.querySelector('[data-action="game-scene-'+focus+'"]')?.focus({preventScroll:true});
      }
    }
    return {render,mount,handle,stop,typing:()=>doc.activeElement?.id==='bk-answer'};
  }

export {createEpisode};
