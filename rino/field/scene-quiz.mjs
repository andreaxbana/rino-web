import {actionAt,actions,atlasKeys,files as fieldFiles,imageFile,kitchen,locationOf,matchesAnswer,narrative,newRound,nextTargets,objects,optionsFor,places,record,roomOf,roomsFor,roundLimit,vocabulary,wordsFor} from './field-data.mjs';
import {drawHouse} from './field-board.mjs';
import {createVoice} from '../kitchen/kitchen-audio.mjs';

export const files=['scene-quiz.mjs','scene-quiz.css',...fieldFiles.filter(file=>file!=='field-game.mjs')];

export function createEpisode({root,data,esc,get,stories,trackOf,quizTargets,day,change,save,render:repaint,finish}){
  const doc=root.ownerDocument,words=wordsFor(data),base=new URL('.',import.meta.url);
  const url=name=>new URL(name,base).href;
  const image=(name,attributes='')=>'<img src="'+esc(url(imageFile(name)))+'" alt="" draggable="false" '+attributes+'>';
  const button=(label,cmd,value='',attrs='',cls='',normal=true)=>'<button type="button" data-action="game-scene-'+cmd+'" data-value="'+esc(value)+'" class="'+(normal?'game-button ':'')+cls+'" '+attrs+'>'+label+'</button>';
  const ui={esc,image,button,words},seen=new Set();
  let exploring=null,mapOpen=false,bankOpen=false,feedback=null,focus=null,lastView=null,arriving=false;
  let warming=null,offline='waiting',checkedUpdate=false;
  const voice=createVoice(words,()=>get().settings.voice,()=>message('Pronunciation is unavailable on this device.'));
  function stop(){voice.stop();}
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop();});
  for(const file of [kitchen+'kitchen-v2.css','../house/house.css','field.css','scene-quiz.css']){
    const link=doc.createElement('link');link.rel='stylesheet';link.href=url(file);doc.head.append(link);
  }
  function offlineStatus(){
    const el=root.querySelector('[data-house-offline]');if(!el)return;
    const notes={waiting:'',saving:'Saving the stories for offline play…',ready:'Stories saved offline',updating:'Reopen RiNO to save the updated stories offline.',failed:'Story download incomplete.'};
    el.innerHTML=notes[offline]+(offline==='failed'?' '+button('Retry download','download'):'');
  }
  async function warm(){
    if(warming||!globalThis.navigator?.serviceWorker?.controller)return;
    const controller=navigator.serviceWorker.controller,queue=files.slice();
    offline='saving';offlineStatus();
    warming=(async()=>{
      const statuses=await Promise.all(Array.from({length:3},async()=>{
        while(queue.length){
          const path=url(queue.shift()),response=await fetch(path);
          if(!response.ok)throw Error('Asset unavailable');
          await response.arrayBuffer();
          if(!response.headers.has('X-Rino-Asset-Sha256'))return 'updating';
          if(!await caches.match(path))throw Error('Asset not cached');
        }
      }));
      offline=statuses.includes('updating')?'updating':'ready';
      if(offline==='updating'&&!checkedUpdate){
        checkedUpdate=true;
        try{const registration=await navigator.serviceWorker.getRegistration();if(registration&&!registration.waiting)await registration.update();}catch{}
      }
    })();
    try{await warming;}catch{offline='failed';}finally{warming=null;offlineStatus();}
    if(controller!==navigator.serviceWorker.controller)void warm();
  }
  if(globalThis.navigator?.serviceWorker){navigator.serviceWorker.addEventListener('controllerchange',()=>void warm());void warm();}

  function context(){
    const s=get(),r=s.stage==='result'?s.history.find(row=>row.id===s.resultId):s.session;
    const story=(r?r.story:s.settings.story)||'breakfast',definition=stories[story];
    const track=r?trackOf(r.targets):s.settings.track;
    const freeQuiz=r?.activity==='quiz'&&r.kind==='practice';
    const won=s.stage==='result'&&!freeQuiz&&r?.kind==='practice'&&r.solved.length===r.targets.length&&(!r.story||r.delivered);
    const savedPlace=won?definition.end:(r?r.place:s.settings.place);
    const place=places[savedPlace]&&roomsFor(story).includes(roomOf(savedPlace))?savedPlace:definition.home;
    return {s,r,story,definition,track,place,won,freeQuiz,exploring,discovered:seen,mapOpen,arriving};
  }
  function markup(key){
    const w=words[key];
    return /[\u3400-\u9fff]/u.test(w.word)?'<ruby lang="ja">'+esc(w.word)+'<rt>'+esc(w.reading)+'</rt></ruby>':'<span lang="ja">'+esc(w.word)+'</span>';
  }
  function thumbnail(key){
    const slot=atlasKeys.indexOf(key),cols=10,rows=Math.ceil(atlasKeys.length/cols);
    return '<span aria-hidden="true" class="fs-thumb" style="background-size:'+cols*100+'% '+rows*100+'%;background-position:'+(slot%cols)*100/(cols-1)+'% '+Math.floor(slot/cols)*100/(rows-1)+'%"></span>';
  }
  function message(text,type='note'){
    feedback={text,type};
    const el=root.querySelector('.bk-feedback');
    if(el){el.className='bk-feedback '+type;el.textContent=text;}
  }
  const status=()=>'<div class="bk-feedback '+(feedback?.type||'')+'" role="status" aria-live="polite">'+esc(feedback?.text||'')+'</div>';
  const listen=(key,title='Listen again')=>button(title,'hear',key,get().settings.voice?'':'disabled');
  const trackName=track=>({nouns:'Nouns',verbs:'Verbs',mixed:'Nouns and verbs'})[track];
  function due(ctx){return ctx.definition[ctx.track].filter(key=>ctx.s.due[key]&&ctx.s.due[key]<=day());}
  function trackButtons(track){
    return '<div class="bk-track-picker" role="group" aria-label="Vocabulary mode">'+['nouns','verbs'].map(k=>button(trackName(k),'track',k,'aria-pressed="'+(track===k)+'"')).join('')+'</div>';
  }
  function activityPicker(quiz){
    return '<div class="bk-track-picker fs-activity-picker" role="group" aria-label="Scene activity">'+
      button('Explore','explore','','aria-pressed="'+!quiz+'"')+button('Quiz me','quiz','','aria-pressed="'+quiz+'"')+'</div>';
  }
  function storyButtons(current){
    const shortTitles={breakfast:'Breakfast',rain:'Rainy day',letter:'Momo’s letter',school:'School',shore:'Seaside',trail:'Woodland'};
    return '<div class="hs-stories" role="group" aria-label="Choose a story">'+Object.entries(stories).map(([id,def])=>
      button(image(narrative[id].art)+'<span class="hs-full-title">'+esc(def.title)+'</span><span class="hs-short-title">'+shortTitles[id]+'</span>','story',id,'aria-label="'+esc(def.title)+'" aria-pressed="'+(current===id)+'"','hs-story')).join('')+'</div>';
  }
  function wordBank(ctx){
    const {track,definition}=ctx,pool=definition[track],limit=Math.min(roundLimit(track),pool.length);
    const toggle=button('<b>Word list · '+pool.length+' '+track+'</b><span>'+limit+' per round <i aria-hidden="true">'+(bankOpen?'▴':'▾')+'</i></span>',
      'word-list','','aria-expanded="'+bankOpen+'" aria-controls="fs-words"','fs-bank-toggle');
    const items=bankOpen?pool.map(key=>button(thumbnail(key)+'<span>'+markup(key)+'<small>'+esc(vocabulary[key].name)+'</small></span>',
      'study-word',key,'aria-label="Explore '+esc(vocabulary[key].name)+'"','fs-word')).join(''):'';
    return '<div class="fs-bank">'+toggle+'<div id="fs-words" class="fs-bank-grid"'+(bankOpen?'':' hidden')+'>'+items+'</div></div>';
  }
  function setupPanel(ctx){
    const {story,definition,track}=ctx,verbs=track==='verbs',key=exploring,entry=vocabulary[key];
    const action=key&&Object.hasOwn(actions,key)?actionAt(key,story):null;
    const details=entry?'<div class="bk-word">'+markup(key)+'</div><p>'+esc(entry.name)+'</p>'+
      (action?'<p><span lang="ja">'+esc(action.phrase||entry.phrase)+'</span> · '+esc(action.meaning||entry.meaning)+'</p>':''):
      '<h2>'+(verbs?'Watch RiNO':'Explore the scene')+'</h2><p>'+(verbs?'Tap a play marker to watch an action.':'Tap an object to hear its Japanese name.')+' Use + for a closer look.</p>';
    const count=definition[track].filter(k=>seen.has(k)).length,waiting=due(ctx);
    const card=entry?wordCard(key,details):'<div class="bk-discovery"><div class="bk-detail-art">'+image(narrative[story].art)+'</div><div class="bk-study">'+details+'</div></div>';
    return card+(entry?'<div class="bk-controls">'+listen(key)+button(verbs?'Quiz this action':'Quiz this object','quiz')+'</div>':'')+status()+
      '<div class="bk-bottom"><span class="bk-count">'+count+' / '+definition[track].length+(verbs?' story actions watched':' story objects found')+'</span>'+
      (waiting.length?button('Recall '+waiting.length+' due','due'):'')+'</div>';
  }
  function wordCard(key,details){
    return '<div class="fs-word-card">'+thumbnail(key)+'<div class="bk-study">'+details+'</div></div>';
  }
  function choices(r,key){
    const definition=stories[r.story||'breakfast'];
    const track=Object.hasOwn(actions,key)?'verbs':'nouns';
    return optionsFor(key,r.seed,r.activity==='quiz'?quizTargets(r.story,track):definition[track]);
  }
  function answers(r,key,locked=false){
    return '<div class="bk-answers" role="group" aria-label="Choose a Japanese word">'+choices(r,key).map(v=>
      button(markup(v),'answer',v,locked?'disabled':'',locked&&v===key?'bk-correct-choice':feedback?.wrong===v?'fs-wrong-choice':'')).join('')+'</div>';
  }
  function quizPanel(ctx){
    const {r,track}=ctx,verb=track==='verbs',key=r.current;
    if(!key)return '<div class="bk-study"><h2>'+ (verb?'Choose an action':'Choose an object')+'</h2><p>'+
      (verb?'Tap a play marker, watch RiNO, then choose the Japanese verb.':'Tap any object in the scene, then choose its Japanese name.')+'</p></div>'+status();
    const solved=r.solved.includes(key),complete=r.solved.length===r.targets.length;
    const details=solved?'<div class="bk-word">'+markup(key)+'</div><p>'+esc(vocabulary[key].name)+'</p>':
      '<h2>'+(verb?'What did RiNO do?':'What is this called?')+'</h2><p>Choose the Japanese '+(verb?'verb.':'word.')+'</p>';
    const controls=solved?listen(key)+button(complete?'See results':verb?'Choose another action':'Choose another object',complete?'end':'pick-another','','','game-primary'):
      verb?button('Replay movement','move',key):'';
    return wordCard(key,details)+answers(r,key,solved)+status()+'<div class="bk-bottom">'+controls+'</div>';
  }
  function directions(place,dest){
    const room=roomOf(dest);
    if(roomOf(place)!==room)return button('Go to '+places[room].name,'travel',room);
    if(places[place].room&&place!==dest)return button('Back to '+places[room].name,'back');
    if(place!==dest&&places[dest].room===place)return button('Look inside '+places[dest].name.toLowerCase(),'enter',dest);
    return '';
  }
  function where(key,story){
    const place=locationOf(key,story);
    return places[place].room?places[roomOf(place)].name+' · '+places[place].name:places[place].name;
  }
  function seek(ctx){
    const {r,story,place}=ctx,next=r.targets.find(k=>!r.solved.includes(k));
    return '<div class="hs-seek"><strong>Where to look</strong><span>'+esc(where(next,story))+'</span>'+directions(place,locationOf(next,story))+'</div>';
  }
  function question(ctx){
    const {r,story,track,place,definition}=ctx,key=r.listen||r.current,review=r.kind==='review',plot=narrative[story];
    if(r.solved.length===r.targets.length){
      const atEnd=place===definition.end;
      return '<div class="bk-study"><h2>'+(review?'Recall complete':'One last stop')+'</h2><p>'+esc(review?'Your first answers are saved.':plot.arrival)+'</p></div>'+status()+
        '<div class="bk-bottom">'+(review||atEnd?button(review?'See results':plot.delivery,'serve','','','game-primary'):directions(place,definition.end))+'</div>';
    }
    if(r.listen){
      return '<div class="bk-study"><h2>What did '+plot.guest[r.variant]+' ask for?</h2><p>Listen, explore and touch the matching object.</p></div>'+
        '<div class="bk-controls">'+listen(key,'Play request')+button('Read request','transcript')+'</div>'+status()+
        '<div class="bk-bottom">'+button('Clue','hint')+button('Show me','show')+'</div>';
    }
    if(!key){
      return '<div class="bk-study"><h2>Find the story objects</h2><p>'+esc(plot.clue)+'</p></div>'+seek(ctx)+status();
    }
    if(r.solved.includes(key)){
      return '<div class="bk-study"><h2>'+markup(key)+'</h2><p>'+esc(vocabulary[key].name)+'</p></div>'+
        (!review?answers(r,key,true):'')+status()+'<div class="bk-bottom">'+listen(key)+
        (review||track==='verbs'?button(review?'Next word':'Next action','next','','','game-primary'):'')+'</div>'+
        (!review&&track!=='verbs'?seek(ctx):'');
    }
    const dest=locationOf(key,story),verb=Object.hasOwn(actions,key);
    if(place!==dest){
      const instruction=places[dest].room?'Open the '+places[dest].name.toLowerCase()+' in the '+places[roomOf(dest)].name.toLowerCase()+'.':'Go to the '+places[dest].name.toLowerCase()+' to see '+(verb?'the movement.':'the object.');
      return '<div class="bk-study"><h2>'+(verb?'Find RiNO':'Find the object')+'</h2><p>'+esc(instruction)+'</p></div>'+status()+
        '<div class="bk-bottom">'+directions(place,dest)+'</div>';
    }
    const input=review&&!r.choices?'<label for="bk-answer">Type the Japanese word</label><input class="bk-input" id="bk-answer" maxlength="100" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ja" value="'+esc(r.draft)+'"><div class="bk-controls">'+button('Check word','type','','','game-primary')+button('Show four choices','choices')+'</div>':answers(r,key);
    return '<div class="fs-question">'+thumbnail(key)+'<div class="bk-study"><h2>'+(verb?'What did RiNO do?':'What is this called?')+'</h2><p>'+(verb?'Watch the movement and name the action.':'Look at the highlighted object.')+'</p></div></div>'+input+status()+
      '<div class="bk-bottom">'+(verb?button('Replay movement','move',key):'')+button('Clue','hint')+button('Show me','show')+'</div>';
  }
  function results(ctx){
    const {r,story,track,won}=ctx,records=Object.values(r.results),plot=narrative[story],weak=r.targets.filter(k=>r.results[k]&&(r.results[k].status!=='correct'||r.results[k].assisted));
    const quiz=r.activity==='quiz';
    const fresh=quiz||track==='mixed'?0:Math.min(roundLimit(track),ctx.definition[track].filter(key=>!ctx.s.due[key]).length);
    const replay=quiz?'Quiz again':fresh?'Practice '+fresh+' new '+(track==='verbs'?'verb':'noun')+(fresh===1?'':'s'):'Play again';
    return '<div class="bk-study"><h2>'+esc(won?plot.delivery:r.kind==='review'?'Words recalled':quiz?'Quiz results':'Round saved')+'</h2><p>'+esc(won?plot.end[r.variant]:'Your first answers are in Game progress.')+'</p></div>'+
      '<strong>'+records.filter(a=>a.status==='correct').length+' / '+records.length+' first answers correct</strong><ul class="bk-results">'+r.targets.filter(k=>r.results[k]).map(k=>{
        const a=r.results[k];return '<li>'+button(markup(k),'hear',k,'aria-label="Listen to '+esc(vocabulary[k].name)+'"')+'<span>'+(a.status==='skipped'?'Shown':a.status==='incorrect'?'Try again':a.assisted?'Correct with help':'Correct')+'</span></li>';
      }).join('')+'</ul><div class="bk-bottom">'+button(quiz?'Explore scene':'Choose a story','setup','','',fresh||quiz?'':'game-primary')+(track!=='mixed'?button(replay,quiz?'quiz':'start','','',fresh||quiz?'game-primary':''):'')+
      ['nouns','verbs'].map(part=>{const pool=quiz?quizTargets(story,part):ctx.definition[part];const n=weak.filter(k=>pool.includes(k)).length;return n?button('Review '+part+' ('+n+')','retry',part):'';}).join('')+'</div>';
  }
  function render(){
    const ctx=context(),{s,r,definition,story,track}=ctx,setup=s.stage==='setup',play=s.stage==='session';
    arriving=false;
    const view=[s.stage,r?.id||'',story,track].join('/');
    if(lastView!==view){feedback=null;mapOpen=false;bankOpen=false;exploring=null;ctx.mapOpen=false;ctx.exploring=null;lastView=view;}
    const quizzing=play&&ctx.freeQuiz;
    const toolbar=setup||quizzing?'<div class="fs-activity-bar">'+activityPicker(quizzing)+(setup?wordBank(ctx):'')+'</div>':'';
    return (setup?storyButtons(story):'')+'<header class="bk-header hs-header'+(setup?' bk-setup-header':'')+'"><div><h1 id="game-title" tabindex="-1">'+esc(definition.title)+'</h1><p>'+
      esc(setup?narrative[story].intro:trackName(track)+' · '+(quizzing?'Scene quiz':play?(r.kind==='review'?'Recall':narrative[story].intro):r.activity==='quiz'?'Quiz results':'Story results'))+'</p></div>'+
      (setup?trackButtons(track)+button('Start story','start','','','game-primary hs-start'):'')+'<div class="bk-controls">'+button(s.settings.voice?'Voice on':'Voice off','voice','','aria-pressed="'+s.settings.voice+'"')+
      (play?button(quizzing?'Finish quiz':'Finish round','end'):'')+'</div></header>'+toolbar+'<div class="bk-layout hs-layout">'+drawHouse(ctx,ui)+
      '<section class="bk-panel" aria-label="Story activity">'+(play?'<div class="bk-progress"><span>'+(r.kind==='review'?'Words recalled':track==='verbs'?'Actions named':'Objects named')+'</span><b>'+r.solved.length+' / '+r.targets.length+'</b></div><progress aria-label="Story progress" max="'+r.targets.length+'" value="'+r.solved.length+'"></progress>':'')+
      (setup?setupPanel(ctx):quizzing?quizPanel(ctx):play?question(ctx):results(ctx))+'</section></div><footer class="bk-footer"><span data-house-offline></span><a href="'+esc(url('credits.txt'))+'" target="_blank" rel="noopener">Audio credits</a></footer>';
  }
  function moveTo(ctx,dest,inspect=false){
    const {s,r,track}=ctx;
    if(r)r.place=dest;else s.settings.place=dest;
    mapOpen=false;exploring=null;feedback=null;stop();
    if(ctx.freeQuiz)r.current=null;
    if(!ctx.freeQuiz&&inspect&&dest==='fridge'&&track!=='verbs'){
      if(!r){exploring='fridge';seen.add('fridge');voice.play('fridge');}
      else if(!r.listen&&r.kind==='practice'&&r.targets.includes('fridge')&&!r.solved.includes('fridge')){
        r.current='fridge';r.draft='';r.choices=true;
      }
    }
    arriving=ctx.place!==dest;focus='place';change();
  }
  function start(ctx,track,targets=nextTargets(ctx.definition,track,ctx.s,ctx.story),review=false,quiz=false){
    const {s,definition,story}=ctx;
    if(s.session||!targets?.length)return;
    const previous=s.history.findLast(r=>r.kind==='practice'&&r.activity!=='quiz'&&(r.story||'breakfast')===story&&trackOf(r.targets)===track);
    const pool=quiz?{...definition,[track]:quizTargets(story,track)}:definition;
    const r=newRound(story,pool,track,targets,previous?1-previous.variant:0,review);
    if(quiz){
      r.activity='quiz';r.listen=null;
      if(!review){r.place=ctx.place;r.current=targets.includes(ctx.exploring)?ctx.exploring:null;}
    }
    s.settings.track=track;s.settings.story=story;s.session=r;s.stage='session';s.resultId=null;
    mapOpen=false;feedback=null;exploring=null;stop();if(r.listen)voice.play(r.listen);focus=quiz&&!review&&r.current?'quiz-answer':'place';change();
  }
  function attempt(ctx,key,correct,reveal=false,chosen=null){
    const {r,story}=ctx;
    if(!key||r.solved.includes(key)||!record(r,key,reveal?'skipped':correct?'correct':'incorrect',correct||reveal))return;
    if(reveal||correct){
      r.current=key;r.listen=null;r.draft='';r.place=locationOf(key,story);
      const after=key==='open'&&story!=='breakfast'?'The lid opens. Now you can look inside.':vocabulary[key].after;
      feedback={type:reveal?'note':'success',text:(reveal?'Shown · ':'✓ Correct · ')+after};
      voice.play(key,reveal?0:450);
      focus=ctx.freeQuiz?(r.solved.length===r.targets.length?'end':'pick-another'):r.kind==='review'||ctx.track==='verbs'?'next':null;
    }else if(ctx.freeQuiz){
      feedback={type:'error',text:'✕ Incorrect. Try another word.',wrong:chosen};
      focus='wrong-choice';
    }else feedback={type:'error',text:r.listen?'✕ Listen again and try another object.':'✕ Try again. You can ask for a clue.'};
    if(!reveal)globalThis.RinoSounds?.play(correct?'correct':'incorrect');
    change();
  }
  function target(r,key){
    if(r.solved.includes(key)){
      if(r.activity==='quiz'&&r.kind==='practice'){r.current=key;feedback=null;change();}
      voice.play(key);return;
    }
    if(r.activity==='quiz'&&r.kind==='practice')focus='quiz-answer';
    r.current=key;r.draft='';r.choices=r.kind!=='review';feedback=null;stop();change();
  }
  function handle(action,value){
    if(!action.startsWith('game-scene-'))return false;
    const cmd=action.slice(11),ctx=context(),{s,r,story,place,track,definition}=ctx,setup=s.stage==='setup',play=s.stage==='session';
    voice.unlock();
    if(cmd==='download'){void warm();return true;}
    if(cmd==='quiz'&&(setup||s.stage==='result')&&track!=='mixed'){
      start(ctx,track,quizTargets(story,track),false,true);return true;
    }
    if(cmd==='explore'&&play&&ctx.freeQuiz){
      focus='explore';stop();finish(false);return true;
    }
    if(cmd==='pick-another'&&play&&ctx.freeQuiz&&r.solved.includes(r.current)){
      r.current=null;feedback=null;stop();focus='quiz-scene';change();return true;
    }
    if(setup&&cmd==='word-list'){bankOpen=!bankOpen;focus='word-list';repaint();return true;}
    if(setup&&cmd==='study-word'&&definition[track].includes(value)){
      bankOpen=false;mapOpen=false;exploring=value;seen.add(value);feedback=null;
      const dest=locationOf(value,story);s.settings.place=dest;arriving=place!==dest;focus='place';
      voice.play(value);change();return true;
    }
    if(cmd==='voice'){s.settings.voice=!s.settings.voice;if(!s.settings.voice)stop();change();return true;}
    if(cmd==='hear'){
      const allowed=setup?value===exploring:play&&ctx.freeQuiz?r.solved.includes(value):r?.targets.includes(value);
      if(allowed&&Object.hasOwn(vocabulary,value))voice.play(value);return true;
    }
    if(cmd==='story'&&setup&&Object.hasOwn(stories,value)){
      if(story!==value){s.settings.story=value;s.settings.place=stories[value].home;stop();focus='story';change();}return true;
    }
    if(cmd==='track'&&setup&&['nouns','verbs'].includes(value)){
      if(track!==value){s.settings.track=value;stop();focus='track';change();}return true;
    }
    if(cmd==='start'&&!play&&track!=='mixed'){start(ctx,track);return true;}
    if(cmd==='due'&&setup){start(ctx,track,due(ctx),true);return true;}
    if(cmd==='retry'&&s.stage==='result'&&['nouns','verbs'].includes(value)){
      const quiz=r.activity==='quiz',pool=quiz?quizTargets(story,value):definition[value];
      start(ctx,value,pool.filter(k=>r.results[k]&&(r.results[k].status!=='correct'||r.results[k].assisted)),true,quiz);return true;
    }
    if(cmd==='setup'&&s.stage==='result'){
      s.settings.story=story;s.settings.place=r.activity==='quiz'?place:definition.home;if(track!=='mixed')s.settings.track=track;
      s.stage='setup';s.resultId=null;focus='story';stop();change();return true;
    }
    if(play&&cmd==='end'){stop();finish();return true;}
    if(play&&cmd==='serve'&&!ctx.freeQuiz&&r.solved.length===r.targets.length&&(r.kind==='review'||place===definition.end)){
      if(r.story&&r.kind==='practice')r.delivered=true;stop();finish();return true;
    }
    if(!setup&&!play)return true;
    if(cmd==='map'){mapOpen=!mapOpen;focus=mapOpen?'map-room':'map';repaint();return true;}
    if(cmd==='back'&&places[place].room){moveTo(ctx,roomOf(place));return true;}
    if((cmd==='travel'&&roomsFor(story).includes(value))||(cmd==='door'&&places[place].doors?.some(([id])=>id===value))){
      moveTo(ctx,value);return true;
    }
    if(cmd==='enter'&&places[place].containers?.some(([id])=>id===value)){
      moveTo(ctx,value,true);return true;
    }
    if(cmd==='object'&&track!=='verbs'&&objects[value]?.place===place){
      if(setup){exploring=value;seen.add(value);feedback=null;voice.play(value);repaint();}
      else if(r.listen)attempt(ctx,r.listen,value===r.listen);
      else if(r.kind!=='review'&&r.targets.includes(value))target(r,value);
      return true;
    }
    if(['explore-verb','move'].includes(cmd)&&track!=='nouns'&&definition.verbs.includes(value)&&actionAt(value,story).place===place){
      if(setup){exploring=value;seen.add(value);feedback=null;voice.play(value);repaint();}
      else if(!r.listen&&r.targets.includes(value)){
        if(r.current===value&&!r.solved.includes(value))repaint();else if(r.kind!=='review')target(r,value);
      }
      return true;
    }
    if(!play)return true;
    const key=r.listen||r.current;
    if(cmd==='next'&&r.solved.includes(r.current)){
      const next=r.targets.find(k=>!r.solved.includes(k));
      if(next){if(r.kind==='review')r.place=locationOf(next,story);target(r,next);}return true;
    }
    if(!key||r.solved.includes(key))return true;
    if(cmd==='transcript'&&r.listen){message(words[key].word+' · Touch the matching object.');return true;}
    if(cmd==='hint'){
      if(!r.hinted.includes(key))r.hinted.push(key);if(r.results[key])r.results[key].assisted=true;
      feedback={type:'note',text:(key==='open'&&story!=='breakfast'?'Watch the closed lid.':vocabulary[key].hint)+' '+where(key,story)+'.'};change();return true;
    }
    if(cmd==='show'){attempt(ctx,key,false,true);return true;}
    if(r.listen||place!==locationOf(key,story))return true;
    if(cmd==='choices'&&r.kind==='review'){
      r.choices=true;if(!r.hinted.includes(key))r.hinted.push(key);if(r.results[key])r.results[key].assisted=true;change();
    }else if(cmd==='answer'&&r.choices&&choices(r,key).includes(value))attempt(ctx,key,value===key,false,value);
    else if(cmd==='type'&&r.kind==='review'&&!r.choices){
      const answer=root.querySelector('#bk-answer')?.value||'';
      if(answer.trim())attempt(ctx,key,matchesAnswer(key,answer,words));else message('Type a word or show the four choices.');
    }
    return true;
  }
  function mount(){
    offlineStatus();
    const menu=root.querySelector('#hs-map');
    if(menu)menu.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();handle('game-scene-map');}};
    const field=root.querySelector('#bk-answer'),r=get().session;
    if(field&&r){
      field.oninput=()=>{r.draft=field.value.slice(0,100);save();};
      field.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing&&e.keyCode!==229){e.preventDefault();handle('game-scene-type');}};
    }
    if(focus){
      const selectors={place:'.hs-scene-head strong','quiz-scene':'.hs-scene-head strong','map-room':'.hs-map [aria-pressed="true"]','quiz-answer':'.bk-answers button','wrong-choice':'.fs-wrong-choice'};
      const selector=selectors[focus]||'[data-action="game-scene-'+focus+'"]'+(['track','story'].includes(focus)?'[aria-pressed="true"]':'');
      const el=root.querySelector(selector);
      if(el){
        if(focus==='place'||focus==='quiz-scene')el.tabIndex=-1;
        el.focus({preventScroll:true});
        if((focus==='quiz-answer'||focus==='quiz-scene')&&globalThis.matchMedia?.('(max-width:680px)').matches){
          root.querySelector(focus==='quiz-answer'?'.bk-panel':'.hs-board')?.scrollIntoView({block:'nearest'});
        }
      }
      focus=null;
    }
  }
  return {render,mount,handle,stop,typing:()=>doc.activeElement?.id==='bk-answer'};
}
