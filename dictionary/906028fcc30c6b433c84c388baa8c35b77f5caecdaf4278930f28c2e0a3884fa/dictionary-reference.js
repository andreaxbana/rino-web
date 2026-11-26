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
  const hasPriority = tags => tags?.some(tag => /^(news1|ichi1|spec1|gai1)$/.test(tag));
  // Unranked forms sort after every two-digit JMdict newspaper band.
  const unranked = 100;
  const frequencyBand = tags => Math.min(unranked,...tags.filter(tag => /^nf\d{2}$/.test(tag)).map(tag => Number(tag.slice(2))));
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
      common:forms.some(form => hasPriority(form[2])) || !!hasPriority(reading[4]),
      spelling_notes:forms.filter(f=>f[1]?.length).map(f=>({word:f[0],tags:f[1]})),reading_notes:reading[3] || [],
      other_readings:entry[2].filter(r=>r!==reading).map(r=>({reading:r[0],forms:allowedForms(entry,r).map(f=>f[0])})),source:'JMdict / EDRDG'};
  }
  function pairEvidence(entry,form,reading) {
    if (!form || !reading || reading[2] || (reading[1]?.length && !reading[1].includes(form[0]))) return null;
    if (form[1]?.includes('sK') || reading[3]?.includes('sk')) return null;
    const senses = entry[3].filter(sense => (!sense[3]?.length || sense[3].includes(form[0])) &&
      (!sense[4]?.length || sense[4].includes(reading[0])));
    if (!senses.length) return null;
    const current = senses.filter(sense => !sense[5]?.some(tag => /^(arch|dated|obs|rare)$/.test(tag)));
    const sense = current[0] || senses[0];
    const usuallyKana = (current.length ? current : senses).every(s => s[5]?.includes('uk'));
    const tags = [...form[1] || [], ...reading[3] || []];
    const labels = {iK:'Irregular spelling',io:'Irregular kana ending',oK:'Outdated spelling',rK:'Rare spelling',
      ik:'Irregular reading',ok:'Outdated reading',rk:'Rare reading',arch:'Archaic',dated:'Dated',obs:'Obsolete',rare:'Rare usage',poet:'Poetic usage'};
    const notes = [...new Set([...tags,...sense[5] || []].map(tag => labels[tag]).filter(Boolean))];
    if (usuallyKana) notes.push('Usually written in kana');
    const wholeWordReading = tags.includes('gikun') || tags.includes('ateji');
    // JMdict records priorities on both the spelling and the pronunciation.
    // Only a shared mark is evidence for the particular pair shown in Learn.
    const shared = (form[2] || []).filter(tag => reading[4]?.includes(tag));
    const general = shared.some(tag => /^(ichi1|gai1|spec[12])$/.test(tag));
    const band = frequencyBand(shared);
    const marked = (general || shared.includes('news1')) && current.length &&
      !tags.some(tag => labels[tag]) && (!usuallyKana || band !== unranked);
    const priority = marked ? {entryId:entry[0],general,usuallyKana,frequencyBand:band,spellingBand:frequencyBand(form[2]),wholeWordReading} : null;
    return {meaning_en:sense[1][0],dictionary_pos:[...new Set(senses.flatMap(s => s[2] || []))],note:notes.join(' · '),priority,wholeWordReading};
  }
  function create(source = {}) {
    const words=[], byIdentity=new Map(), byPair=new Map();
    for(const entry of source.entries || []) for(const reading of entry[2]) {
      const word=expand(entry,reading); if(!word.senses.length)continue;
      words.push(word);if(!byIdentity.has(word.reference_key))byIdentity.set(word.reference_key,word);
      for(const form of [word.word,...word.alternate_forms]) {const k=pair(form,word.reading);if(!byPair.has(k))byPair.set(k,[]);byPair.get(k).push(word);}
    }
    const resolve = item => byIdentity.get(identity(item.jmdict_id,item.reading)) || (byPair.get(pair(item.word,item.reading)) || []).find(word=>!item.jmdict_id || word.jmdict_id===String(item.jmdict_id));
    let entriesById;
    function sourceEntry({word,reading,jmdict_id}) {
      const matches = byPair.get(pair(word,reading)) || [];
      const match = jmdict_id ? matches.find(entry => entry.jmdict_id === String(jmdict_id))
        : matches.length === 1 ? matches[0] : null;
      if (!match) return null;
      entriesById ??= new Map(source.entries.map(entry => [entry[0],entry]));
      return entriesById.get(match.jmdict_id);
    }
    function isCommonSpelling(item) {
      // A common flag on one spelling must not promote its rare variants.
      return sourceEntry(item)?.[1].some(([form,,tags]) => norm(form) === norm(item.word) && hasPriority(tags)) || false;
    }
    function readingEvidence(item) {
      const entry = sourceEntry(item);
      if (!entry) return null;
      const form = entry[1].find(([text]) => text === item.word);
      const reading = entry[2].find(([text]) => text === item.reading);
      return pairEvidence(entry,form,reading);
    }
    const commonWordPriority = item => readingEvidence(item)?.priority || null;
    return {words,byIdentity,byPair,resolve,isCommonSpelling,commonWordPriority,readingEvidence,labels:source.labels || {},source:source.source};
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
  function examplesFor(reference,key,index) {
    const authored=reference.examples?.[key] || [];
    const indexed=reference.indexedExamples?.[key];
    if(!indexed)return authored;
    const entryId=key.split(':')[0];
    return authored.concat(indexed.map(([sense,ja,en,japaneseId,englishId,start,length,reading,form,location])=>{
      const end=start+length,surface=ja.slice(start,end);
      const study=Array.isArray(location)?index?.kanji.get(location[0])?.example_sentences?.[location[1]]:index?.catalogWords.get(location);
      const target=/[\p{Script=Han}々]/u.test(surface)?{text:surface,reading}:{text:surface};
      const parts=study?.example_ja===ja?study.example_ruby:[{text:ja.slice(0,start)},target,{text:ja.slice(end)}].filter(t=>t.text);
      return {senseId:'jm:'+entryId+':s'+sense,example_ja:ja,example_ruby:parts,example_en:en,
        occurrence:{start,end,surface,reading,form,status:'structural-match'},
        example_source:'Tatoeba contributors, via EDRDG',example_license:'CC BY 2.0 FR',
        example_source_url:'https://tatoeba.org/sentences/show/'+japaneseId,
        english_source_url:'https://tatoeba.org/sentences/show/'+englishId};
    }));
  }
  globalThis.RinoDictionaryReference=Object.freeze({norm,pair,identity,readingId,expand,create,occurrence,allowedForms,pairEvidence,examplesFor});
})();
