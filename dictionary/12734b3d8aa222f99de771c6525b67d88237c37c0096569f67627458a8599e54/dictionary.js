/* Unscored, all-level handwriting and text lookup over the bundled catalogue. */
(() => {
  'use strict';
  const WORD_PAGE_SIZE = 8;
  const WORKSPACE_KEY = 'rino-dictionary-workspace-v1';
  const sessionStorage = () => { try { return globalThis.sessionStorage; } catch { return null; } };
  const han = value => typeof value === 'string' && /^\p{Script=Han}$/u.test(value);
  const key = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 96)).replace(/[.\-]/g, '');
  // Reading aliases stay separate from English text and the saved query.
  const kanaRomaji = new Map();
  for (const [kana,syllables] of [
    ['ぁぃぅぇぉ','a i u e o'],['あいうえお','a i u e o'],
    ['かきくけこ','ka ki ku ke ko'],['がぎぐげご','ga gi gu ge go'],
    ['さしすせそ','sa shi su se so'],['ざじずぜぞ','za ji zu ze zo'],
    ['たちつてと','ta chi tsu te to'],['だぢづでど','da ji zu de do'],
    ['なにぬねの','na ni nu ne no'],['はひふへほ','ha hi fu he ho'],
    ['ばびぶべぼ','ba bi bu be bo'],['ぱぴぷぺぽ','pa pi pu pe po'],
    ['まみむめも','ma mi mu me mo'],['ゃゅょ','ya yu yo'],['やゆよ','ya yu yo'],
    ['らりるれろ','ra ri ru re ro'],['ゎわゐゑをんゔゕゖ','wa wa i e wo n vu ka ke']
  ]) Array.from(kana).forEach((character,i) => kanaRomaji.set(character,syllables.split(' ')[i]));
  for (const [kana,stem] of [['き','ky'],['ぎ','gy'],['し','sh'],['じ','j'],['ち','ch'],['ぢ','j'],['に','ny'],['ひ','hy'],['び','by'],['ぴ','py'],['み','my'],['り','ry']]) {
    for (const [small,vowel] of [['ゃ','a'],['ゅ','u'],['ょ','o']]) kanaRomaji.set(kana + small,stem + vowel);
  }
  for (const [kana,syllable] of Object.entries({
    'いぇ':'ye','うぃ':'wi','うぇ':'we','うぉ':'wo','きぇ':'kye','ぎぇ':'gye',
    'しぇ':'she','じぇ':'je','ちぇ':'che','にぇ':'nye','ひぇ':'hye','びぇ':'bye','ぴぇ':'pye','みぇ':'mye','りぇ':'rye',
    'すぃ':'si','ずぃ':'zi','てぃ':'ti','でぃ':'di','とぅ':'tu','どぅ':'du','てゅ':'tyu','でゅ':'dyu',
    'ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','ふゅ':'fyu','ゔぁ':'va','ゔぃ':'vi','ゔぇ':'ve','ゔぉ':'vo','ゔゅ':'vyu',
    'くぁ':'kwa','くぃ':'kwi','くぇ':'kwe','くぉ':'kwo','ぐぁ':'gwa','ぐぃ':'gwi','ぐぇ':'gwe','ぐぉ':'gwo'
  })) kanaRomaji.set(kana,syllable);
  function romanize(reading) {
    const kana = key(reading).replace(/\s/g,'');
    let result = '', doubled = false;
    for (let i = 0; i < kana.length; i++) {
      const character = kana[i];
      if (character === 'っ') { doubled = true; continue; }
      if (character === 'ー') { result += result.match(/[aeiou]$/)?.[0] || ''; continue; }
      const pair = kanaRomaji.get(kana.slice(i,i + 2));
      const syllable = pair || kanaRomaji.get(character);
      if (!syllable) return '';
      if (pair) i++;
      if (doubled) { result += /^[bcdfghjklmpqrstvwxyz]/.test(syllable) ? syllable[0] : ''; doubled = false; }
      result += syllable;
      if (character === 'ん' && /^[あいうえおぁぃぅぇぉやゆよゃゅょ]/.test(kana[i + 1] || '')) result += "'";
    }
    return result;
  }
  function romajiKeys(value) {
    const text = String(value || '').normalize('NFKC').toLowerCase().replace(/[’ʼ]/g,"'")
      .replace(/[āīūēōâîûêô]/g,c => ({ā:'aa',ī:'ii',ū:'uu',ē:'ee',ō:'oo',â:'aa',î:'ii',û:'uu',ê:'ee',ô:'oo'})[c]);
    if (!/^[a-z\s'.-]+$/.test(text)) return [];
    const canonical = spelling => spelling.replace(/[\s.\-]/g,'')
      .replace(/sy(?=[auo])/g,'sh').replace(/[tc]y(?=[auo])/g,'ch').replace(/[jz]y(?=[auo])/g,'j')
      .replace(/si/g,'shi').replace(/ti/g,'chi').replace(/tu/g,'tsu').replace(/(?<![sc])hu/g,'fu').replace(/zi|di/g,'ji').replace(/du/g,'zu')
      .replace(/tch/g,'cch').replace(/m(?=[bmp])/g,'n').replace(/n'(?=[^aeiouy]|$)/g,'n')
      .replace(/ou/g,'oo').replace(/ei/g,'ee');
    return [...new Set([canonical(text),canonical(text.replace(/([aeiou])-/g,'$1$1'))])].filter(Boolean);
  }
  const normalize = input => ({
    character: han(input?.character) ? input.character : null,
    view: ['meaning','words','writing'].includes(input?.view) ? input.view : 'meaning',
    wordId: typeof input?.wordId === 'string' ? input.wordId.slice(0,120) : null,
    query: typeof input?.query === 'string' ? input.query.slice(0,120) : ''
  });
  function englishMatch(item,query) {
    const terms=key(query).trim().split(/\s+/).filter(Boolean);
    if(!terms.length)return null;
    const meanings=[...item.glosses || [],...item.meanings_en || [],item.meaning_en].filter(Boolean);
    let best=null;
    for(const meaning of meanings){const text=key(meaning);if(!terms.every(term=>(' '+text).includes(' '+term)))continue;
      const score=text===key(query).trim()?300:text.startsWith(key(query).trim())?200:100;
      if(!best||score>best.score)best={score,snippet:meaning};
    }
    return best;
  }
  function inflections(word) {
    const result=[];
    for(const spelling of [word.word,...word.alternate_forms || []])for(const section of globalThis.KotobaWordForms?.describe({...word,word:spelling})?.sections || [])for(const row of section.rows || [])for(const name of ['plain','polite','form'])if(row[name]?.text)result.push({...row[name],label:row.label});
    return result;
  }
  function deinflectCandidates(query) {
    const input=key(query), result=new Set([input]);
    const replace=(suffix,endings)=>{if(input.endsWith(suffix))for(const ending of endings)result.add(input.slice(0,-suffix.length)+ending);};
    for(const ending of ['ました','ませんでした','ません','ます','ましょう','たい','たかった','たくない']){
      replace(ending,['る']);
      for(const [stem,end] of [['い','う'],['き','く'],['ぎ','ぐ'],['し','す'],['ち','つ'],['に','ぬ'],['び','ぶ'],['み','む'],['り','る']])replace(stem+ending,[end]);
      replace('し'+ending,['する']);replace('き'+ending,['くる']);
    }
    for(const [ending,lemmas] of [['た',['る']],['て',['る']],['った',['う','つ','る']],['って',['う','つ','る']],['いた',['く']],['いて',['く']],['いだ',['ぐ']],['いで',['ぐ']],['した',['す','する']],['して',['す','する']],['んだ',['ぬ','ぶ','む']],['んで',['ぬ','ぶ','む']],['ない',['る']],['なかった',['る']],['かった',['い']],['くない',['い']],['くなかった',['い']],['でした',['だ','']],['だった',['だ','']]])replace(ending,lemmas);
    for(const ending of ['ない','なかった','なくて','なく'])for(const [stem,end] of [['わ','う'],['か','く'],['が','ぐ'],['さ','す'],['た','つ'],['な','ぬ'],['ば','ぶ'],['ま','む'],['ら','る']])replace(stem+ending,[end]);
    return [...result];
  }
  function createIndex(data,notes = {},reference = {}) {
    const kanji = new Map((data.kanji || []).map(item => [item.character,item]));
    const catalogWords = new Map((data.vocabulary || []).map(item => [item.id,item]));
    const ref = globalThis.RinoDictionaryReference?.create(reference);
    const words = new Map(), pairs = new Map(), preferred = new Map(), identities = new Map(), aliases = new Map();
    const pairKey = (word,reading) => key(word) + '\u0000' + key(reading);
    const register = item => {
      words.set(item.id,item);
      for (const reading of [item.reading,...item.alternate_readings || []]) for(const spelling of [item.word,...item.alternate_forms || []]) {
        const pair = pairKey(spelling,reading);
        if (!pairs.has(pair)) pairs.set(pair,item.id);
      }
      if(item.reference_key&&!identities.has(item.reference_key))identities.set(item.reference_key,item.id);
      if(reference.examples?.[item.reference_key])item.learner_examples=reference.examples[item.reference_key];
    };
    for (const item of catalogWords.values()) {
      const rich=ref?.resolve(item);
      register({...rich,...item,...rich?{senses:rich.senses,glosses:rich.glosses,alternate_forms:[...new Set([...(item.alternate_forms || []),rich.word,...rich.alternate_forms].filter(w=>w!==item.word))]}:{},occurrence:reference.occurrences?.[item.id]});
    }
    for(const item of ref?.words || [])if(!identities.has(item.reference_key))register(item);
    for (const [character,note] of Object.entries(notes.entries || {})) {
      if (!han(character)) continue;
      const ids = [];
      for (const [position,item] of (note.words || []).entries()) {
        const readings = item.reading.split(/\s*\/\s*/);
        const matchId = readings.map(reading => pairs.get(pairKey(item.text,reading))).find(Boolean);
        const match = words.get(matchId);
        const id = match?.id || 'dict:' + character.codePointAt(0).toString(16) + ':' + position;
        aliases.set('dict:' + character.codePointAt(0).toString(16) + ':' + position,id);
        register({...match,id,word:match?.word || item.text,reading:match?.reading || readings[0],alternate_readings:[...new Set([...(match?.alternate_readings || []),...readings.slice(1)])],meaning_en:item.gloss,learner:item});
        ids.push(id);
      }
      preferred.set(character,ids);
    }
    // Every word displayed in an entry must also be discoverable through search.
    for (const item of kanji.values()) for (const [position,example] of (item.example_words || []).entries()) {
      if (!example.word || !example.reading)continue;
      const existing=pairs.get(pairKey(example.word,example.reading));
      if(existing){aliases.set('dict:example:' + item.character.codePointAt(0).toString(16) + ':' + position,existing);continue;}
      register({...example,id:'dict:example:' + item.character.codePointAt(0).toString(16) + ':' + position});
    }
    for(const item of kanji.values())for(const [position,sentence] of (item.example_sentences || []).entries()) {
      if(!sentence.target_word || !sentence.target_reading)continue;
      let id=pairs.get(pairKey(sentence.target_word,sentence.target_reading));
      if(!id){id='dict:context:'+item.character.codePointAt(0).toString(16)+':'+position;register({id,word:sentence.target_word,reading:sentence.target_reading,meaning_en:sentence.target_meaning_en || 'Expression in this sentence',context_only:!sentence.target_meaning_en});}
      const word=words.get(id);
      const examples=word.context_examples ||= [];
      if(examples.length<6&&!examples.some(s=>s.example_ja===sentence.example_ja))examples.push({...sentence,occurrence:globalThis.RinoDictionaryReference?.occurrence(word,sentence)});
    }
    const byCharacter = new Map();
    for (const item of words.values()) {
      const included = new Set();
      // Kana headwords can have a useful verified kanji spelling (あびる →
      // 浴びる). Keep its catalogue identity while displaying that spelling
      // in the character's related words, without borrowing mismatched ruby.
      for (const spelling of [item.word,...item.alternate_forms || []]) {
        for (const character of new Set(Array.from(spelling || '').filter(han))) {
          if (included.has(character)) continue;
          included.add(character);
          if (!byCharacter.has(character)) byCharacter.set(character,[]);
          byCharacter.get(character).push(spelling === item.word ? item : {...item,word:spelling,word_ruby:undefined});
        }
      }
    }
    for (const list of byCharacter.values()) list.sort((a,b) => Number(b.level?.slice(1) || 0) - Number(a.level?.slice(1) || 0) || a.word.localeCompare(b.word,'ja'));
    const spokenReadings = {'こんにちは':'konnichiwa','こんばんは':'konbanwa','は':'wa','へ':'e','を':'o'};
    const searchRow = (item,text,readings) => ({item,text:key(text.join(' ')),readings:readings.map(key),romaji:[...new Set(readings.flatMap(reading => [romanize(reading),key(item.word) === key(reading) ? spokenReadings[key(reading)] : ''].flatMap(romajiKeys)))]});
    const kanjiSearch = [...kanji.values()].map(item => searchRow(item,[item.character,...item.meanings_en || [],...item.on_readings || [],...item.kun_readings || []],[...item.on_readings || [],...item.kun_readings || []]));
    const wordSearch = [...words.values()].map(item => searchRow(item,[item.word,item.reading,...item.alternate_forms || [],...item.alternate_readings || [],item.meaning_en,...item.glosses || []],[item.word,item.reading,...item.alternate_forms || [],...item.alternate_readings || []]));
    function search(query,options = {}) {
      const terms = String(query || '').normalize('NFKC').trim().split(/\s+/).filter(Boolean);
      if (!terms.length) return {kanji:[],words:[]};
      const termKeys = terms.map(term => ({term:key(term),romaji:romajiKeys(term)})).filter(({term,romaji}) => term || romaji.length);
      if (!termKeys.length) return {kanji:[],words:[]};
      const english = row => englishMatch(row.item,query);
      const wholeEnglish=row=>{const tokens=[...row.item.glosses || [],...row.item.meanings_en || [],row.item.meaning_en].filter(Boolean).flatMap(v=>key(v).split(/[^a-z0-9]+/));return termKeys.every(({term})=>tokens.includes(term));};
      const mode = options.mode && options.mode !== 'auto' ? options.mode : wordSearch.some(wholeEnglish) || kanjiSearch.some(wholeEnglish) ? 'english' : terms.length>1?'mixed':/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(query) ? 'japanese' : 'romaji';
      const matches = list => list.filter(row => mode==='mixed'?termKeys.every(({term,romaji})=>row.text.includes(term)||romaji.some(alias=>row.romaji.some(reading=>reading.includes(alias)))):mode==='english' ? english(row) : mode==='romaji' ? termKeys.every(({romaji})=>romaji.some(alias=>row.romaji.some(reading=>reading.includes(alias)))) : termKeys.every(({term})=>[row.item.character,row.item.word,row.item.reading,...row.item.alternate_forms || [],...row.item.alternate_readings || [],...row.item.on_readings || [],...row.item.kun_readings || []].some(value=>key(value).includes(term))));
      const exact = key(query).trim();
      const exactRomaji = romajiKeys(query);
      const priority = ({item,readings,romaji}) => [item.character || item.word,...item.alternate_forms || []].some(value => key(value) === exact) ? 3 : readings.includes(exact) || exactRomaji.some(alias => romaji.includes(alias)) ? 2 : [item.meaning_en,...item.glosses || [],...item.meanings_en || []].some(value => value && key(value) === exact) ? 1 : 0;
      const ordered = list => list.map(row=>({...row.item,_match:{score:(mode==='english'?englishMatch(row.item,query).score:priority(row)*100+10)+(row.item.common?2:0),snippet:mode==='english'?englishMatch(row.item,query).snippet:row.item.meaning_en}})).sort((a,b)=>b._match.score-a._match.score);
      let found=ordered(matches(wordSearch));
      if(mode==='japanese') {
        const candidates=new Set(deinflectCandidates(query));
        for(const word of words.values())if(!found.some(w=>w.id===word.id)&&[word.word,word.reading,...word.alternate_forms || []].some(f=>candidates.has(key(f)))){
          const form=inflections(word).find(form=>[form.text,form.reading].some(value=>key(value)===exact));
          if(form)found.push({...word,_match:{score:190,snippet:word.meaning_en,form:form.label}});
        }
        found.sort((a,b)=>b._match.score-a._match.score);
      }
      const seen=new Set();found=found.filter(word=>{const identity=word.reference_key || word.id;if(seen.has(identity))return false;seen.add(identity);return true;});
      return Object.defineProperty({kanji:ordered(matches(kanjiSearch)),words:found},'mode',{value:mode});
    }
    return {kanji,words,catalogWords,byCharacter,preferred,search,pairs,reference:ref,register,aliases};
  }
  function create({root,data,resources,notes = {},reference = {},saved,esc,button,bilingual = esc,readingWords = globalThis.KotobaKanjiReadingWords?.create(data),workspaceStorage = sessionStorage(),onChange = () => {},onLearn = () => {},lessonButtons = () => '',renderAnime = () => ''}) {
    const index = createIndex(data,notes,reference);
    let state = normalize(saved), ink = [], activeStroke = null, matches = [], searchWords = [], message = 'Draw one kanji, or search by kanji, kana, romaji or English.';
    let host = null, pad = null, padController = null, pending = null, requestVersion = 0, strokeLesson = null, wordPage = 0, speaking = null;
    let searchDraft = state.query, draftSelection = null, draftFocused = false, composing = false, draftReset = false, navigationInitialized = false;
    let searchMode='auto',searchPage=0,kanjiPage=0,wordTotal=0,coreResults=[],worker=null,workerReady=false,workerRequest=0,extendedPage=null,entryOpen=!!(state.wordId||state.character),handwritingOpen=false;
    let referenceStatus=reference.extended?'Study words and common vocabulary available offline.':'Bundled vocabulary';
    let keptDrawingMatches=[],keptWordMatches=[];
    let searchBusy=false,lastSearchMode='auto',pendingPage=null,referenceFailed=false;
    // Keep this tab's unscored lookup through reloads, separately from study
    // progress. Routes continue to contain only the entry, section and query.
    try {
      const workspace = JSON.parse(workspaceStorage?.getItem(WORKSPACE_KEY) || 'null');
      if(['auto','english','japanese','romaji'].includes(workspace?.mode))searchMode=workspace.mode;
      if(workspace?.query===state.query&&Number.isSafeInteger(workspace.page))pendingPage=searchPage=Math.max(0,workspace.page);
      if (workspace?.version === 1 && Array.isArray(workspace.ink) && workspace.ink.length <= 40 && workspace.ink.every(stroke =>
        Array.isArray(stroke) && stroke.length >= 1 && stroke.length <= 900 && stroke.every(point =>
          Array.isArray(point) && point.length === 2 && point.every(value => Number.isFinite(value) && value >= 0 && value <= 109)))) {
        ink = workspace.ink;
        if (workspace.query === state.query) {
          matches = [...new Set((workspace.matches || []).filter(han))].slice(0,32);
          if(ink.length)keptDrawingMatches=matches.slice();
          searchWords = (workspace.words || []).map(id => index.words.get(id)).filter(Boolean).slice(0,8);
          if(ink.length)keptWordMatches=searchWords.slice();
        }
      }
    } catch {}
    const noteFor = character => notes.entries?.[character];
    const ruby = (text,reading,tokens) => tokens?.length ? globalThis.KotobaFurigana.renderTokens(tokens) : globalThis.KotobaFurigana.render(text || '',reading || '');
    const annotatedRuby = text => esc(text).replace(/([\p{Script=Han}々]+[ぁ-ゖァ-ヺー]*)\[([^\]]+)\]/gu,(_,word,reading) => ruby(word,reading));
    const action = (text,name,value = '',extra = '',cls = '') => button(text,'dict-' + name,value,'jp-control rdict-button ' + cls,extra);
    const safeUrl = value => typeof value === 'string' && /^https:\/\//.test(value) ? esc(value) : '#';
    const announce = text => { message = text; if (host?.isConnected) { const node = host.querySelector('#rdict-status'); if (node) node.textContent = text; } };
    function saveWorkspace() {
      try { workspaceStorage?.setItem(WORKSPACE_KEY,JSON.stringify({version:1,query:state.query,ink,matches,words:searchWords.slice(0,8).map(word => word.id),mode:searchMode,page:searchPage})); } catch {}
    }
    const changed = () => { saveWorkspace(); onChange(); };
    function relatedWords(character) {
      const existing = index.byCharacter.get(character) || [], result = [], included = new Set();
      for (const id of index.preferred.get(character) || []) { const item = index.words.get(id); if (item) { result.push(item); included.add(id); } }
      for (const word of existing) if (!included.has(word.id)) { result.push(word); included.add(word.id); }
      return result;
    }
    const getWord = id => {id=index.aliases.get(id)||id;return extendedPage?.find(word=>word.id===id) || searchWords.find(word=>word.id===id) || index.words.get(id);};
    function captureInput() {
      if (draftReset) return;
      const field = host?.isConnected ? host.querySelector('#rdict-search') : null;
      if (!field) return;
      searchDraft = field.value;
      draftFocused = root.ownerDocument?.activeElement === field;
      if (Number.isInteger(field.selectionStart)) draftSelection = {start:field.selectionStart,end:field.selectionEnd,direction:field.selectionDirection};
    }
    function cancelLookup() {
      requestVersion++; const previous = pending; pending = null; previous?.abort(); updateTools();
    }
    function stopSpeaking() { if (speaking) { globalThis.speechSynthesis?.cancel(); speaking = null; } }
    function destroyLesson() { strokeLesson?.destroy(); strokeLesson = null; }
    function beforeRender({leave = false} = {}) {
      captureInput();
      saveWorkspace();
      padController?.abort(); padController = null; activeStroke = null;
      strokeLesson?.unmount(); host = null; pad = null;
      if (leave) { composing = false; draftFocused = false; cancelLookup(); stopSpeaking(); destroyLesson(); }
    }
    function candidateMarkup() {
      const visible = !state.query && state.character && !matches.includes(state.character) ? [state.character,...matches] : matches;
      const candidates = visible.slice(kanjiPage*12,kanjiPage*12+12).map(character => {
        const item = index.kanji.get(character);
        return action(`<span lang="ja">${esc(character)}</span>`,'select',character,`aria-label="${esc(character + (item ? ': ' + item.meanings_en.join('; ') : ': entry not bundled'))}" aria-pressed="${state.character === character}"`,'rdict-candidate');
      }).join('');
      return `<div class="rdict-candidates" role="group" aria-label="Possible kanji matches">${candidates || '<p class="rdict-muted">No kanji matches.</p>'}</div>${pagination('kanji-page',kanjiPage,visible.length,12,'Kanji')}`;
    }
    function pagination(name,page,total,size,label){const pages=Math.ceil(total/size),busy=name==='result-page'&&searchBusy;return pages>1?`<nav class="rdict-pagination" aria-label="${label} pages">${action('Previous',name,'previous',page===0||busy?'disabled':'')}<span>${page+1} / ${pages} · ${total.toLocaleString()} results${busy?' · Searching…':''}</span>${action('Next',name,'next',page>=pages-1||busy?'disabled':'')}</nav>`:'';}
    function searchWordMarkup() {
      const page=extendedPage || searchWords.slice(searchPage*WORD_PAGE_SIZE,searchPage*WORD_PAGE_SIZE+WORD_PAGE_SIZE);
      const words = page.map(item => action(`<span lang="ja">${ruby(item.word,item.reading,item.word_ruby)}</span><span>${esc(item._match?.snippet || item.meaning_en)}${item._match?.form?`<small>Matched ${esc(item._match.form.toLowerCase())}</small>`:''}</span>`,'search-word',item.id,`aria-pressed="${state.wordId === item.id}"`,'rdict-search-word')).join('');
      return `${state.query?`<h2 class="rdict-match-heading">Words <span>${searchBusy?'Searching…':wordTotal.toLocaleString()}</span></h2>`:''}${words?`<div class="rdict-search-words" role="group" aria-label="Matching vocabulary">${words}</div>`:state.query?`<p class="rdict-muted">${searchBusy?'Searching the full dictionary…':'No matching words in the available reference.'}</p>`:''}${pagination('result-page',searchPage,wordTotal,WORD_PAGE_SIZE,'Word results')}`;
    }
    function sourceMarkup(k,note) {
      return `<details class="rdict-sources"><summary>Sources &amp; entry notes</summary><p>Kanji meanings and selected readings: <a href="https://www.edrdg.org/wiki/KANJIDIC_Project.html" target="_blank" rel="noopener noreferrer">KANJIDIC2 / EDRDG</a>.${note?.sourceUrl ? ` Additional kanji reference: <a href="${safeUrl(note.sourceUrl)}" target="_blank" rel="noopener noreferrer">Kanjipedia ↗</a>. Learner explanations are written for RiNO.` : ''}</p>${k.notes ? `<p>${bilingual(k.notes)}</p>` : ''}<p>Stroke diagrams and component shapes: KanjiVG © Ulrich Apel &amp; contributors, <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 3.0</a>. Adapted stroke data remains under that licence.</p></details>`;
    }
    function wordExamples(word) {
      const examples=[...(word.learner_examples || []),...(word.context_examples || [])];
      if(word.example_ja){const occurrence=word.occurrence || globalThis.RinoDictionaryReference?.occurrence(word);if(occurrence)examples.push({...word,occurrence});}
      for(const sentence of word.additional_examples||[]){const occurrence=globalThis.RinoDictionaryReference?.occurrence(word,sentence);if(occurrence)examples.push({...sentence,occurrence});}
      const learner=word.learner;
      if(learner?.sentence){const tokens=[],pattern=/([\p{Script=Han}々]+[ぁ-ゖァ-ヺー]*)\[([^\]]+)\]/gu;let offset=0;for(const m of learner.sentence.matchAll(pattern)){if(m.index>offset)tokens.push({text:learner.sentence.slice(offset,m.index)});tokens.push({text:m[1],reading:m[2]});offset=m.index+m[0].length;}if(offset<learner.sentence.length)tokens.push({text:learner.sentence.slice(offset)});const s={example_ja:tokens.map(t=>t.text).join(''),example_ruby:tokens,example_en:learner.translation,example_source:'Original RiNO example'};const occurrence=globalThis.RinoDictionaryReference?.occurrence(word,s);if(occurrence)examples.unshift({...s,occurrence});}
      const seen=new Set();
      return examples.filter(s=>s.occurrence&&!seen.has(s.example_ja)&&seen.add(s.example_ja));
    }
    function wordHelp({word,reading,id,meaning_en}) {
      const match=index.words.get(id);
      const exact=match&&key(match.reading)===key(reading)&&[match.word,...match.alternate_forms || []].some(form=>key(form)===key(word));
      const pair=index.words.get(index.pairs.get(key(word)+'\0'+key(reading)));
      const ref=index.reference?.byPair.get(globalThis.RinoDictionaryReference.pair(word,reading)) || [];
      const glossMatches=ref.filter(entry=>entry.glosses.some(gloss=>key(gloss)===key(meaning_en)));
      const unique=ref.length===1?ref[0]:glossMatches.length===1?glossMatches[0]:null;
      const entry=exact?match:unique?(pair?.reference_key===unique.reference_key?pair:unique):!ref.length&&pair&&key(pair.reading)===key(reading)?pair:null;
      const guidance=notes.wordUsage?.[entry?.reference_key];
      const editorial=reference.examples?.[entry?.reference_key];
      const examples=guidance&&editorial?.length?editorial:entry?wordExamples({...entry,learner_examples:editorial || entry.learner_examples}):[];
      const senses=entry?.senses?.filter(sense=>!sense.forms?.length||sense.forms.includes(word));
      const type=readingWords?.partOfSpeech({...entry,word,reading});
      return {word,reading,type:guidance?.type || entry?.learner?.pos || (type?.short==='?'?'':type?.full),
        definition:guidance?.definition || entry?.learner?.definition,
        senses:senses?.length?senses.map(sense=>sense.glosses.slice(0,3).join(', ')):[meaning_en || entry?.meaning_en],
        usage:guidance?.usage || entry?.learner?.usage || entry?.example_sense_note,compare:guidance?.compare,
        examples:examples.filter(sentence=>sentence.example_en).slice(0,2).map(sentence=>wordExample(sentence,entry,true)),
        dictionaryId:entry&&index.words.has(entry.id)?entry.id:''};
    }
    function wordDetail(word) {
      if (!word) return '<p class="rdict-muted">Choose a word to read its definition and example.</p>';
      const guidance=notes.wordUsage?.[word.reference_key];
      const learner = word.learner;
      const heading = ruby(word.word,word.reading,word.word_ruby);
      const meanings = [...new Set((word.glosses?.length ? word.glosses : [word.meaning_en]).filter(Boolean))];
      const type = learner?.pos || (word.parts_of_speech || []).map(part => part.replaceAll('_',' ')).join(' · ');
      const example = learner ? annotatedRuby(learner.sentence) : ruby(word.example_ja,'',word.example_ruby);
      const forms = globalThis.KotobaWordForms?.describe(word);
      const core = forms?.sections?.find(section => section.id === 'core');
      const formMarkup = form => form?.text ? `<span lang="ja">${ruby(form.text,form.reading)}</span>` : '';
      const isVerb = forms?.kind === 'verb' || !!word.verb_group || (word.parts_of_speech || []).some(part => ['verb','suru_verb'].includes(part)) || (word.dictionary_pos || []).some(tag => /^v(?:1|2|4|5|s|k|z|n|r|u)/.test(tag));
      const formTable = section => {
        const columns=section.columns || ['Form','Plain','Polite'], paired=columns.length===3;
        return `<table class="rdict-form-table"><caption class="jp-sr">${esc(section.title)} for <span lang="ja">${esc(word.word)}</span></caption><thead><tr>${columns.map(column => `<th scope="col">${esc(column)}</th>`).join('')}</tr></thead><tbody>${section.rows.map(row => `<tr><th scope="row">${esc(row.label)}${row.note?`<span class="rdict-form-usage">${esc(row.note)}</span>`:''}</th>${row.form?`<td${paired?' colspan="2"':''}><span class="rdict-form-label" aria-hidden="true">Japanese</span>${formMarkup(row.form)}</td>`:['plain','polite'].map((style,i)=>`<td><span class="rdict-form-label" aria-hidden="true">${esc(columns[i+1])}</span>${formMarkup(row[style])}</td>`).join('')}</tr>`).join('')}</tbody></table>${(section.notes || []).map(note=>`<p class="rdict-form-section-note">${esc(note)}</p>`).join('')}`;
      };
      const conjugations = isVerb ? `<details class="rdict-forms" data-kind="verb"><summary>Conjugations</summary>${forms?.summary?`<p>${bilingual(forms.summary)}</p>`:''}${forms?.kind==='verb'?(forms.sections || []).map(section=>section.id==='core'?`<section class="rdict-form-section"><h4>${esc(section.title)}</h4>${formTable(section)}</section>`:`<details class="rdict-form-group"><summary>${esc(section.title)}</summary>${formTable(section)}</details>`).join(''):'<p class="rdict-muted">A reliable conjugation table is not available for this entry.</p>'}${(forms?.notes || []).map(note=>`<p class="rdict-form-section-note">${esc(note)}</p>`).join('')}${forms?.sources?.length?`<details class="rdict-form-sources"><summary>Conjugation sources</summary>${forms.sources.map(source=>`<p><a href="${safeUrl(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a></p>`).join('')}</details>`:''}</details>` : '';
      const table = !isVerb && core?.rows?.length && ['i-adjective','na-adjective'].includes(forms.kind) ? `<details class="rdict-forms"><summary>Useful word forms</summary><p>${bilingual(forms.summary)}</p>${formTable(core)}</details>` : '';
      const learn = index.catalogWords.has(word.id) ? action('Open word in Learn','learn',word.id) : '';
      const senses=word.senses?.length?word.senses:[{id:'local:'+word.id,glosses:meanings,pos:word.dictionary_pos || []}];
      const verified=wordExamples(word);
      for(const s of verified)if(!s.senseId){const matches=s.example_sense?senses.filter(sense=>sense.glosses.some(gloss=>key(gloss)===key(s.example_sense))):[];if(matches.length===1)s.senseId=matches[0].id;else if(senses.length===1)s.senseId=senses[0].id;}
      const label=tag=>reference.labels?.[tag] || tag;
      const senseMarkup=(sense,i)=>`<li id="rdict-sense-${i+1}" class="rdict-sense"><p class="rdict-sense-label">${esc((sense.pos || []).map(label).join(' · '))}</p><p class="rdict-gloss">${sense.glosses.map(esc).join('; ')}</p>${[...(sense.misc || []),...(sense.fields || []),...(sense.dialects || [])].length?`<p class="rdict-tags">${[...(sense.misc || []),...(sense.fields || []),...(sense.dialects || [])].map(tag=>`<span>${esc(label(tag))}</span>`).join('')}</p>`:''}${sense.forms?.length?`<p class="rdict-muted">Spelling: <span lang="ja">${sense.forms.map(esc).join(' · ')}</span></p>`:''}${(sense.notes || []).map(note=>`<p class="rdict-muted">${esc(note)}</p>`).join('')}${(sense.related || []).length?`<p class="rdict-crossrefs">Related: ${sense.related.map(link=>action(esc(link),'lookup',link.replace(/・\d+$/,'').split('・')[0],'','rdict-text-link')).join(' ')}</p>`:''}${verified.filter(s=>s.senseId===sense.id).slice(0,3).map(s=>wordExample(s,word)).join('')}</li>`;
      const extra=senses.slice(6),context=verified.filter(s=>!s.senseId);
      const kanji=[...new Set(Array.from(word.word).filter(c=>index.kanji.has(c)))];
      const spellings=[...new Set(word.alternate_forms || [])].filter(f=>f!==word.word);
      return `<article class="rdict-word-detail" aria-label="Word definition"><header><div><h3 lang="ja" tabindex="-1" id="rdict-entry-title">${heading}</h3>${heading.includes('<rt>') || word.word === word.reading ? '' : `<p lang="ja" class="rdict-muted">${esc(word.reading)}</p>`}<p class="rdict-muted">${esc(type)}${word.level?' · '+esc(word.level):word.common?' · Common word':''}${word.verb_group?' · '+esc(word.verb_group):''}</p></div>${globalThis.speechSynthesis?action('Listen','speak',word.id,'aria-label="Listen to '+esc(word.word)+'"'):''}</header>${learn?`<div class="rdict-learn">${learn}${lessonButtons(word)}</div>`:''}${conjugations}${spellings.length?`<p class="rdict-variants">Also written <span lang="ja">${spellings.map(esc).join(' · ')}</span></p>`:''}${word.other_readings?.length?`<details><summary>Other readings</summary>${word.other_readings.map(r=>`<p><span lang="ja">${esc(r.reading)}</span>${r.forms.length?` · <span lang="ja">${r.forms.map(esc).join(' / ')}</span>`:''}</p>`).join('')}</details>`:''}${learner?`<p>${bilingual(learner.definition)}</p>`:''}${word.context_only?'<p class="rdict-note">This expression comes from a study sentence. Its independent dictionary meaning has not been established.</p>':''}<section class="rdict-definitions"><h4>Dictionary meanings <span class="rdict-muted">${senses.length}</span></h4><ol class="rdict-numbered-senses">${senses.slice(0,6).map(senseMarkup).join('')}</ol>${extra.length?`<details ${extra.some(s=>s.glosses.includes(word._match?.snippet))?'open':''}><summary>More meanings (${extra.length})</summary><ol class="rdict-numbered-senses" start="7">${extra.map((s,i)=>senseMarkup(s,i+6)).join('')}</ol></details>`:''}</section>${guidance?.usage || learner?.usage || word.example_sense_note?`<p class="rdict-note">${bilingual(guidance?.usage || learner?.usage || word.example_sense_note)}</p>`:''}${guidance?.compare?`<p class="rdict-note">${bilingual(guidance.compare)}</p>`:''}${context.length?`<section><h4>Examples in context</h4>${context.slice(0,3).map(s=>wordExample(s,word)).join('')}</section>`:''}${!verified.length?`<p class="rdict-muted">${word.example_ja?'The saved example needs a target-word check before it can be shown here.':'No example sentence is bundled for this word.'}</p>`:''}${table}${kanji.length?`<section class="rdict-word-kanji"><h4>Kanji in this word</h4>${kanji.map(c=>action(`<span lang="ja">${esc(c)}</span> ${esc(index.kanji.get(c).meanings_en.join('; '))}`,'select',c)).join('')}</section>`:''}<details class="rdict-sources"><summary>Word sources &amp; notes</summary>${word.jmdict_id?`<p>JMdict entry ${esc(word.jmdict_id)} · <a href="https://www.edrdg.org/jmdict/j_jmdict.html" target="_blank" rel="noopener noreferrer">EDRDG / James Breen</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Sense order, grammatical labels and spelling restrictions are retained from the bundled reference.</p>`:'<p>Bundled RiNO reference and learner explanations.</p>'}<p>Highlighting checks the written form and reading. It does not certify translation or sense accuracy. New RiNO examples await native-speaker review.</p>${word.spelling_notes?.map(n=>`<p><span lang="ja">${esc(n.word)}</span>: ${n.tags.map(label).map(esc).join('; ')}</p>`).join('') || ''}${word.notes?`<p>${bilingual(word.notes)}</p>`:''}</details></article>`;
    }
    function wordExample(sentence,word,compact=false){
      const occurrence=sentence.occurrence;let offset=0;
      const marked=(sentence.example_ruby || []).map(token=>{const start=offset,end=offset+token.text.length;offset=end;if(end<=occurrence.start||start>=occurrence.end)return ruby(token.text,'',[token]);if(token.reading)return `<mark class="rdict-target">${ruby(token.text,'',[token])}</mark>`;const a=Math.max(0,occurrence.start-start),b=Math.min(token.text.length,occurrence.end-start);return esc(token.text.slice(0,a))+`<mark class="rdict-target">${esc(token.text.slice(a,b))}</mark>`+esc(token.text.slice(b));}).join('');
      const form=compact&&occurrence.surface===word.word?'':`<p class="rdict-form-note"><span lang="ja">${esc(occurrence.surface)}</span> · ${esc(occurrence.form)}${occurrence.surface!==word.word?` of <span lang="ja">${esc(word.word)}</span>`:''}</p>`;
      return `<section class="rdict-example"><p lang="ja" class="rdict-sentence">${marked}</p><p>${esc(sentence.example_en)}</p>${form}${!sentence.senseId&&sentence.example_sense?`<p class="rdict-muted">Context meaning: ${esc(sentence.example_sense)}</p>`:''}<small>${esc(sentence.example_source || 'Original RiNO example')}${sentence.example_source_url?` · <a href="${safeUrl(sentence.example_source_url)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`:''}${sentence.english_source_url?` · <a href="${safeUrl(sentence.english_source_url)}" target="_blank" rel="noopener noreferrer">Translation source ↗</a>`:''}${sentence.example_license?' · '+esc(sentence.example_license):''}</small></section>`;
    }
    function exampleSentenceMarkup(sentence,note) {
      const context = note?.contexts?.[sentence.target_word];
      const meaning = context?.meaning || sentence.target_meaning_en;
      const targetId=index.pairs.get(key(sentence.target_word)+'\0'+key(sentence.target_reading));
      const target = sentence.target_word && sentence.target_reading ? `<p class="rdict-example-target">${targetId?action(`<span lang="ja">${ruby(sentence.target_word,sentence.target_reading)}</span>`,'search-word',targetId):`<span lang="ja">${ruby(sentence.target_word,sentence.target_reading)}</span>`}${meaning ? `<span>${esc(meaning)}</span>` : ''}</p>` : '';
      return `<div class="rdict-example">${context?.sense ? `<p class="rdict-context-sense">${esc(context.sense)}</p>` : ''}${target}${context?.explanation ? `<p class="rdict-context-explanation">${bilingual(context.explanation)}</p>` : ''}<p class="rdict-sentence" lang="ja">${ruby(sentence.example_ja,'',sentence.example_ruby)}</p><p>${esc(sentence.example_en)}</p>${sentence.note_en ? `<p class="rdict-muted">${bilingual(sentence.note_en)}</p>` : ''}<small>${esc(sentence.example_source || sentence.provenance || 'Original RiNO example')}${sentence.example_source_url ? ` · <a href="${safeUrl(sentence.example_source_url)}" target="_blank" rel="noopener noreferrer">Sentence source ↗</a>` : ''}${sentence.english_source_url ? ` · <a href="${safeUrl(sentence.english_source_url)}" target="_blank" rel="noopener noreferrer">Translation source ↗</a>` : ''}${sentence.example_license ? ' · ' + esc(sentence.example_license) : ''}</small></div>`;
    }
    function meaningMarkup(k,note,words) {
      const sentences = k.example_sentences || [];
      const candidates = [], included = new Set();
      for (const word of [...words,...sentences.filter(sentence => sentence.target_word && sentence.target_reading).map(sentence => ({word:sentence.target_word,reading:sentence.target_reading,meaning_en:sentence.target_meaning_en || ''}))]) {
        const pair = key(word.word) + '\u0000' + key(word.reading);
        if (!included.has(pair)) { included.add(pair); candidates.push(word); }
      }
      const parts = new Map(candidates.map(word => [word,readingWords?.readingParts(word)]));
      const examplesFor = (readings,type) => [...new Set(readings)].map(reading => {
        const rootReading = key(reading.split('.')[0].replaceAll('-',''));
        // Use the shared complete-word alignment. Whole-compound ruby alone
        // cannot establish which character supplies a particular sound.
        const examples = candidates.filter(word => rootReading && (parts.get(word)?.some(part => part.text === k.character && part.type === type && key(part.reading) === rootReading) ||
          word.word === k.character && key(word.reading) === rootReading)).slice(0,2);
        return `<div><dt lang="ja">${esc(reading)}</dt><dd>${examples.map(word => {
          const heading = word.word === k.character ? esc(word.word) : ruby(word.word,word.reading,parts.get(word) || word.word_ruby);
          const gloss = note?.contexts?.[word.word]?.meaning || word.meaning_en;
          const content = `<span lang="ja">${heading}</span>${gloss ? `<span class="rdict-reading-gloss">${esc(gloss)}</span>` : ''}`;
          const indexed = word.id ? word : getWord(index.pairs.get(key(word.word)+'\0'+key(word.reading)));
          return indexed ? action(content,'search-word',indexed.id,'','rdict-reading-example') : `<div class="rdict-reading-example">${content}</div>`;
        }).join('') || '<span class="rdict-muted">No verified word example for this reading yet.</span>'}</dd></div>`;
      }).join('');
      const meanings = note?.senses ? `<dl class="rdict-senses">${note.senses.map(([sense,explanation]) => `<div><dt>${esc(sense)}</dt><dd>${bilingual(explanation)}</dd></div>`).join('')}</dl>` : `<p class="rdict-usage">${bilingual(k.usage_en || 'The complete word determines the meaning. Learn the readings with the words below.')}</p>`;
      return `<section aria-label="Meanings and readings"><div class="rdict-meaning-overview"><section><h3>Meaning &amp; use</h3>${meanings}${note?.extra ? `<details><summary>Further senses &amp; less common uses</summary><p>${bilingual(note.extra)}</p></details>` : ''}</section>${sentences.length ? `<section class="rdict-context"><h3>Example in context</h3>${exampleSentenceMarkup(sentences[0],note)}${sentences.length > 1 ? `<details><summary>More example sentences</summary>${sentences.slice(1).map(sentence => exampleSentenceMarkup(sentence,note)).join('')}</details>` : ''}</section>` : ''}</div><section class="rdict-readings-section"><h3>Readings</h3><div class="rdict-readings-grid">${[['on','On readings','音読み'],['kun','Kun readings','訓読み']].map(([type,label,japanese]) => `<section><h4>${label} <span lang="ja">${japanese}</span></h4>${k[type + '_readings']?.length ? `<dl class="rdict-readings">${examplesFor(k[type + '_readings'],type)}</dl>` : '<p class="rdict-muted">None listed.</p>'}</section>`).join('')}</div><details class="rdict-reading-notes"><summary>About these readings</summary><p>${bilingual(note?.readingNote || 'On readings come from Chinese; kun readings are native Japanese. A dot marks the kana ending written after a kanji; a hyphen marks an attached reading. The list contains selected dictionary readings.')}</p>${note?.onExamples ? `<p>${bilingual(note.onExamples)}</p>` : ''}${note?.kunExamples ? `<p>${bilingual(note.kunExamples)}</p>` : ''}</details></section>${renderAnime(k)}${action('Explore words & examples','view','words')}${sourceMarkup(k,note)}</section>`;
    }
    function wordsMarkup(k,words) {
      const pageSize = WORD_PAGE_SIZE;
      const pages = Math.max(1,Math.ceil(words.length / pageSize));
      wordPage = Math.min(Math.max(0,wordPage),pages - 1);
      return `<div><h3>Words containing <span lang="ja">${esc(k.character)}</span> · ${words.length}</h3><div class="rdict-word-list" role="group" aria-label="Choose a vocabulary entry">${words.slice(wordPage*pageSize,wordPage*pageSize+pageSize).map(item=>action(`<span lang="ja">${ruby(item.word,item.reading,item.word_ruby)}</span><span>${esc(item.meaning_en)}</span>`,'search-word',item.id,'','rdict-word')).join('') || '<p>No related words are bundled yet.</p>'}</div>${pagination('word-page',wordPage,words.length,pageSize,'Vocabulary')}</div>`;
    }
    function writingMarkup(k,note) {
      const radical = k.radical;
      const components = k.components || [];
      const paths = resources.characters?.[k.character]?.paths;
      if (paths?.length && globalThis.KotobaStrokeLesson) strokeLesson = globalThis.KotobaStrokeLesson.create({paths,strokeNumbers:resources.characters[k.character].strokeNumbers,character:k.character,actionPrefix:'dict-stroke-',initiallyComplete:true,initialSpeed:3,speedOptions:[3],compactControls:true});
      const related = note?.related || [];
      return `<section class="rdict-writing" aria-label="Writing reference"><div class="rdict-writing-grid"><section class="rdict-stroke"><h3>Stroke order · ${k.stroke_count} strokes</h3>${strokeLesson ? `<div class="pr-lesson-controller">${strokeLesson.renderDiagram({esc})}${strokeLesson.renderControls({esc,button})}${strokeLesson.renderSequence({esc,button})}</div>` : `<p>No inline stroke diagram is bundled.</p><a href="${safeUrl(k.stroke_order_url)}" target="_blank" rel="noopener noreferrer">Stroke-order reference ↗</a>`}</section><section><h3>Radical &amp; components</h3><dl class="rdict-parts"><div><dt>Dictionary radical</dt><dd>${radical ? `<span lang="ja">${esc(radical.form || radical.character)}</span> · ${esc(radical.meaning_en)} · #${radical.number}` : 'Not listed'}</dd></div><div><dt>Visible components</dt><dd>${components.length ? components.map(part => `<span lang="ja">${esc(part.form || part.character)}</span> · ${esc(part.meaning_en)}`).join('<br>') : bilingual(note?.components || 'The character is shown as one complete shape.')}</dd></div></dl><p class="rdict-muted">A radical indexes a dictionary entry; components describe its visible shapes.</p>${note?.shape ? `<p class="rdict-note">${bilingual(note.shape)}</p>` : ''}</section></div>${related.length ? `<h3>Distinguish similar kanji</h3><div class="rdict-related">${related.map(([character,description]) => action(`<span lang="ja">${esc(character)}</span><span>${bilingual(description)}</span>`,'select',character,'','rdict-related-item')).join('')}</div>` : ''}${k.mnemonic_en ? `<details><summary>Memory aid</summary><p>${bilingual(k.mnemonic_en)}</p><p class="rdict-muted">An imagined memory aid, separate from historical etymology.</p></details>` : ''}${sourceMarkup(k,note)}</section>`;
    }
    function entryMarkup() {
      destroyLesson();
      const k = index.kanji.get(state.character);
      if(state.wordId&&state.view==='words'){
        const related=state.character?relatedWords(state.character).find(w=>w.id===state.wordId):null;
        const word=related || getWord(state.wordId);
        return `<section class="rdict-entry">${word?wordDetail(word):`<p role="status">${referenceFailed?'This entry needs the full reference, which is unavailable. Reconnect and reopen Dictionary, or return to the available results.':'Loading this reference entry…'}</p>`}</section>`;
      }
      if (!state.character) {
        const word = getWord(state.wordId);
        return word ? `<section class="rdict-entry">${wordDetail(word)}</section>` : `<section class="rdict-empty"><h2>${state.query?'Choose a result':'Find a word or kanji'}</h2><p>${state.query?'Select a word for meanings and examples, or a kanji for readings and writing.':'Search Japanese, English or a romaji reading. Inflected forms such as 食べました also work.'}</p></section>`;
      }
      if (!k) return `<section class="rdict-empty"><h2 lang="ja">${esc(state.character)}</h2><p>This character’s entry is not in RiNO’s offline catalogue yet.</p><a href="https://jisho.org/search/${encodeURIComponent(state.character + ' #kanji')}" target="_blank" rel="noopener noreferrer">Open a dictionary reference ↗</a></section>`;
      const note = noteFor(k.character), words = relatedWords(k.character);
      return `<article class="rdict-entry"><header class="rdict-entry-heading"><span class="rdict-character" lang="ja">${esc(k.character)}</span><div><h2>${esc(note?.meaning || k.meanings_en.join('; '))}</h2><p class="rdict-muted">${esc(k.level)} · ${k.stroke_count} strokes${k.radical ? ' · radical ' + esc(k.radical.form || k.radical.character) : ''}</p><div class="rdict-learn">${action('Open in Learn','learn',k.id)}${lessonButtons(k)}</div></div></header><nav class="rdict-entry-nav" aria-label="Dictionary entry sections">${[['meaning','Meaning'],['words','Words'],['writing','Writing']].map(([value,label]) => action(label,'view',value,`aria-pressed="${state.view === value}"`)).join('')}</nav><div id="rdict-entry-body">${state.view === 'words' ? wordsMarkup(k,words) : state.view === 'writing' ? writingMarkup(k,note) : meaningMarkup(k,note,words)}</div></article>`;
    }
    function render() {
      return `<section class="rdict-app" data-entry-open="${entryOpen}"><header class="rdict-heading"><h1 id="rdict-title" tabindex="-1">Dictionary</h1><p>Words, meanings and examples · Kanji readings and writing</p></header><section class="rdict-lookup" aria-label="Dictionary lookup"><form id="rdict-search-form" role="search"><label for="rdict-search">Search Japanese, English or romaji</label><div><input type="search" id="rdict-search" maxlength="120" value="${esc(searchDraft)}" autocomplete="off" spellcheck="false" placeholder="学校 · 食べました · gakkou · water">${action('Search','search','','','rdict-search-submit')}</div></form><div class="rdict-lookup-options"><div class="rdict-search-modes" role="group" aria-label="Search language">${[['auto','Auto'],['japanese','Japanese'],['english','English'],['romaji','Romaji']].map(([mode,label])=>action(label,'mode',mode,`aria-pressed="${searchMode===mode}"`)).join('')}</div><details class="rdict-handwriting" ${handwritingOpen?'open':''}><summary>Draw a kanji</summary><div class="rdict-handwriting-body"><div class="rdict-pad-wrap"><svg id="rdict-pad" viewBox="0 0 109 109" role="img" aria-label="Kanji drawing area"><path class="rdict-guides" d="M54.5 4V105M4 54.5H105"/><text id="rdict-selected-glyph" class="rdict-selected-glyph" x="54.5" y="51" text-anchor="middle" dominant-baseline="central" lang="ja">${!ink.length&&state.character?esc(state.character):''}</text><g id="rdict-ink"></g></svg><div class="rdict-tools">${action('Undo','undo')}${action('Clear','clear')}</div></div>${action('Find matches','find','','','rdict-primary')}</div></details></div><p id="rdict-status" class="rdict-status" role="status" aria-live="polite">${esc(message)}</p><p class="rdict-reference-status" id="rdict-reference-status">${esc(referenceStatus)}</p></section><div class="rdict-workspace"><aside class="rdict-results" aria-label="Dictionary results"><div id="rdict-word-matches">${searchWordMarkup()}</div><div class="rdict-matchbar"><h2 class="rdict-match-heading">Kanji <span id="rdict-kanji-total">${matches.length}</span></h2><div id="rdict-matches">${candidateMarkup()}</div></div></aside><div class="rdict-detail-pane">${action('Back to results','back','','','rdict-back')}<div id="rdict-entry">${entryMarkup()}</div></div></div></section>`;
    }
    function patchMatches() {
      if (!host?.isConnected) return;
      host.querySelector('#rdict-matches').innerHTML = candidateMarkup();
      host.querySelector('#rdict-word-matches').innerHTML = searchWordMarkup();
      const total=host.querySelector('#rdict-kanji-total');if(total)total.textContent=matches.length;
      host.setAttribute?.('data-entry-open',String(entryOpen));
    }
    function patchEntry() {
      if (!host?.isConnected) return;
      const previous = root.ownerDocument.activeElement;
      const focus = previous?.dataset?.action?.startsWith('dict-') ? {action:previous.dataset.action,value:previous.dataset.value} : null;
      host.querySelector('#rdict-entry').innerHTML = entryMarkup();
      host.setAttribute?.('data-entry-open',String(entryOpen));
      strokeLesson?.mount(host.querySelector('.rdict-stroke'));
      if (focus) {
        const controls = [...host.querySelectorAll('button[data-action]')];
        let restored = controls.find(node => node.dataset.action === focus.action && node.dataset.value === focus.value && !node.disabled);
        if (!restored && focus.action === 'dict-word-page') restored = controls.find(node => node.dataset.action === 'dict-word-page' && !node.disabled) || controls.find(node => node.dataset.action === 'dict-view' && node.dataset.value === 'words');
        restored?.focus({preventScroll:true});
      }
    }
    function updateTools() {
      if (!host?.isConnected) return;
      for (const action of ['find','undo','clear']) { const node = host.querySelector('[data-action="dict-' + action + '"]'); if (node) node.disabled = !ink.length || action === 'find' && !!pending; }
      const find = host.querySelector('[data-action="dict-find"]'); if (find) find.textContent = pending ? 'Finding matches…' : 'Find matches';
    }
    function paint() {
      const group = host?.querySelector('#rdict-ink');
      if (!group) return;
      const glyph = host.querySelector('#rdict-selected-glyph');
      if (glyph) glyph.textContent = !ink.length && state.character ? state.character : '';
      pad?.setAttribute('aria-label','Kanji drawing area' + (!ink.length && state.character ? ' · selected ' + state.character + '. Draw to start a new lookup.' : ''));
      group.innerHTML = ink.map(stroke => `<path d="${stroke.map(([x,y],index) => (index ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)).join(' ')}"/>`).join('');
      updateTools();
    }
    function mount() {
      host = root.querySelector('.rdict-app'); if (!host) return;
      draftReset = false;
      pad = host.querySelector('#rdict-pad');
      padController?.abort(); padController = new AbortController();
      const options = {signal:padController.signal};
      const point = event => { const rect = pad.getBoundingClientRect(); return [Math.max(0,Math.min(109,(event.clientX - rect.left) / rect.width * 109)),Math.max(0,Math.min(109,(event.clientY - rect.top) / rect.height * 109))]; };
      pad.addEventListener('pointerdown',event => {
        if (event.button !== 0 || activeStroke) return;
        if (ink.length >= 40) { announce('This drawing has 40 strokes. Undo or clear it to continue.'); return; }
        event.preventDefault(); cancelLookup();
        pad.setPointerCapture(event.pointerId); activeStroke = {pointer:event.pointerId,points:[point(event)]}; ink.push(activeStroke.points); paint();
      },options);
      pad.addEventListener('pointermove',event => { if (!activeStroke || activeStroke.pointer !== event.pointerId || activeStroke.points.length >= 900) return; activeStroke.points.push(point(event)); paint(); },options);
      const end = event => { if (!activeStroke || activeStroke.pointer !== event.pointerId) return; if (activeStroke.points.length === 1) activeStroke.points.push(activeStroke.points[0].slice()); activeStroke = null; paint(); saveWorkspace(); };
      for (const name of ['pointerup','pointercancel','lostpointercapture']) pad.addEventListener(name,end,options);
      host.querySelector('#rdict-search-form').addEventListener('submit',event => { event.preventDefault(); search(); },options);
      const field = host.querySelector('#rdict-search');
      host.querySelector('.rdict-handwriting')?.addEventListener('toggle',event=>{handwritingOpen=event.currentTarget.open;},options);
      field.addEventListener('input',captureInput,options);
      field.addEventListener('select',captureInput,options);
      field.addEventListener('compositionstart',() => { composing = true; captureInput(); },options);
      field.addEventListener('compositionend',() => { composing = false; captureInput(); },options);
      if (draftFocused) field.focus({preventScroll:true});
      if (draftSelection && !composing) field.setSelectionRange?.(draftSelection.start,draftSelection.end,draftSelection.direction);
      paint(); strokeLesson?.mount(host.querySelector('.rdict-stroke'));
      startReference();
    }
    async function find() {
      if (!ink.length || activeStroke || pending) return;
      pending = new AbortController(); const controller = pending, version = ++requestVersion;
      announce('Preparing handwriting lookup…'); updateTools();
      const result = await globalThis.KotobaRecognition.lookup({strokes:ink,signal:controller.signal,onProgress:progress => {
        if (version !== requestVersion || controller.signal.aborted) return;
        announce(progress.phase === 'checking' ? 'Finding possible kanji…' : progress.downloadedBytes ? 'Loading handwriting data · ' + (progress.downloadedBytes / 1048576).toFixed(1) + ' MB received…' : 'Loading handwriting data…');
      }});
      if (version !== requestVersion || controller.signal.aborted) return;
      pending = null; matches = result.candidates.map(candidate => candidate.character);keptDrawingMatches=matches.slice();searchWords = [];keptWordMatches=[];wordTotal=0;searchBusy=false;extendedPage=null;entryOpen=false;state.character=null;state.wordId=null;kanjiPage=0;workerRequest++;patchMatches();patchEntry(); updateTools(); saveWorkspace(); announce(result.message || 'Try drawing the kanji again.');
    }
    function search() {
      cancelLookup(); stopSpeaking();
      state.query = (host?.querySelector('#rdict-search')?.value ?? state.query).trim().slice(0,120);
      searchDraft = state.query;
      state.character=null;state.wordId=null;entryOpen=false;searchPage=0;pendingPage=null;kanjiPage=0;keptDrawingMatches=[];keptWordMatches=[];
      runSearch();patchEntry();
      changed();
    }
    function resultMessage(){announce(!state.query?'Enter a word, reading or meaning.':matches.length||wordTotal?`${wordTotal.toLocaleString()} words · ${matches.length} kanji. Choose a result.`:'No entries found. Try another spelling or search language.');}
    function runSearch(resolvedMode,pageOnly=false){
      if(pageOnly&&workerReady){extendedPage=null;searchBusy=true;patchMatches();announce('Searching the full dictionary…');requestFullSearch(lastSearchMode,false);return;}
      const result=index.search(state.query,{mode:resolvedMode || searchMode});coreResults=result.words;searchWords=result.words;matches=result.kanji.map(k=>k.character);
      if(keptWordMatches.length)searchWords=[...keptWordMatches,...searchWords.filter(w=>!keptWordMatches.some(saved=>saved.id===w.id))];
      if(keptDrawingMatches.length)matches=[...new Set([...keptDrawingMatches,...matches])];
      if(han(state.query)&&!matches.includes(state.query))matches.unshift(state.query);
      extendedPage=null;wordTotal=searchWords.length;
      if(!workerReady)searchPage=Math.min(searchPage,Math.max(0,Math.ceil(wordTotal/WORD_PAGE_SIZE)-1));
      searchBusy=!!(workerReady&&state.query);lastSearchMode=result.mode;
      patchMatches();if(searchBusy)announce('Common matches shown while the full dictionary is searched…');else resultMessage();
      if(searchBusy)requestFullSearch(result.mode,searchMode==='auto'&&!resolvedMode);
      else workerRequest++;
    }
    function requestFullSearch(mode,automatic){worker.postMessage({type:'search',request:++workerRequest,query:state.query,mode,automatic,page:searchPage,pageSize:WORD_PAGE_SIZE,core:coreResults.map(w=>({id:w.id,reference_key:w.reference_key,score:w._match?.score||0,word:w.word}))});}
    function referenceMessage(text){referenceStatus=text;const node=host?.querySelector('#rdict-reference-status');if(node)node.textContent=text;}
    function startReference(){
      if(worker||!reference.extended||typeof Worker==='undefined')return;
      try{
        referenceFailed=false;
        worker=new Worker(new URL(reference.extended.workerPath,globalThis.location.href));
        referenceMessage('Study words ready · Loading the complete dictionary…');
        worker.onmessage=({data:reply})=>{
          if(reply.type==='ready'){workerReady=true;referenceMessage(`Full dictionary · ${reply.entries.toLocaleString()} source entries`);if(pendingPage!==null){searchPage=pendingPage;pendingPage=null;}if(state.query)runSearch();if(state.wordId&&!getWord(state.wordId))worker.postMessage({type:'entry',id:state.wordId});}
          else if(reply.type==='results'&&reply.request===workerRequest){if(reply.resolvedMode){runSearch(reply.resolvedMode);return;}searchBusy=false;wordTotal=reply.total;searchPage=reply.page;extendedPage=reply.items.map(result=>{if(result.coreId)return coreResults.find(w=>w.id===result.coreId);index.register(result.word);return result.word;}).filter(Boolean);patchMatches();resultMessage();saveWorkspace();}
          else if(reply.type==='entry'&&reply.id===state.wordId){if(reply.word){index.register(reply.word);patchEntry();}else{state.wordId=null;patchEntry();announce('This reference entry is unavailable.');}}
          else if(reply.type==='error'){workerReady=false;searchBusy=false;referenceFailed=true;referenceMessage('Common vocabulary is available. The complete reference is unavailable; reconnect and reopen Dictionary to retry.');worker?.terminate();worker=null;runSearch();if(state.wordId&&!getWord(state.wordId))patchEntry();}
        };
        worker.onerror=()=>{workerReady=false;searchBusy=false;referenceFailed=true;referenceMessage('Common vocabulary is available. The complete reference could not load.');worker?.terminate();worker=null;runSearch();if(state.wordId&&!getWord(state.wordId))patchEntry();};
        worker.postMessage({type:'init',reference:reference.extended.reference});
      }catch{worker=null;referenceFailed=true;referenceMessage('Common vocabulary is available on this device.');if(state.wordId&&!getWord(state.wordId))patchEntry();}
    }
    function select(character) {
      if (!han(character)) return;
      stopSpeaking(); state.character = character; state.wordId = null; state.view='meaning';wordPage = 0;entryOpen=true;
      patchMatches(); patchEntry(); paint(); announce('Opened ' + character + (ink.length ? '. Your drawing is kept.' : '. Draw or search to look up another kanji.')); changed();
      revealEntry();
    }
    function selectWord(id,fromSearch = false) {
      const word = getWord(id); if (!word) return;
      stopSpeaking();
      if (fromSearch) { state.character = null; wordPage = 0; }
      if (state.character) {
        const words = relatedWords(state.character);
        wordPage = Math.floor(Math.max(0,words.findIndex(item => item.id === id)) / WORD_PAGE_SIZE);
      }
      state.wordId = id; state.view = 'words';entryOpen=true;
      patchMatches(); patchEntry(); paint(); announce('Opened ' + word.word + '.'); changed();
      revealEntry();
    }
    function revealEntry(){host?.querySelector('#rdict-entry-title')?.focus({preventScroll:true});if(host?.clientWidth<680)host.querySelector('.rdict-detail-pane')?.scrollIntoView?.({block:'start'});}
    function speak(id) {
      const word = getWord(id); if (!word || !globalThis.speechSynthesis) return;
      const voice = globalThis.speechSynthesis.getVoices().find(voice => /^ja(?:-|_)/i.test(voice.lang) || voice.lang === 'ja');
      if (!voice) { announce('Japanese audio is unavailable on this device. The kana reading is shown in the entry.'); return; }
      stopSpeaking();
      const utterance = new SpeechSynthesisUtterance(word.reading.split(/\s*\/\s*/)[0]); speaking = utterance;
      utterance.voice = voice; utterance.lang = 'ja-JP'; utterance.rate = .85;
      utterance.onend = () => { if (speaking === utterance) speaking = null; };
      utterance.onerror = () => { if (speaking === utterance) { speaking = null; announce('Audio could not play. The kana reading is shown in the entry.'); } };
      globalThis.speechSynthesis.speak(utterance);
    }
    function handle(name,value) {
      if (!name.startsWith('dict-')) return false;
      if (name.startsWith('dict-stroke-')) { strokeLesson?.action(name,value); return true; }
      if (name === 'dict-find') { void find(); return true; }
      if (name === 'dict-search') search();
      else if(name==='dict-mode'&&['auto','english','japanese','romaji'].includes(value)){searchMode=value;for(const control of host?.querySelectorAll('[data-action="dict-mode"]') || [])control.setAttribute('aria-pressed',String(control.dataset.value===value));search();}
      else if(name==='dict-lookup'){state.query=value;searchDraft=value;const field=host?.querySelector('#rdict-search');if(field)field.value=value;search();}
      else if(name==='dict-back'){entryOpen=false;patchMatches();host?.querySelector('[data-action="dict-search-word"][aria-pressed="true"]')?.focus();}
      else if(name==='dict-result-page'&&!searchBusy&&['next','previous'].includes(value)){searchPage=Math.max(0,Math.min(Math.ceil(wordTotal/WORD_PAGE_SIZE)-1,searchPage+(value==='next'?1:-1)));runSearch(undefined,true);saveWorkspace();}
      else if(name==='dict-kanji-page'&&['next','previous'].includes(value)){kanjiPage=Math.max(0,Math.min(Math.ceil(matches.length/12)-1,kanjiPage+(value==='next'?1:-1)));patchMatches();}
      else if (name === 'dict-select') select(value);
      else if (name === 'dict-word' || name === 'dict-search-word') selectWord(value,name === 'dict-search-word');
      else if (name === 'dict-speak') speak(value);
      else if (name === 'dict-learn') { const item = index.catalogWords.get(value) || [...index.kanji.values()].find(item => item.id === value); if (item) onLearn(item); }
      else if (name === 'dict-view' && ['meaning','words','writing'].includes(value)) { stopSpeaking(); state.view = value;state.wordId=null;patchEntry(); changed(); }
      else if (name === 'dict-word-page' && ['previous','next'].includes(value)) {
        wordPage = Math.max(0,wordPage + (value === 'next' ? 1 : -1)); patchEntry();
        const pages = Math.max(1,Math.ceil(relatedWords(state.character).length / WORD_PAGE_SIZE));
        announce(`Word page ${wordPage + 1} of ${pages}.`);
      }
      else if (name === 'dict-clear' || name === 'dict-undo') {
        cancelLookup(); activeStroke = null;
        if (name === 'dict-clear') ink = []; else ink.pop();
        paint(); saveWorkspace(); announce(ink.length ? 'Find matches for this drawing.' : 'Drawing cleared. Draw again to start a new lookup.');
      }
      return true;
    }
    function navigate(input) {
      captureInput(); stopSpeaking();
      const next = normalize(input);
      const previousQuery = state.query;
      const sameView = navigationInitialized && Object.keys(next).every(name => next[name] === state[name]);
      navigationInitialized = true;
      state = next;
      if(previousQuery!==state.query)pendingPage=null;
      if(state.wordId&&index.aliases.has(state.wordId))state.wordId=index.aliases.get(state.wordId);
      if (!sameView) { searchDraft = state.query; draftSelection = null; draftFocused = false; composing = false; draftReset = true; wordPage = 0;entryOpen=!!(state.wordId||state.character);if(previousQuery!==state.query){searchPage=0;kanjiPage=0;} }
      const words = state.character ? relatedWords(state.character) : [];
      if (state.wordId && !getWord(state.wordId) && !(reference.extended&&state.wordId.startsWith('jm:'))) state.wordId = null;
      if (!sameView && state.wordId) wordPage = Math.floor(Math.max(0,words.findIndex(item => item.id === state.wordId)) / WORD_PAGE_SIZE);
      if (!sameView) {
        if (!state.query && !previousQuery) announce(ink.length ? 'Your drawing and last matches are kept.' : state.character ? 'Showing ' + state.character + '. Draw in the square to look up another kanji.' : 'Draw one kanji, or search by kanji, kana, romaji or English.');
        if (state.query) {
          runSearch();
        }
        else {
          searchWords = [];wordTotal=0;searchBusy=false;extendedPage=null;workerRequest++;
          if (previousQuery) { matches = []; announce(state.character ? 'Opened ' + state.character + '. Your drawing is kept.' : 'Draw one kanji, or search by kanji, kana, romaji or English.'); }
        }
      }
      if(workerReady&&state.wordId&&!getWord(state.wordId))worker.postMessage({type:'entry',id:state.wordId});
    }
    navigate(state);
    return {render,mount,beforeRender,handle,navigate,wordHelp,navigation:() => ({...state}),hasActiveInput:() => !!activeStroke || !!pending || composing,
      announcement:() => 'Dictionary · all levels' + (state.character ? ' · ' + state.character : ''),
      // Read-only snapshots support regression checks without saving ink to progress.
      drawing:() => ink.map(stroke => stroke.map(point => point.slice()))};
  }
  globalThis.RinoDictionary = Object.freeze({create,createIndex,normalize,key,romanize,romajiKeys,englishMatch,inflections,deinflectCandidates});
})();
