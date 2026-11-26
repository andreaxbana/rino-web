import {things as kitchenWords, wordsFor as kitchenReadings, record, matchesAnswer} from '../kitchen/kitchen-data-v2.mjs';

const kitchen = '../kitchen/';
const vocabulary = {
  ...kitchenWords,
  book:{id:'V0014',name:'book',hint:'You turn its pages.',after:'A gold moon glints on its cover.'},
  handkerchief:{id:'VO-ee3206bb3f',name:'handkerchief',hint:'A little cloth to dry wet cheeks.',after:'The striped cloth is soft and dry.'},
  umbrella:{id:'VO-6f54881e59',name:'umbrella',hint:'Its curved handle fits over your wrist.',after:'Raindrops slide off the yellow folds.'},
  pencil:{id:'VO-381da4d060',name:'pencil',hint:'The pointed end leaves a grey line.',after:'The red pencil is sharpened for the first line.'},
  paper:{id:'VO-cd08f9cdc2',name:'paper',hint:'A blank sheet is waiting for a message.',after:'There is room on the page for one more drawing.'},
  letter:{id:'VO-218ea67735',name:'letter',hint:'A message for one person, folded and sealed.',after:'The red seal keeps the message safe.'},
  read:{id:'V0003',name:'to read',hint:'Watch RiNO’s eyes follow the page.',after:'RiNO turns the page under the warm light.',phrase:'本を読む',meaning:'Read a book.'},
  write:{id:'V0004',name:'to write',hint:'The pencil leaves a mark on the page.',after:'The last stroke finishes the message.',phrase:'手紙を書く',meaning:'Write a letter.'}
};

const narrative = {
  breakfast:{art:kitchen+'bread',guest:['Pip','Momo'],intro:'Someone is tapping at the window. Set a second place for breakfast.',listen:'cup',
    clue:'The milk is in the fridge, the dishes in the cupboard. The toast is already on the table.',
    delivery:'Serve breakfast',arrival:'Bring everything back to the kitchen table.',end:['Pip hops up for toast. RiNO pours a second glass of milk.','Momo takes the sunny place at the table. Breakfast is ready for two.']},
  rain:{art:'umbrella',guest:['Pip','Momo'],intro:'Rain caught your visitor at the door. Find something dry, a drink and a book for the armchair.',listen:'umbrella',
    clue:'Try the sitting-room chest, the kitchen cupboard and the writing desk in the study.',
    delivery:'Settle in by the window',arrival:'Bring the book and the dry things to the sitting room.',end:['Pip tucks under the yellow umbrella. RiNO opens the moon book as rain taps the window.','Momo curls up in the armchair. A dry handkerchief and a story make the afternoon warm.']},
  letter:{art:'letter',guest:['Momo','Momo'],intro:'Momo left a letter in the cedar chest. Gather the writing things and make a reply before the morning post.',listen:'pencil',
    clue:'The writing things are in the desk drawer. Look for Momo’s blue letter inside the sitting-room chest.',
    delivery:'Seal the reply',arrival:'Take the reply to the kitchen table to seal it.',end:['RiNO presses the red seal onto the reply. Momo has a letter to take home.','RiNO slips a little drawing into the reply before Momo carries it through the kitchen door.']}
};

// Coordinates are percentages of the original full-bleed illustrations, measured from the upper left.
const places = {
  kitchen:{name:'Kitchen',doors:[['sitting',90,55]],containers:[['fridge',17,30],['cupboard',39,32]]},
  sitting:{name:'Sitting room',doors:[['kitchen',9,47],['study',91,46]],containers:[['chest',84,76]]},
  study:{name:'Study',doors:[['sitting',9,49]],containers:[['drawer',72,55]]},
  fridge:{name:'Fridge',room:'kitchen'},cupboard:{name:'Cupboard',room:'kitchen'},
  chest:{name:'Storage chest',room:'sitting'},drawer:{name:'Desk drawer',room:'study'}
};
const objects = {
  table:{place:'kitchen',x:40,y:73,w:14,h:14,detail:kitchen+'table-detail'},
  bread:{place:'kitchen',x:57,y:66,w:13,h:15,art:kitchen+'bread'},
  fridge:{place:'fridge',x:19,y:72,w:15,h:15,detail:kitchen+'fridge'},
  milk:{place:'fridge',x:45,y:37,w:14,h:27,art:kitchen+'milk'},
  cup:{place:'cupboard',x:40,y:22,w:13,h:22,art:kitchen+'cup'},
  plate:{place:'cupboard',x:61,y:53,w:24,h:13,art:kitchen+'plate'},
  handkerchief:{place:'cupboard',x:39,y:78,w:20,h:18,art:'handkerchief'},
  umbrella:{place:'chest',x:34,y:59,w:30,h:41,art:'umbrella'},
  letter:{place:'chest',x:69,y:65,w:23,h:23,art:'letter'},
  book:{place:'study',x:39,y:32,w:13,h:17,art:'book'},
  pencil:{place:'drawer',x:69,y:48,w:22,h:35,art:'pencil'},
  paper:{place:'drawer',x:38,y:49,w:25,h:32,art:'paper'}
};
const actions = {
  open:{place:'kitchen',x:20,y:48,art:'actor-open',target:'fridge'},
  wash:{place:'kitchen',x:76,y:38,art:'actor-wash'},
  read:{place:'sitting',x:31,y:42,art:'actor-read'},
  write:{place:'study',x:51,y:46,art:'actor-write'}
};
function actionAt(key,story){
  if(key==='open'&&story==='rain')return {place:'sitting',x:73,y:75,art:kitchen+'rino-open',target:'chest',phrase:'箱を開ける',meaning:'Open the box.'};
  if(key==='open'&&story==='letter')return {place:'study',x:63,y:57,art:kitchen+'rino-open',target:'drawer',phrase:'引き出しを開ける',meaning:'Open the drawer.'};
  return actions[key];
}
function locationOf(key,story){return objects[key]?.place||actionAt(key,story)?.place;}
function roomOf(place){return places[place].room||place;}
function wordsFor(data){
  const words=kitchenReadings(data),source=new Map(data.vocabulary.map(word=>[word.id,word]));
  for(const [key,item] of Object.entries(vocabulary)){
    if(words[key])continue;
    const word=source.get(item.id);
    if(!word?.word||!word.reading)throw new Error('Missing house word '+item.id);
    words[key]={word:word.word,reading:word.reading};
  }
  return words;
}
function optionsFor(key,seed){
  const bank=Object.hasOwn(actions,key)?Object.keys(actions):Object.keys(objects);
  let n=seed>>>0;
  for(const ch of key)n=(Math.imul(n,31)+ch.charCodeAt(0))>>>0;
  function shuffle(values){
    const a=values.slice();
    for(let i=a.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=Math.floor(n/4294967296*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  return shuffle([key,...shuffle(bank.filter(k=>k!==key)).slice(0,3)]);
}
function newRound(story,definition,track,targets,variant,review=false){
  if(!targets.length||!targets.every(k=>definition[track].includes(k))||new Set(targets).size!==targets.length)throw new Error('Invalid house story targets.');
  const current=review?targets[0]:track==='verbs'?targets[variant?targets.length-1:0]:null;
  const requested=narrative[story].listen;
  return {id:'scene-'+(globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)),
    startedAt:new Date().toISOString(),kind:review?'review':'practice',story,variant,targets:[...targets],solved:[],hinted:[],results:{},
    seed:Math.floor(Math.random()*0x7fffffff),current,listen:!review&&track==='nouns'&&variant&&targets.includes(requested)?requested:null,
    choices:!review,draft:'',place:review?locationOf(current,story):definition.home,delivered:false};
}
const files=['house-game.mjs','house-data.mjs','house-board.mjs','house.css','credits.txt',
  ...[...Object.keys(places),'umbrella','handkerchief','book','pencil','paper','letter','actor-open','actor-wash','actor-read','actor-write'].map(name=>name+'.webp'),
  ...['kitchen-data-v2.mjs','kitchen-audio.mjs','kitchen-v2.css',...['rino-serve','rino-open','sparrow','kitten','fridge','table-detail','cup','plate','milk','bread'].map(name=>name+'.webp'),
    ...Object.keys(vocabulary).map(key=>key+'.wav')].map(name=>kitchen+name)];
export {vocabulary,narrative,places,objects,actions,actionAt,locationOf,roomOf,wordsFor,optionsFor,newRound,record,matchesAnswer,files,kitchen};
