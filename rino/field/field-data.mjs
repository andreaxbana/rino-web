import * as house from '../house/house-data.mjs';
import {fieldWords} from './field-words.mjs';

export const kitchen = house.kitchen;
export const vocabulary = {...house.vocabulary,...fieldWords};
export const {record} = house;
const houseArt = new Set(house.files.filter(f=>!f.includes('/')&&f.endsWith('.webp')).map(f=>f.slice(0,-5)));
export const imageFile = key => (houseArt.has(key)?'../house/':'')+key+'.webp';

export const narrative = {
  ...house.narrative,
  school:{art:'classroom',short:'School',guest:['Momo','Pip'],intro:'The art bell rings soon. Find the supplies and help Momo finish a picture for the class.',listen:'brush',
    clue:'Explore the desks and unzip the yellow pencil case for the smaller tools.',
    delivery:'Hang the class picture',arrival:'Return to the classroom to hang the picture.',end:['Momo pins up a red flower. The whole class can see its bright petals.','Pip lands beside the finished picture just as the bell rings.']},
  shore:{art:'beach',short:'Seaside',guest:['Pip','Momo'],intro:'The tide is going out. Help Pip make a field guide to the creatures left in a rock pool.',listen:'shell',
    clue:'Search the open shore, then look into the pool surrounded by rocks.',
    delivery:'Finish the tide-pool guide',arrival:'Step back onto the beach to finish the field guide.',end:['Pip adds the little starfish to the guide as the tide begins to turn.','Momo carries the field guide above the high-water mark.']},
  trail:{art:'forest',short:'Woodland',guest:['Momo','Pip'],intro:'Momo has a trail map. Follow the stream and find the landmarks that lead to the waterfall.',listen:'map',
    clue:'Follow the stream through the trees. The yellow hiking pack holds the field equipment.',
    delivery:'Mark the waterfall',arrival:'Return to the trail to mark the waterfall on the map.',end:['Momo draws a blue star beside the waterfall. The way home is clear.','Pip calls from the bridge as RiNO marks the last bend in the river.']}
};
export const places = {
  ...house.places,
  classroom:{name:'Classroom',containers:[['case',85,76]]},case:{name:'Pencil case',room:'classroom'},
  beach:{name:'Beach',containers:[['pool',84,73]]},pool:{name:'Tide pool',room:'beach'},
  forest:{name:'Woodland trail',containers:[['pack',89,73]]},pack:{name:'Hiking pack',room:'forest'}
};
export const roomOf = place => places[place].room||place;
export function roomsFor(story){
  const site={school:'classroom',shore:'beach',trail:'forest'}[story];
  return site?[site]:['kitchen','sitting','study'];
}
function spot(place,x,y,w,h,art){
  return {place,x,y,w,h,...(art?{art}:{})};
}
export const objects = {
  ...house.objects,
  apple:spot('fridge',35,57,16,19,'apple'),egg:spot('fridge',57,58,12,15,'egg'),carrot:spot('fridge',54,80,19,20,'carrot'),
  spoon:spot('cupboard',56,22,12,20,'spoon'),bowl:spot('cupboard',38,52,16,18,'bowl'),fork:spot('cupboard',64,78,12,20,'fork'),
  window:spot('kitchen',63,15,17,15),pan:spot('kitchen',78,14,9,12),flower:spot('kitchen',94,85,12,16),
  cushion:spot('sitting',33,37,10,14),rug:spot('sitting',47,74,27,21),shelf:spot('sitting',76,26,14,24),
  desk:spot('study',51,37,22,15),vase:spot('study',88,17,10,13),
  board:spot('classroom',24,18,32,23),clock:spot('classroom',57,10,12,15),globe:spot('classroom',74,13,13,17),
  chair:spot('classroom',35,62,19,25),notebook:spot('classroom',79,52,19,14),schoolbag:spot('classroom',14,78,18,27),
  eraser:spot('case',15,36,19,18),ruler:spot('case',45,36,31,15),scissors:spot('case',81,34,25,24),
  glue:spot('case',13,66,12,28),brush:spot('case',43,66,31,12),pen:spot('case',80,66,27,13),
  island:spot('beach',19,17,24,19),sea:spot('beach',24,36,22,12),boat:spot('beach',63,24,20,17),
  gull:spot('beach',86,12,16,15),wave:spot('beach',39,51,27,16),ball:spot('beach',12,82,16,22),
  crab:spot('beach',41,83,18,17),sand:spot('beach',26,80,10,10),
  fish:spot('pool',18,27,22,18),shell:spot('pool',48,27,23,27),seaweed:spot('pool',80,26,24,28),
  octopus:spot('pool',19,65,24,30),starfish:spot('pool',48,65,23,31),shrimp:spot('pool',81,65,24,29),
  mountain:spot('forest',17,6,20,12),tree:spot('forest',16,38,20,25),waterfall:spot('forest',66,26,12,21),
  squirrel:spot('forest',92,32,12,14),bridge:spot('forest',54,49,26,16),river:spot('forest',18,80,20,16),
  mushroom:spot('forest',55,81,12,16),path:spot('forest',74,89,12,12),
  map:spot('pack',28,36,23,25),key:spot('pack',53,37,12,20),bottle:spot('pack',73,36,12,29),
  camera:spot('pack',24,70,18,21),binoculars:spot('pack',47,72,18,26),hat:spot('pack',75,72,23,26)
};
function action(place,x,y,key,at){return {place,x,y,art:'actor-'+key,at};}
export const actions = {
  ...house.actions,
  eat:action('kitchen',44,66,'eat','breakfast table'),drink:action('kitchen',69,79,'drink','glass of milk'),
  sit:action('sitting',45,67,'sit','stool'),sleep:action('sitting',67,39,'sleep','cushion'),
  stand:action('classroom',31,70,'stand','chair'),draw:action('classroom',71,51,'draw','sketchpad'),
  erase:action('classroom',25,26,'erase','blackboard'),cut:action('case',66,70,'cut','scissors'),
  swim:action('beach',40,43,'swim','surf'),dig:action('beach',42,78,'dig','sand'),
  pickup:action('pool',45,52,'pickup','seashell'),throw:action('beach',15,65,'throw','beach ball'),
  walk:action('forest',70,72,'walk','path'),climb:action('forest',38,40,'climb','rocks'),
  look:action('pack',48,57,'look','binoculars'),listen:action('forest',20,37,'listen','trees')
};
export function actionAt(key,story){
  return Object.hasOwn(house.actions,key)?house.actionAt(key,story):actions[key];
}
export const locationOf = (key,story)=>objects[key]?.place||actionAt(key,story)?.place;
export function wordsFor(data){
  const words=house.wordsFor(data),byId=new Map(data.vocabulary.map(v=>[v.id,v]));
  for(const [key,item] of Object.entries(fieldWords)){
    const match=byId.get(item.id);
    words[key]={word:item.word,reading:item.reading,forms:[...(item.forms||[]),...(match?[match.word,match.reading]:[])]};
  }
  return words;
}
export function matchesAnswer(key,answer,words){
  if(house.matchesAnswer(key,answer,words))return true;
  const written=answer.trim().normalize('NFKC');
  return (words[key]?.forms||[]).includes(written);
}
export function optionsFor(key,seed,pool=[]){
  const bank=Object.hasOwn(actions,key)?actions:objects;
  let n=seed>>>0;for(const ch of key)n=(Math.imul(n,31)+ch.charCodeAt(0))>>>0;
  function shuffle(values){
    const a=values.slice();
    for(let i=a.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=Math.floor(n/4294967296*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  const related=shuffle(pool.filter(k=>k!==key&&Object.hasOwn(bank,k)));
  const other=shuffle(Object.keys(bank).filter(k=>k!==key&&!related.includes(k)));
  return shuffle([key,...[...related,...other].slice(0,3)]);
}
export const roundLimit = track=>track==='verbs'?4:6;
export function nextTargets(definition,track,s,story){
  const recent=new Map();
  for(const round of s.history)if((round.story||'breakfast')===story&&round.kind==='practice'){
    for(const key of Object.keys(round.results))recent.set(key,round.endedAt);
  }
  // Unanswered words keep their place in the queue. Once all are familiar,
  // the earliest review date and least recently answered item come first.
  return definition[track].slice().sort((a,b)=>(s.due[a]||'').localeCompare(s.due[b]||'')||
    (recent.get(a)||'').localeCompare(recent.get(b)||'')).slice(0,roundLimit(track));
}
export function newRound(story,definition,track,targets,variant,review=false){
  if(!targets.length||!targets.every(k=>definition[track].includes(k))||new Set(targets).size!==targets.length)throw Error('Invalid story targets.');
  const current=review?targets[0]:track==='verbs'?targets[variant?targets.length-1:0]:null;
  const prompt=narrative[story].listen;
  return {id:'scene-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),startedAt:new Date().toISOString(),
    kind:review?'review':'practice',story,variant,targets:[...targets],solved:[],hinted:[],results:{},seed:Math.floor(Math.random()*0x7fffffff),current,
    listen:!review&&track==='nouns'&&variant?(targets.includes(prompt)?prompt:targets[0]):null,choices:!review,draft:'',place:review?locationOf(current,story):definition.home,delivered:false};
}
export const atlasKeys=Object.keys(vocabulary);
export const files=['field-game.mjs','field-board.mjs','field-data.mjs','field-words.mjs','field.css','field-atlas.webp','credits.txt',
  ...house.files.filter(f=>!['house-game.mjs','house-board.mjs','credits.txt'].includes(f)).map(f=>f.startsWith(kitchen)?f:'../house/'+f),
  ...['classroom','case','beach','pool','forest','pack','apple','egg','carrot','spoon','bowl','fork',...Object.keys(actions).filter(k=>!house.actions[k]).map(k=>'actor-'+k)].map(k=>k+'.webp'),
  ...Object.keys(fieldWords).map(k=>kitchen+k+'.wav')];
