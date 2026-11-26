import {actionAt,kitchen,narrative,objects,places,roomOf,vocabulary} from './house-data.mjs';

export function drawHouse(ctx,ui){
  const {s,r,story,place,track,definition,exploring,discovered,mapOpen,won}=ctx;
  const {esc,image,button,words}=ui;
  const info=places[place],room=roomOf(place),setup=s.stage==='setup',play=s.stage==='session',review=r?.kind==='review';
  const allowNouns=track!=='verbs',allowVerbs=track!=='nouns';
  const known=setup?discovered:new Set(r?.solved||[]);
  const active=setup?exploring:play&&!r.listen?r.current:null;
  const position=(x,y,w,h)=>'style="--x:'+x+'%;--y:'+y+'%;'+(w?'--w:'+w+'%;--h:'+h+'%;':'')+'"';
  const label=key=>'<span class="hs-label" lang="ja">'+esc(words[key].word)+'</span>';
  const spot=(mark,cls='')=>'<span aria-hidden="true" class="hs-mark '+cls+'">'+mark+'</span>';
  function object(key,item){
    if(item.place!==place)return '';
    const learned=allowNouns&&known.has(key),target=allowNouns&&active===key;
    const selectable=allowNouns&&(setup||play&&(r.listen||!review&&r.targets.includes(key)));
    const body=(item.art?image(item.art):'')+(learned?label(key):selectable||target?spot('','noun-mark'):'');
    const cls='hs-item item-'+key+(target?' hs-target':'')+(item.art?'':' embedded');
    const attr=position(item.x,item.y,item.w,item.h);
    return selectable?button(body,'object',key,attr+' aria-label="'+esc(vocabulary[key].name)+'"',cls,false):
      '<div class="'+cls+'" '+attr+'>'+body+'</div>';
  }
  function movement(key){
    const motion=actionAt(key,story);
    if(motion.place!==place||!allowVerbs)return '';
    const watching=active===key,learned=known.has(key);
    const selectable=setup||play&&(!review||r.current===key);
    const tag=learned?label(key):'';
    const description=key==='open'?places[motion.target].name.toLowerCase():{wash:'sink',read:'armchair',write:'desk'}[key];
    const actor=watching?'<span class="hs-player act-'+key+'">'+image(motion.art)+'</span>':'';
    const opened=watching&&motion.target?'<span class="hs-peek">'+image(motion.target)+'</span>':'';
    const content=actor+opened+tag+(selectable?spot('▶','play-mark'):'');
    const attrs=position(motion.x,motion.y,18,25);
    return selectable?button(content,setup?'explore-verb':'move',key,attrs+' aria-label="'+(watching?'Replay the movement':'Watch at the '+description)+'"','hs-motion motion-'+key,false):
      '<div class="hs-motion" '+attrs+'>'+content+'</div>';
  }
  const canTravel=setup||play;
  const openings=canTravel?(info.containers||[]).map(([id,x,y])=>button(spot('+','open-mark'),'enter',id,position(x,y,16,24)+' aria-label="Open '+places[id].name.toLowerCase()+'" title="Open '+places[id].name.toLowerCase()+'"','hs-opening',false)).join(''):'';
  const doors=canTravel?(info.doors||[]).map(([id,x,y])=>button((x<50?'‹ ':'')+places[id].name+(x>=50?' ›':''),'door',id,position(x,y)+' aria-label="Go to '+places[id].name+'"','hs-door '+(x<50?'left':'right'),false)).join(''):'';
  const back=info.room&&canTravel?button('‹ '+places[room].name,'back','','aria-label="Close '+info.name.toLowerCase()+' and return to '+places[room].name+'"','hs-back'):'';
  const progress=info.room?places[room].name+' / '+info.name:info.name;
  const map=canTravel?button('Rooms','map','','aria-expanded="'+mapOpen+'" aria-controls="hs-map"','hs-map-toggle'):'';
  const menu=mapOpen&&canTravel?'<div id="hs-map" class="hs-map" role="group" aria-label="Choose a room">'+['kitchen','sitting','study'].map(k=>
    button(image(k)+'<span>'+places[k].name+'</span>','travel',k,'aria-pressed="'+(room===k)+'"','hs-map-room')).join('')+'</div>':'';
  const endingArt=story==='letter'?'letter':story==='rain'?'actor-read':kitchen+'rino-serve';
  const guest=won?narrative[story].guest[r.variant]:null;
  const ending=won?'<div class="hs-ending end-'+story+'">'+image(endingArt)+image(kitchen+(guest==='Pip'?'sparrow':'kitten'))+'</div>':'';
  const motions=(definition.verbs||[]).filter(key=>setup||r?.targets.includes(key)).map(movement).join('');
  return '<section class="hs-scene" aria-label="House scene"><div class="hs-scene-head"><strong>'+esc(progress)+'</strong><div>'+back+map+'</div></div>'+
    '<div class="bk-board hs-board'+(ctx.arriving?' hs-arriving':'')+'" role="group" aria-label="'+esc(info.name)+'" data-place="'+place+'" data-track="'+track+'" data-story="'+story+'">'+
    image(place,'class="hs-background"')+(story==='rain'&&!info.room?'<span class="hs-rain" aria-hidden="true"></span>':'')+
    Object.entries(objects).map(([key,item])=>object(key,item)).join('')+openings+motions+doors+ending+menu+'</div></section>';
}
