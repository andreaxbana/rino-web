import {drawMap, drawPlayer, drawBeach, bucketArt, diaryArt, drawCoastEdges} from './art.js';
import {lines} from './dialogue.js';

const root = document.getElementById('rino-bay');
const $ = selector => root.querySelector(selector);
 const people={gran:{name:'Grandma',job:'On the veranda',mark:'家'},umi:{name:'Umi',job:'Down at the jetty',mark:'海'},kai:{name:'Kai',job:'Keeper of the bucket',mark:'貝'},shop:{name:'Yuki',job:'Corner shop',mark:'店'},rino:{name:'RiNO',job:'Summer holidays',mark:'り'}};
 const places={gran:{x:48,y:126,label:'Visit Grandma',person:'gran'},pier:{x:160,y:91,label:'Visit the kids at the blue bucket',person:'umi'},shop:{x:267,y:126,label:'Visit the ice-pop shop',person:'shop'}};
 const blank=()=>({active:'errand',heard:['errand'],x:61,y:135,facing:-1,crab:0,flavour:null,shared:false,memory:null,mode:'map',origin:'map',page:'log',review:null,phrase:null,english:true,kana:true});
 let s=blank(),walkId=0,mapKey='',track=null;
 const make=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);return b;};
 const lineText=id=>lines[id][2].map(p=>p[0]).join('');
 const heard=id=>s.heard.includes(id);
 const announce=text=>{$('.kt-announce').textContent=text;};
 const notebook=$('.kt-journal'),dialog=$('.kt-dialog'),world=$('.kt-world'),walk=$('.kt-walk'),player=$('.kt-player'),lineBox=$('.kt-line'),choices=$('.kt-replies');
 const tool=name=>root.querySelector('[data-tool="'+name+'"]');
 const app=$('.kt-app'),plane=$('.bay-plane'),study=$('.bay-study');
 let returnFocus=null;
 let keyboardMode = false;
 root.addEventListener('pointerdown', () => { keyboardMode = false; }, true);
 root.addEventListener('keydown', () => { keyboardMode = true; }, true);

const gameId = 'kotori-bay';
const standaloneStorage = 'rino.kotori-bay.v1';
const embedded = window.parent !== window;
let initialized = false;
let hostVisible = true;
let previousSave = '';

function send(type, fields = {}) {
  if (embedded && location.origin !== 'null') {
    window.parent.postMessage({type, game: gameId, ...fields}, location.origin);
  }
}

function snapshot() {
  return initialized ? {...s, heard: [...s.heard]} : null;
}

function save() {
  const current = snapshot();
  if (!current) return;
  const serialized = JSON.stringify(current);
  if (serialized === previousSave) return;
  if (embedded) {
    send('rino-game-save', {state: current});
  } else {
    try { localStorage.setItem(standaloneStorage, serialized); } catch { /* Storage can be disabled. */ }
  }
  previousSave = serialized;
}

function suspend() {
  ++walkId;
  hush();
  tool('listen').textContent = 'Listen';
  save();
  return snapshot();
}

function updateInteraction() {
  app.inert = !initialized || !hostVisible || document.hidden;
}

function fitScene() {
  const rect = plane.getBoundingClientRect();
  const viewport = world.getBoundingClientRect();
  if (!rect.width || !viewport.width) return;
  drawCoastEdges($('.bay-panorama'), $('.kt-map'), rect.width, viewport.width, rect.height);
  if (!initialized) return;
  // A fold, rotation or split-screen resize can expose less of the beach.
  const y = Math.max(98, Math.min(s.y, beachLimit()));
  if (s.y !== y) { movePlayer(s.x, y); save(); }
}

function proposeHeight() {
  const width = document.documentElement.clientWidth;
  const height = width <= 470
    ? Math.max(403, Math.min(455, 1.04 * width))
    : Math.max(440, Math.min(760, 0.67 * width));
  send('rino-game-resize', {height: Math.ceil(height)});
}
 function restore(p){
   if(!p||!Array.isArray(p.heard)||p.heard.length>Object.keys(lines).length||!p.heard.includes('errand')||!p.heard.every(k=>Object.hasOwn(lines,k))||![0,1,2].includes(p.crab)||![null,'melon','soda'].includes(p.flavour)||![null,'crab','pops','bay'].includes(p.memory)||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
   s={...blank(),heard:[...new Set(p.heard)],active:p.heard.includes(p.active)?p.active:null,crab:p.crab,flavour:p.flavour,shared:p.shared===true&&!!p.flavour,memory:p.shared===true&&p.flavour?p.memory:null,x:Math.max(9,Math.min(311,p.x)),y:Math.max(98,Math.min(148,p.y)),facing:p.facing===1?1:-1,mode:['map','bucket','book'].includes(p.mode)?p.mode:'map',page:p.page==='diary'?'diary':'log',review:p.heard.includes(p.review)?p.review:p.heard.at(-1),english:p.english!==false,kana:p.kana!==false};
   s.origin=p.origin==='bucket'?'bucket':'map';s.y=Math.min(p.y,Math.max(148,beachLimit()));s.y=Math.max(98,s.y);
   const id=shown();if(id&&Number.isInteger(p.phrase)&&lines[id][2][p.phrase])s.phrase=p.phrase;return true;
 }
 function shown(){return s.mode==='book'?(s.page==='log'?s.review:null):s.active;}
 function hush(){if(track){track.onended=null;track.onerror=null;track.pause();track=null;}}
 function say(id,mode='map'){
   hush();s.mode=mode;s.active=id;s.phrase=null;s.review=null;
   if(!heard(id))s.heard.push(id);
   announce(people[lines[id][0]].name+'. '+lines[id][1]);render();save();
   if (keyboardMode) (choices.querySelector('button') || tool('grammar')).focus({preventScroll:true});
 }
 const memories={
   crab:['Captain’s great escape','We gave him a bucket for a boat. He climbed out over my sandal.'],
   pops:['Ice pops on the step','Grandma broke hers in half. We sat on the step until our fingers were sticky.'],
   bay:['The little fishing boat','I watched the boat bob up and down. Even its rope had seaweed on it.']
 };
 function openBook(page='log'){
   ++walkId;hush();s.origin=s.mode==='bucket'?'bucket':'map';s.mode='book';s.review=s.active||s.heard.at(-1);s.page=page;s.phrase=null;render();save();$('.kt-close').focus({preventScroll:true});
 }
 function back(){++walkId;hush();s.mode=s.mode==='book'?s.origin:'map';s.phrase=null;s.review=null;render();save();$('.kt-logbtn').focus({preventScroll:true});}
 function around(){++walkId;hush();s.mode='map';s.active=null;s.phrase=null;s.review=null;render();save();walk.focus({preventScroll:true});}
 $('.kt-logbtn').addEventListener('click',()=>s.mode==='book'?back():openBook());
 $('.kt-close').addEventListener('click',back);
 $('.bay-back').addEventListener('click',back);
 $('.bay-shut-talk').addEventListener('click',around);
 $('.bay-close-study').addEventListener('click',closeStudy);
 study.addEventListener('click',e=>{if(e.target===study)closeStudy();});
 for(const b of root.querySelectorAll('[data-page]'))b.addEventListener('click',()=>{hush();s.page=b.dataset.page;s.phrase=null;render();save();});
 function movePlayer(x,y){
   if(x!==s.x)s.facing=x>s.x?1:-1;s.x=x;s.y=y;
   player.style.left=x/3.2+'%';player.style.top=y/1.76+'%';drawPlayer(player.querySelector('canvas'),s.facing);
 }
 function speak(place){
   ++walkId;
   if(place==='gran'){
     if(s.flavour){s.shared=true;say(s.flavour==='soda'?'homeSoda':'share');}
     else say('errand');
   }else if(place==='pier')say(s.crab===2?'escape':s.crab===1?'name':'peek');
   else say(s.flavour?(s.flavour==='soda'?'orderSoda':'melon'):'shop');
 }
 function near(){return Object.keys(places).find(key=>Math.hypot(s.x-places[key].x,s.y-places[key].y)<26);}
 function beachLimit(){const p=plane.getBoundingClientRect();return p.width?Math.max(148,(app.getBoundingClientRect().bottom-p.top)*320/p.width-7):200;}
 function limitPoint(x,y){
   const p=plane.getBoundingClientRect(),w=world.getBoundingClientRect(),edge=p.width?Math.max(9,(w.left-p.left)*320/p.width+7):9;
   x=Math.max(edge,Math.min(320-edge,x));
   if(Math.abs(x-160)<12&&y<139)return [x,Math.max(99,y)];
   return [x,Math.max(132,Math.min(beachLimit(),y))];
 }
 function go(x,y,destination){
   const token=++walkId;
   hush();s.mode='map';s.active=null;s.phrase=null;s.review=null;render();
   const route=s.y>=140&&y>=140?[[x,y]]:[[s.x,140],[x,140],[x,y]];
   function done(){if(token!==walkId)return;if(destination)speak(destination);else{render();save();}}
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){movePlayer(x,y);done();return;}
   function step(){
     if(token!==walkId)return;
     if(!route.length){done();return;}
     const [a,b]=route[0],dx=a-s.x,dy=b-s.y,dist=Math.hypot(dx,dy);
     if(dist<=15){movePlayer(a,b);route.shift();}else movePlayer(s.x+dx*15/dist,s.y+dy*15/dist);
     setTimeout(step,52);
   }step();
 }
 function visit(place){const p=places[place];go(p.x+(place==='pier'?4:8),p.y+(place==='pier'?13:9),place);}
 const hotspots=new Map();
 for(const [key,p] of Object.entries(places)){
   const b=make('',()=>visit(key));b.className='kt-npc';b.style.left=p.x/3.2+'%';b.style.top=p.y/1.76+'%';b.setAttribute('aria-label',p.label);b.innerHTML='<span aria-hidden="true" class="kt-bubble">···</span>';$('.kt-npcs').append(b);hotspots.set(key,b);
 }
 walk.addEventListener('click',e=>{
   if(!e.detail){const key=near();if(key)speak(key);else announce('Walk closer to the veranda, jetty, or ice-pop shop.');return;}
   const r=plane.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*176/r.height;
   const hit=Object.keys(places).find(k=>{const p=places[k];return Math.abs(p.x-x)<23 && y>p.y-45&&y<=p.y+4;});
   if(hit){visit(hit);return;}
   go(...limitPoint(x,y));
 });
 root.addEventListener('keydown',e=>{
   if (!initialized || !hostVisible || document.hidden) return;
   if (e.key === 'Tab' && !study.hidden) {
     const controls = [...study.querySelectorAll('button:not([disabled])')];
     const first = controls[0], last = controls.at(-1);
     if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
     if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
     return;
   }
   if(e.key==='Escape'){e.preventDefault();if(s.phrase!==null)closeStudy();else if(s.mode==='book'||s.mode==='bucket')back();else if(s.active)around();return;}
   if(s.phrase!==null||s.mode!=='map'||e.ctrlKey||e.metaKey||e.altKey)return;
   const dirs={ArrowUp:[0,-7],ArrowDown:[0,7],ArrowLeft:[-7,0],ArrowRight:[7,0],w:[0,-7],a:[-7,0],s:[0,7],d:[7,0]};
   const d=dirs[e.key];if(!d)return;
   e.preventDefault();++walkId;hush();s.active=null;s.phrase=null;
   const [x,y]=limitPoint(s.x+d[0],s.y+d[1]);movePlayer(x,y);render();save();walk.focus({preventScroll:true});
 });
 function chooseFlavour(f){s.flavour=f;say(f==='melon'?'melon':'orderSoda');}
 function replyButtons(id){
   const options=[];
   const add=(t,fn)=>options.push(make(t,fn));
   if(id==='errand'){add('Ask which flavour',()=>say('soda'));add('Head to the harbour',()=>visit('pier'));}
   if(id==='soda')add('Head to the harbour',()=>visit('pier'));
   if(id==='peek'){
     if(s.mode!=='bucket')add('Peek in the blue bucket',()=>say('peek','bucket'));
     else add('Lift the seaweed',()=>{s.crab=1;say('name','bucket');});
   }
   if(id==='name')add('Watch Captain',()=>{s.crab=2;say('escape','bucket');});
   if(id==='escape'&&!s.flavour)add('On to the ice-pop shop',()=>visit('shop'));
   if(id==='shop'){add('Choose melon',()=>chooseFlavour('melon'));add('Choose soda',()=>chooseFlavour('soda'));}
   if(id==='melon'||id==='orderSoda')add('Walk home with the ice pops',()=>visit('gran'));
   if(id==='share'||id==='homeSoda')add(s.memory?'Open your picture diary':'Draw a memory',()=>openBook('diary'));
   return options;
 }
 function layers(){
   const notes=s.phrase!==null&&!!shown();
   study.hidden=!notes;world.inert=notes||s.mode!=='map';$('.bay-closeup').inert=notes||s.mode!=='bucket';$('.kt-header').inert=notes||s.mode==='book';notebook.inert=notes||s.mode!=='book';dialog.inert=notes;
 }
 function closeStudy(){
   s.phrase=null;const id=shown();if(id)paintRule(id);else layers();save();
   if(returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus({preventScroll:true});
   else if(id)tool('grammar').focus({preventScroll:true});
   returnFocus=null;
 }
 function segment(button,text,reading){
   if(s.kana&&/[一-龯]/.test(text)){const ruby=document.createElement('ruby'),rt=document.createElement('rt');ruby.append(document.createTextNode(text));rt.textContent=reading;ruby.append(rt);button.append(ruby);}else button.textContent=text;
 }
 function paintRule(id){
   const parts=lines[id][2],idx=s.phrase,show=Number.isInteger(idx)&&!!parts[idx];
   lineBox.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(show&&idx===i)));
   tool('grammar').setAttribute('aria-expanded',String(show));layers();
   if(!show)return;
   const row=$('.bay-study-phrases');row.replaceChildren();
   parts.forEach(([text,reading],i)=>{const b=make('',()=>{s.phrase=i;paintRule(id);save();row.children[i].focus({preventScroll:true});});segment(b,text,reading);b.setAttribute('aria-pressed',String(i===idx));row.append(b);});
   $('.bay-study-translation').hidden=!s.english;$('.bay-study-translation').textContent=lines[id][1];
   $('.kt-explain').hidden=false;$('.kt-rule').textContent=parts[idx][2];$('.kt-explanation').textContent=parts[idx][3];
 }
 function phrase(id,i){returnFocus=document.activeElement;s.phrase=i;paintRule(id);save();$('.bay-close-study').focus({preventScroll:true});}
 function paintBook(){
   root.querySelectorAll('[data-page]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.page===s.page)));
   const diary=s.page==='diary';$('.bay-diary').hidden=!diary;$('.kt-jlist').hidden=diary;$('.kt-credit').hidden=diary;
   if(diary){
     const mem=s.memory;
     diaryArt($('.bay-sheet canvas'),mem,s.flavour);
     $('.bay-entry').textContent=mem?memories[mem][0]:(s.shared?'What shall I draw?':'A fresh page');
     $('.bay-caption').textContent=mem?memories[mem][1]:(s.shared?'Choose the bit of today you want to keep.':'After the ice pops, I’ll draw something from today.');
     const opts=$('.bay-memories');opts.replaceChildren();
     if(s.shared){for(const key of [...(s.crab===2?['crab']:[]),'pops','bay']){
       const b=make(memories[key][0],()=>{s.memory=key;render();save();announce('Drawing saved in your picture diary.');});
       b.setAttribute('aria-pressed',String(mem===key));opts.append(b);
     }}return;
   }
   const list=$('.kt-jlist');list.replaceChildren();
   for(const k of s.heard){
     const b=make('',()=>{hush();s.review=k;s.phrase=null;render();save();$('.kt-jlist [aria-pressed=true]')?.focus({preventScroll:true});});
     b.setAttribute('aria-pressed',String(s.review===k));const who=document.createElement('small'),txt=document.createElement('span');
     who.textContent=people[lines[k][0]].name;txt.lang='ja';txt.textContent=lineText(k);b.append(who,txt);list.append(b);
   }
 }
 function render(){
   const id=shown(),book=s.mode==='book',bucket=s.mode==='bucket';
   const sceneBucket=bucket||(book&&s.origin==='bucket');
   world.hidden=false;notebook.hidden=!book;$('.bay-closeup').hidden=!sceneBucket;$('.kt-hud').hidden=book||bucket||!!id;
   const destination=book?$('.bay-book-reader'):app;
   if(dialog.parentElement!==destination)destination.append(dialog);
   dialog.hidden=!id;app.dataset.talking=String(!!id);app.dataset.mode=s.mode;
   layers();
   $('.kt-logbtn').setAttribute('aria-expanded',String(book));$('.kt-count').textContent=s.heard.length;
   if(book)paintBook();
   const signature=[s.crab===2,!!s.memory,s.flavour].join('|');
   if(mapKey!==signature){drawMap($('.kt-map'),s.crab===2,!!s.memory,s.flavour);drawBeach($('.bay-beach'),!!s.memory);world.style.setProperty('--sand',s.memory?'#e7b295':'#efcf91');mapKey=signature;fitScene();}
   if(sceneBucket){bucketArt($('.bay-closeup canvas'),s.crab);$('.bay-closeup canvas').setAttribute('aria-label',['Seaweed floats in a blue bucket. Two eyes peek out.','Captain, a little red crab, is sitting in the blue bucket.','A trail of footprints leads to Captain on the sand.'][s.crab]);}
   movePlayer(s.x,s.y);$('.kt-carry').hidden=!s.flavour||s.shared;
   $('.kt-objective').textContent=s.shared?(s.memory?'Evening · Picture diary saved':'Back on Grandma’s veranda'):s.flavour?'In your bag · Two '+s.flavour+' ice pops':s.crab===2?'Captain got away · One wet sandal':'First morning · Grandma’s ice-pop errand';
   $('.kt-controls').textContent=bucket?'The blue bucket':'Tap a person or a path';
   for(const [k,b] of hotspots)b.dataset.active=String(id?((k==='pier'&&['umi','kai'].includes(lines[id][0]))||k===lines[id][0]):(k==='gran'&&!!s.flavour));
   lineBox.replaceChildren();choices.replaceChildren();
   $('.kt-tools').hidden=!id;lineBox.hidden=!id;
   if(!id){
     $('.kt-emblem').textContent='浜';$('.kt-name').textContent='Harbour path';$('.kt-job').textContent='';
     $('.kt-en').hidden=false;$('.kt-en').textContent=s.shared?'From the veranda you can hear a boat knocking against the jetty.':'Down by the water, two kids are whispering over a blue bucket.';
     const key=near();if(key)choices.append(make(places[key].label,()=>speak(key)));return;
   }
   const [who,en,parts]=lines[id],p=people[who];
   $('.kt-emblem').textContent=p.mark;$('.kt-name').textContent=p.name;$('.kt-job').textContent=p.job;$('.kt-en').hidden=!s.english;$('.kt-en').textContent=en;
   parts.forEach(([text,kana],i)=>{
     const b=make('',()=>phrase(id,i));b.setAttribute('aria-label',text+' Grammar');
     segment(b,text,kana);lineBox.append(b);
   });
   tool('english').setAttribute('aria-pressed',String(s.english));tool('kana').setAttribute('aria-pressed',String(s.kana));
   tool('listen').hidden=false;tool('listen').textContent=track?'Stop':'Listen';
   paintRule(id);if(!book)choices.append(...replyButtons(id));
 }
 root.addEventListener('click',e=>{
   const k=e.target.closest('button')?.dataset.tool,id=shown();if(!id||!k)return;
   if(k==='listen'){
     if(track){hush();tool('listen').textContent='Listen';return;}
     const a=new Audio(new URL('./audio/'+id+'.mp3',import.meta.url));track=a;tool('listen').textContent='Stop';
     const end=()=>{if(a===track){track=null;tool('listen').textContent='Listen';}};
     a.onended=end;a.onerror=()=>{end();announce('Audio playback is unavailable.');};a.play().catch(()=>{end();announce('Audio playback is unavailable.');});return;
   }
   if(k==='grammar'){phrase(id,lines[id][3]);return;}
   if(k==='english')s.english=!s.english;if(k==='kana')s.kana=!s.kana;render();save();
 });
function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.style.colorScheme = theme;
}

function initialize(state) {
  if (initialized) return;
  if (state) restore(state);
  initialized = true;
  render();
  fitScene();
  updateInteraction();
  save();
}

window.RinoKotoriBay = Object.freeze({snapshot, suspend});
window.addEventListener('message', event => {
  if (!embedded || event.source !== window.parent || event.origin !== location.origin) return;
  const message = event.data;
  if (!message || message.game !== gameId) return;
  if (message.type === 'rino-game-init') {
    applyTheme(message.theme);
    initialize(message.state);
  } else if (message.type === 'rino-game-theme') {
    applyTheme(message.theme);
  } else if (message.type === 'rino-game-visibility' && typeof message.visible === 'boolean') {
    hostVisible = message.visible;
    if (!hostVisible) suspend();
    updateInteraction();
  }
});
window.addEventListener('pagehide', suspend);
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) suspend();
  updateInteraction();
});
window.addEventListener('pageshow', () => {
  updateInteraction();
  if (embedded) send('rino-game-ready');
  proposeHeight();
});
let lastWidth = 0;
new ResizeObserver(() => {
  fitScene();
  const width = document.documentElement.clientWidth;
  if (width !== lastWidth) { lastWidth = width; proposeHeight(); }
}).observe(app);
if (embedded) {
  updateInteraction();
  send('rino-game-ready');
  proposeHeight();
} else {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(standaloneStorage)); } catch { /* Start a new visit. */ }
  initialize(saved);
}
