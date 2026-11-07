/* Shared, DOM-free dictionary reference. JMdict tuples:
 * entry [id, spellings, readings, senses]; spelling [text, info, priority];
 * reading [text, allowedSpellings, noKanji, info, priority];
 * sense [number, glosses, pos, spellings, readings, misc, field, dialect,
 *        notes, related, antonyms, loanSources]. Missing arrays mean [].
 * Never use reference IDs as lesson IDs or merge different source entries.
 */
(() => {
  'use strict';
  const norm = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c => String.fromCharCode(c.charCodeAt(0)-96));
  const identity = (id,reading) => String(id) + ':' + String(reading || '').normalize('NFKC');
  const readingId = reading => {let hash=14695981039346656037n;for(const c of reading){hash^=BigInt(c.codePointAt(0));hash=BigInt.asUintN(64,hash*1099511628211n);}return hash.toString(16);};
  const pair = (word,reading) => norm(word) + '\0' + norm(reading);
  const allowedForms = (entry,reading) => reading[2] ? [] : entry[1].filter(form => !reading[1]?.length || reading[1].includes(form[0]));
  function expand(entry,reading = entry[2][0]) {
    const forms = allowedForms(entry,reading), spellings = forms.map(form => form[0]);
    const senses = entry[3].filter(sense => (!sense[4]?.length || sense[4].includes(reading[0])) && (!sense[3]?.length || sense[3].some(form => spellings.includes(form)))).map(sense => ({
      id:'jm:' + entry[0] + ':s' + sense[0],glosses:sense[1],pos:sense[2] || [],forms:sense[3] || [],readings:sense[4] || [],
      misc:sense[5] || [],fields:sense[6] || [],dialects:sense[7] || [],notes:sense[8] || [],related:sense[9] || [],antonyms:sense[10] || [],loans:sense[11] || []
    }));
    const pos=[...new Set(senses.flatMap(s => s.pos))], glosses=[...new Set(senses.flatMap(s => s.glosses))];
    return {id:'jm:' + entry[0] + ':' + readingId(reading[0]),jmdict_id:entry[0],reference_key:identity(entry[0],reading[0]),
      word:spellings[0] || reading[0],reading:reading[0],alternate_forms:spellings.slice(1),senses,glosses,meaning_en:glosses[0] || '',dictionary_pos:pos,
      parts_of_speech:pos.some(p=>p.startsWith('v'))?['verb']:pos.some(p=>p.startsWith('adj'))?['adjective']:pos.includes('n')?['noun']:[],
      verb_group:pos.includes('v1')?'ichidan':pos.some(p=>p.startsWith('v5'))?'godan':pos.some(p=>p==='vk'||p.startsWith('vs'))?'irregular':undefined,
      common:forms.some(f=>f[2]?.some(p=>/^(news1|ichi1|spec1|gai1)$/.test(p))) || !!reading[4]?.some(p=>/^(news1|ichi1|spec1|gai1)$/.test(p)),
      spelling_notes:forms.filter(f=>f[1]?.length).map(f=>({word:f[0],tags:f[1]})),reading_notes:reading[3] || [],
      other_readings:entry[2].filter(r=>r!==reading).map(r=>({reading:r[0],forms:allowedForms(entry,r).map(f=>f[0])})),source:'JMdict / EDRDG'};
  }
  function create(source = {}) {
    const words=[], byIdentity=new Map(), byPair=new Map();
    for(const entry of source.entries || []) for(const reading of entry[2]) {
      const word=expand(entry,reading); if(!word.senses.length)continue;
      words.push(word);if(!byIdentity.has(word.reference_key))byIdentity.set(word.reference_key,word);
      for(const form of [word.word,...word.alternate_forms]) {const k=pair(form,word.reading);if(!byPair.has(k))byPair.set(k,[]);byPair.get(k).push(word);}
    }
    const resolve = item => byIdentity.get(identity(item.jmdict_id,item.reading)) || (byPair.get(pair(item.word,item.reading)) || []).find(word=>!item.jmdict_id || word.jmdict_id===String(item.jmdict_id));
    return {words,byIdentity,byPair,resolve,labels:source.labels || {},source:source.source};
  }
  // Evidence is an exact surface + reading span, including conjugated forms.
  // A structural match is not a claim of human linguistic review.
  function occurrence(word,sentence = word,formsAPI = globalThis.KotobaWordForms) {
    const text=sentence.example_ja || '', tokens=sentence.example_ruby || [];
    if(!text || tokens.map(t=>t.text).join('')!==text)return null;
    const points=new Map([[0,'']]);let offset=0,reading='';
    for(const token of tokens){
      if(!token.reading)for(let i=1;i<token.text.length;i++)points.set(offset+i,reading+token.text.slice(0,i));
      offset+=token.text.length;reading+=token.reading || token.text;points.set(offset,reading);
    }
    const candidates=[];
    // A dictionary-backed word may be written in kana in an otherwise kanji
    // sentence. This proves a written+reading occurrence, not its intended
    // sense. Keep single-kana fragments out of this fallback.
    const spellings=[...new Set([word.word,...word.alternate_forms || [],...(word.jmdict_id&&norm(word.reading).length>=2?[word.reading]:[])])];
    for(const spelling of spellings) {
      const kanaAlias=spelling!==word.word&&/^[ぁ-ゖァ-ヶー]+$/.test(spelling);
      candidates.push({text:spelling,reading:word.reading,label:spelling===word.word?'dictionary form':norm(spelling)===norm(word.reading)?'kana spelling':'alternate spelling',kanaAlias});
      const described=formsAPI?.describe({...word,word:spelling});
      if(['verb','i-adjective','na-adjective'].includes(described?.kind))for(const section of described.sections || [])for(const row of section.rows || [])if(row.label!=='ます-stem')for(const field of ['plain','polite','form'])if(row[field]?.text)candidates.push({...row[field],label:row.label,kanaAlias});
    }
    if(word.example_target)candidates.unshift({...word.example_target,text:word.example_target.surface,label:word.example_target.label||'conjugated form'});
    const normalized=norm(text),folded=normalized.length===text.length,searchText=folded?normalized:text;
    for(const form of candidates.sort((a,b)=>b.text.length-a.text.length)) {
      const spelling=folded?norm(form.text):form.text;
      let start=searchText.indexOf(spelling);
      while(start>=0){const end=start+spelling.length;
        const before=text[start-1]||'',after=text.slice(end);
        const kanaBoundary=!form.kanaAlias||
          ((!/[ぁ-ゖァ-ヶー]/.test(before)||/[をはがにでとへもやのおご]/.test(before))&&
           (!/^[ぁ-ゖァ-ヶー]/.test(after)||/^(?:[はがをにへともやのかねよなだでばさ]|じゃ|いる|いま|いな|おく|おき|しま|あげ|くれ|もら)/.test(after)));
        if(kanaBoundary&&points.has(start)&&points.has(end)){
          const actual=points.get(end).slice(points.get(start).length);
          if([form.reading,...form.label==='dictionary form'?word.alternate_readings || []:[]].some(r=>norm(r)===norm(actual)))return {start,end,surface:text.slice(start,end),reading:actual,form:form.label,status:'structural-match'};
        }
        start=searchText.indexOf(spelling,start+1);
      }
    }
    return null;
  }
  globalThis.RinoDictionaryReference=Object.freeze({norm,pair,identity,readingId,expand,create,occurrence,allowedForms});
})();
