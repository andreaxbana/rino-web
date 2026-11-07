/* Word-specific study forms. Pure data only: renderers must escape text.
 * Dictionary class gates precede ending rules. Extra ability/intention forms
 * are deliberately limited to common action lemmas: POS does not encode will. */
(function (root) {
  'use strict';

  const SOURCES = Object.freeze({
    grammar: Object.freeze({label:'Japan Foundation · Irodori grammar notes',url:'https://www.irodori.jpf.go.jp/assets/data/Grammar_all.pdf'}),
    classes: Object.freeze({label:'EDRDG · Dictionary grammar labels',url:'https://www.edrdg.org/wwwjdic/wwwjdicinf.html'}),
    exceptions: Object.freeze({label:'EDRDG · Special verb forms',url:'https://www.edrdg.org/wwwjdic/wwwverbinf.html'}),
    zuru: Object.freeze({label:'NINJAL · Modern ずる / じる forms',url:'https://clrd.ninjal.ac.jp/csj/manu-f/suwdic.pdf#page=10'}),
    specialU: Object.freeze({label:'JMdictDB · Exceptional う-ending conjugations',url:'https://gitlab.com/yamagoya/jmdictdb/-/blob/master/jmdictdb/data/conjo.csv'}),
    negative: Object.freeze({label:'St. Olaf Japanese · Short forms',url:'https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/short-forms-genki-i-chapter-8/'}),
    past: Object.freeze({label:'St. Olaf Japanese · Past forms',url:'https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/short-form-past-genki-i-chapter-9/'}),
    honorific: Object.freeze({label:'St. Olaf Japanese · Honorific verbs',url:'https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/honorific-verbs-keigo-genki-ii-chapter-19/'}),
    volitional: Object.freeze({label:'St. Olaf Japanese · Volitional forms',url:'https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/volitional-form-genki-ii-chapter-15/'}),
    potential: Object.freeze({label:'St. Olaf Japanese · Potential verbs',url:'https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/potential-verbs-genki-ii-chapter-13/'}),
    conditional: Object.freeze({label:'St. Olaf Japanese · Conditional ば',url:'https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/ba-genki-ii-chapter-22/'}),
    causative: Object.freeze({label:'St. Olaf Japanese · Causative forms',url:'https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/causative-sentences-genki-ii-chapter-22/'}),
    causativePassive: Object.freeze({label:'St. Olaf Japanese · Causative-passive forms',url:'https://wp.stolaf.edu/japanese/grammar-index/genki-i-ii-grammar-index/causative-passive-sentences-genki-ii-chapter-23/'}),
    good: Object.freeze({label:'Tae Kim · Adjectives and the いい exception',url:'https://guidetojapanese.org/learn/grammar/adjectives'}),
    quantity: Object.freeze({label:'ARC Japanese Language School · 多い and 少ない',url:'https://arc.ac.jp/Tokyo/mimi-bunpou019/'}),
    seasons: Object.freeze({label:'Japan Foundation · Marugoto seasonal expressions',url:'https://a2.marugotoweb.jp/en/grammar/lesson3/practice1.html'}),
    autumn: Object.freeze({label:'Japan Foundation · Akiko teacher manual',url:'https://ba.jpf.go.jp/wp-content/uploads/2022/03/Teacher-Manual-Vol.3-2017-JP-2022.2.25.pdf'})
  });
  const GODAN = Object.freeze({
    'う':['わ','い','え','お','って'], 'く':['か','き','け','こ','いて'],
    'ぐ':['が','ぎ','げ','ご','いで'], 'す':['さ','し','せ','そ','して'],
    'つ':['た','ち','て','と','って'], 'ぬ':['な','に','ね','の','んで'],
    'ぶ':['ば','び','べ','ぼ','んで'], 'む':['ま','み','め','も','んで'],
    'る':['ら','り','れ','ろ','って']
  });
  const GODAN_TAGS = Object.freeze({v5u:'う',v5k:'く',v5g:'ぐ',v5s:'す',v5t:'つ',v5n:'ぬ',v5b:'ぶ',v5m:'む',v5r:'る','v5k-s':'く','v5r-i':'る',v5aru:'る','v5u-s':'う'});
  // These introduced lemmas were checked against JMdict and NINJAL's modern
  // conjugation table. A suffix alone is not evidence for this special class.
  const ZURU_READINGS = Object.freeze({'応ずる':'おうずる','感ずる':'かんずる','生ずる':'しょうずる','信ずる':'しんずる','存ずる':'ぞんずる','通ずる':'つうずる','命ずる':'めいずる','論ずる':'ろんずる','演ずる':'えんずる','重んずる':'おもんずる','禁ずる':'きんずる','準ずる':'じゅんずる','報ずる':'ほうずる'});
  const SPECIAL_U_READINGS = Object.freeze({'請う':'こう','問う':'とう'});
  const ACTION_WORDS = new Set(('会う 遊ぶ 歩く 泳ぐ 行く 帰る 書く 聞く 聴く 話す 読む 飲む 買う 売る 待つ 持つ 取る 撮る 作る 使う 洗う 歌う 弾く 働く 休む 走る 乗る 登る 運ぶ 選ぶ 呼ぶ 貸す 返す 探す 入る 出る 食べる 見る 観る 起きる 寝る 教える 覚える 借りる 開ける 閉める 着る 脱ぐ 調べる 答える 始める 続ける 止める 来る くる する').split(' '));
  const ACTION_SURU = new Set(('勉強 練習 旅行 散歩 買い物 料理 掃除 洗濯 仕事 質問 説明 相談 紹介 準備 案内 運転 運動 研究 電話 予約 注文 コピー チェック あいさつ 挨拶').split(' '));
  const HONORIFIC_READINGS = new Set(['いらっしゃる','おっしゃる','くださる','なさる','ござる']);
  const SEASONS = Object.freeze({'春':'spring','夏':'summer','秋':'autumn','冬':'winter'});
  const GOOD_KANA = new Set(['いい','かっこいい','かっこういい','格好いい','カッコいい','カッコイイ','気持ちいい','きもちいい','気持ちがいい','きもちがいい']);
  const str = value => typeof value === 'string' ? value.trim() : '';
  const list = value => Array.isArray(value) ? value.filter(x=>typeof x==='string') : [];
  const kana = value => str(value).normalize('NFKC').replace(/[ァ-ヶ]/g, c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  const form = (text, reading='') => ({text,reading});
  const append = (base, ending) => form(base.text+ending,base.reading || !base.text ? base.reading+ending : '');
  const cut = (base, count, ending='') => form(base.text.slice(0,-count)+ending,base.reading ? base.reading.slice(0,-count)+ending : '');
  const coreRow = (label,plain,polite,note='') => ({label,plain,polite,...(note ? {note} : {})});
  const useRow = (label,value,note='') => ({label,form:value,...(note ? {note} : {})});
  const section = (id,title,rows,collapsed=false,notes=[]) => ({id,title,collapsed,columns:rows.some(row=>row.plain||row.polite) ? ['Form','Plain','Polite'] : ['Use','Japanese'],rows,notes});
  const result = (kind,summary,sections=[],notes=[],sourceKeys=['grammar','classes']) => ({kind,summary,sections,notes,sources:[...new Set(sourceKeys)].map(key=>({...SOURCES[key]}))});
  const suffixForm = (base,textEnding,readingEnding=textEnding) => form(base.text+textEnding,base.reading ? base.reading+readingEnding : '');

  // These derived verbs all conjugate as ichidan, even when their source is godan.
  function derivedRows(label,dictionary) {
    const stem=cut(dictionary,1);
    return [
      coreRow(label,dictionary,append(stem,'ます')),
      coreRow(label+' negative',append(stem,'ない'),append(stem,'ません')),
      coreRow(label+' past',append(stem,'た'),append(stem,'ました')),
      coreRow(label+' past negative',append(stem,'なかった'),append(stem,'ませんでした'))
    ];
  }

  function verbResult(item, base, group, tags) {
    const notes = [], sources = ['grammar','classes'];
    let stem, negative, past, te, potential, volitional, conditional, imperative, passive, causative, causativePassive, shortCausativePassive;
    let isAru=false, honorific=false;
    let dictionary = base, suruBase = null, specialSuru = tags.includes('vs-s');
    if (group==='suru') {
      if (base.text.endsWith('する') && base.reading.endsWith('する')) suruBase=cut(base,2);
      else if (!base.text.endsWith('する') && !base.reading.endsWith('する')) suruBase=base;
      else return unavailable('The written form and reading do not identify one reliable する form.');
      dictionary=append(suruBase,'する'); stem=append(suruBase,'し');
      negative=specialSuru ? null : append(suruBase,'しない');
      past=append(suruBase,'した'); te=append(suruBase,'して');
      potential=append(suruBase,'できる'); volitional=append(suruBase,'しよう');
      conditional=append(suruBase,'すれば'); passive=append(suruBase,'される');
      imperative=append(suruBase,'しろ');
      causative=append(suruBase,'させる'); causativePassive=append(suruBase,'させられる');
      if (specialSuru) {
        notes.push('This special する verb has word-specific negative and ability forms; only the shared forms are shown.');
        sources.push('exceptions');
      } else if (base.text==='一定'&&base.reading==='いってい'&&tags.includes('adj-no')) {
        notes.push('This table shows 一定する: to become or remain fixed. In descriptive use, 一定 connects to a noun with の: 一定の条件 (fixed conditions). It does not take な.');
      } else if (base.text==='匹敵'&&base.reading==='ひってき') {
        notes.push('This table shows 匹敵する (to rival or match). The comparison target takes に: 相手に匹敵する.');
      } else if (base.text!==dictionary.text) {
        notes.push('These are forms of '+dictionary.text+'. The base word stays unchanged when used as a noun.');
      }
    } else if (group==='zuru') {
      const prefix=cut(base,2);
      stem=append(prefix,'じ'); negative=append(stem,'ない');
      past=append(stem,'た'); te=append(stem,'て'); conditional=append(prefix,'ずれば');
      notes.push('This ずる verb uses a じ stem before ない, ます, て and た. The related '+append(stem,'る').text+' form is also used; its ば form is '+append(stem,'れば').text+'. The ずる form keeps ず in '+conditional.text+'.');
      notes.push('Formal negatives with ず or ぬ can use a ぜ stem. The core negative shown here uses modern じない.');
      sources.push('zuru');
    } else if (group==='kuru') {
      if (!base.reading.endsWith('くる')) return unavailable('The reading is needed to show the changing vowels in 来る.');
      const kanji = base.text.endsWith('来る'), phonetic=base.text.endsWith('くる');
      if (!kanji && !phonetic) return unavailable('This spelling needs a word-specific conjugation check.');
      const writtenPrefix=base.text.slice(0,-2), readingPrefix=base.reading.slice(0,-2);
      const kuru=(written,kanaEnding)=>form(writtenPrefix+(kanji ? '来'+written : kanaEnding),readingPrefix+kanaEnding);
      stem=kuru('','き'); negative=kuru('ない','こない'); past=kuru('た','きた'); te=kuru('て','きて');
      potential=kuru('られる','こられる'); volitional=kuru('よう','こよう');
      conditional=kuru('れば','くれば'); passive=kuru('られる','こられる');
      imperative=kuru('い','こい');
      causative=kuru('させる','こさせる'); causativePassive=kuru('させられる','こさせられる');
      notes.push('来 changes reading: くる → きます / きて, but こない.');
    } else if (group==='ichidan') {
      if (!base.text.endsWith('る') || !base.reading.endsWith('る')) return unavailable('This entry does not contain an unambiguous dictionary form ending in る.');
      stem=cut(base,1); negative=append(stem,'ない'); past=append(stem,'た'); te=append(stem,'て');
      potential=append(stem,'られる'); volitional=append(stem,'よう');
      conditional=append(stem,'れば'); passive=append(stem,'られる');
      imperative=append(stem,'ろ');
      causative=append(stem,'させる'); causativePassive=append(stem,'させられる');
    } else {
      const ending=base.text.slice(-1), row=GODAN[ending];
      if (base.reading.endsWith('ゆく')&&(tags.includes('v5k-s')||['行く','ゆく'].includes(base.text))) return unavailable('The ゆく reading has special usage alongside いく; use a word-specific reference for its forms.');
      const declared=tags.filter(t=>Object.prototype.hasOwnProperty.call(GODAN_TAGS,t));
      if (!row || base.reading.slice(-1)!==ending || declared.some(t=>GODAN_TAGS[t]!==ending)) return unavailable('The spelling, reading and verb class need a word-specific check.');
      const rootForm=cut(base,1);
      isAru=['ある','有る','在る'].includes(base.text)&&base.reading==='ある';
      if (tags.includes('v5r-i')&&!isAru) return unavailable('This irregular verb needs a word-specific conjugation check.');
      honorific=tags.includes('v5aru');
      if (honorific&&!HONORIFIC_READINGS.has(base.reading)) return unavailable('This honorific verb needs a word-specific conjugation check.');
      stem=append(rootForm,honorific ? 'い' : row[1]);
      negative=isAru ? form('ない','ない') : append(rootForm,row[0]+'ない');
      const iku=tags.includes('v5k-s') || (['行く','いく','ゆく'].includes(base.text)&&['いく','ゆく'].includes(base.reading));
      te=append(rootForm,tags.includes('v5u-s') ? 'うて' : iku ? 'って' : row[4]);
      past=cut(te,1,te.text.endsWith('で') ? 'だ' : 'た');
      potential=append(rootForm,row[2]+'る'); volitional=append(rootForm,row[3]+'う');
      conditional=append(rootForm,row[2]+'ば'); passive=append(rootForm,row[0]+'れる');
      imperative=append(rootForm,row[2]);
      causative=append(rootForm,row[0]+'せる'); causativePassive=append(rootForm,row[0]+'せられる');
      if (ending!=='す') shortCausativePassive=append(rootForm,row[0]+'される');
      if (isAru) { notes.push('ある has the plain negative ない, and past negative なかった.'); sources.push('negative'); }
      if (iku) notes.push('行く is exceptional in the て-form and past: 行って / 行った.');
      if (tags.includes('v5u-s')) { notes.push(base.text+' keeps う before て and た: '+te.text+' / '+past.text+'. Its polite stem is '+stem.text+' ('+stem.reading+'), and its negative is '+negative.text+' ('+negative.reading+').'); sources.push('specialU'); }
      if (honorific) { notes.push('This respectful verb uses an い ending before ます.'); sources.push('honorific'); }
    }
    const rows=[coreRow('Non-past',dictionary,append(stem,'ます'))];
    if (negative) rows.push(coreRow('Negative',negative,append(stem,'ません')));
    rows.push(coreRow('Past',past,append(stem,'ました')));
    if (negative) rows.push(coreRow('Past negative',cut(negative,1,'かった'),append(stem,'ませんでした')));
    const extra=[useRow('て-form',te,'Connects clauses and combines with other endings.'),useRow('ます-stem',stem,'The part before ます.'),useRow('Listing actions',append(past,'り'),'Use in the pattern ～たり、～たりする; this lists examples, not a complete sequence.')];
    if (negative) extra.push(useRow('Negative linking',cut(negative,1,'くて'),'Links a negative statement to another description or a consequence.'),useRow('Without doing',append(negative,'で'),'Use before another action; also the base of a negative request.'));
    if (group==='zuru') extra.push(useRow('Related じる form',append(stem,'る'),'A related modern dictionary form with the same じ stem.'));
    const conditions=[
      useRow('If / when · たら',append(past,'ら'),'A condition, or an event completed before what follows; it need not refer to the past.'),
      useRow('If · ば',conditional,'States a condition. Choice of ば versus たら depends on the following clause.'),
      useRow('If that is the case · なら',append(dictionary,'なら'),'Responds to an assumption or information already under discussion.'),
      useRow('Whenever · と',append(dictionary,'と'),'Common for regular or automatic results; do not use it for a one-off request or invitation.'),
      useRow('Even if · ても',append(te,'も'),'The following result holds even under this condition.')
    ];
    if (negative) conditions.push(useRow('If not · なかったら',cut(negative,1,'かったら')),useRow('If not · なければ',cut(negative,1,'ければ')),useRow('If not · ないなら',append(negative,'なら')),useRow('Even if not · なくても',cut(negative,1,'くても')));
    if (group==='zuru') conditions.push(useRow('If · ば with the じる form',append(stem,'れば'),'The related じる form uses じれば; the ずる form uses ずれば.'));
    const action = !specialSuru && (ACTION_WORDS.has(dictionary.text) || suruBase&&ACTION_SURU.has(suruBase.text));
    const sections=[section('core','Core forms',rows),section('connecting','Linking & building forms',extra,true),section('conditions','Conditions & concessions',conditions,true,['These are clause patterns. Politeness is normally supplied by the ending of the full sentence.'])];
    const aspect=!specialSuru&&!isAru&&!honorific&&!['いる','居る','おる','要る'].includes(dictionary.text);
    if (aspect) sections.push(section('aspect','Ongoing action & resulting state',derivedRows('ている',append(te,'いる')),true,['ている can describe an ongoing action, a habit, or a state resulting from a change. Its meaning depends on the verb; 開いている means “is open”.']));
    if (action) {
      sections.push(section('requests','Requests, permission & obligation',[
        coreRow('Request',te,append(te,'ください'),'The bare て-form is a casual request; てください is a direct polite request.'),
        coreRow('Negative request',append(negative,'で'),append(negative,'でください'),'Ask someone not to do the action.'),
        coreRow('Permission',append(te,'もいい'),append(te,'もいいです'),'To ask permission, add a question ending such as か to the polite form.'),
        coreRow('Prohibition',append(te,'はいけない'),append(te,'はいけません'),'Says the action is not allowed; this can sound authoritative.'),
        coreRow('Obligation',cut(negative,1,'ければならない'),cut(negative,1,'ければなりません'),'Expresses a requirement: must do.'),
        coreRow('No obligation',cut(negative,1,'くてもいい'),cut(negative,1,'くてもいいです'),'There is no need to do it; this does not forbid doing it.'),
        coreRow('Advice',append(past,'ほうがいい'),append(past,'ほうがいいです'),'Recommends an action; the た-form here does not mean it already happened.'),
        coreRow('Negative advice',append(negative,'ほうがいい'),append(negative,'ほうがいいです'),'Recommends avoiding the action.')
      ],true));
      sections.push(section('intention','Intention & desire',[
        coreRow('Volitional',volitional,append(stem,'ましょう'),'A decision, intention, or invitation. The polite form often means “let’s …”.'),
        coreRow('Want to',append(stem,'たい'),append(stem,'たいです')),
        coreRow('Do not want to',append(stem,'たくない'),append(stem,'たくないです')),
        coreRow('Wanted to',append(stem,'たかった'),append(stem,'たかったです')),
        coreRow('Did not want to',append(stem,'たくなかった'),append(stem,'たくなかったです')),
        coreRow('Plan to',append(dictionary,'つもりだ'),append(dictionary,'つもりです')),
        coreRow('Plan not to',append(negative,'つもりだ'),append(negative,'つもりです'))
      ],true,['たい normally describes the speaker’s desire, or asks about the listener’s. A third person’s desire needs supporting context or another expression.']));
      sections.push(section('commands','Strong instructions',[
        useRow('Imperative',imperative,'A strong order, warning, or cheer. Use the request forms for ordinary polite requests.'),
        useRow('Do not · dictionary + な',append(dictionary,'な'),'A forceful prohibition; it uses the dictionary form, not the ます-stem.'),
        useRow('Instruction · なさい',append(stem,'なさい'),'An instruction typically given by a parent, teacher, or superior. It is not a neutral polite request.')
      ],true));
      sections.push(section('potential','Potential · can do',derivedRows('Potential',potential),true,['Describes ability or possibility. With ichidan verbs and 来る, the standard potential and passive have the same spelling; context distinguishes them.']));
      sections.push(section('passive','Passive · receive an action',derivedRows('Passive',passive),true,['The sentence viewpoint and particles change. Intransitive verbs can appear in an indirect passive describing someone affected by the event.']));
      sections.push(section('causative','Causative · make or let',derivedRows('Causative',causative),true,['Can express making or allowing someone to act. The situation determines which meaning is intended.']));
      const cpRows=derivedRows('Causative-passive',causativePassive);
      if (shortCausativePassive) cpRows.push(coreRow('Short causative-passive',shortCausativePassive,append(cut(shortCausativePassive,1),'ます'),'A common shorter alternative. Godan verbs ending in す do not use this shortening.'));
      sections.push(section('causative-passive','Causative-passive · made to do',cpRows,true,['Often describes being made to do something, especially against one’s wishes. Full forms are shown above; other interpretations require context.']));
      sources.push('volitional','potential','causative','causativePassive');
    } else {
      notes.push('Ability, requests, intention and voice forms are shown only for checked action uses. A verb class alone does not establish whether those meanings suit this entry.');
    }
    sources.push('conditional');
    const groupLabel={suru:'する verb',kuru:'Irregular verb',zuru:'ずる verb · related to じる',ichidan:'Ichidan verb · group 2',godan:'Godan verb · group 1'}[group];
    const summary=groupLabel+'. Non-past forms can describe present states, habits or future events.';
    if (item.transitivity==='transitive') notes.push('Transitive use: the object is commonly marked with を.');
    else if (item.transitivity==='intransitive') notes.push('Intransitive use: the subject is commonly marked with が.');
    else if (item.transitivity==='both') notes.push('This entry has both transitive and intransitive uses; the particle depends on the sense.');
    return result('verb',summary,sections,notes,sources);
  }

  function adjectiveResult(base,tags) {
    if (!base.text.endsWith('い') || !base.reading.endsWith('い')) return unavailable('This adjective needs a word-specific form check.');
    let stem=cut(base,1), irregular=false;
    // かわいい is regular. Only an identified いい/良い element changes to よい.
    if (tags.includes('adj-ix') || GOOD_KANA.has(base.text) || /[良好]い$/.test(base.text)&&base.reading.endsWith('いい')) {
      if (base.text.endsWith('いい')&&base.reading.endsWith('いい')) stem=form(base.text.slice(0,-2)+'よ',base.reading.slice(0,-2)+'よ');
      else if (/[良好]い$/.test(base.text)&&/(いい|よい)$/.test(base.reading)) stem=form(base.text.slice(0,-1),base.reading.slice(0,-2)+'よ');
      else if (base.reading.endsWith('よい')) stem=cut(base,1);
      else return unavailable('This exceptional adjective needs a word-specific form check.');
      irregular=true;
    }
    const negative=append(stem,'くない'), past=append(stem,'かった'), pastNegative=append(stem,'くなかった');
    const rows=[coreRow('Non-past',base,append(base,'です')),coreRow('Negative',negative,append(negative,'です')),coreRow('Past',past,append(past,'です')),coreRow('Past negative',pastNegative,append(pastNegative,'です'))];
    const quantity=['多い','少ない'].includes(base.text), extra=[];
    if (base.text==='多い') extra.push(useRow('Before a noun',form('多くの…','おおくの…'),'Use 多くの for “many …”, or describe what is numerous with が多い.'));
    else if (!quantity) extra.push(useRow('Before a noun',append(base,'…'),'Attach directly to the following noun.'));
    extra.push(useRow('Adverb form',append(stem,'く'),'Modifies an action or description.'),useRow('Linking form',append(stem,'くて'),'Connects descriptions.'));
    const notes=irregular ? ['The いい element becomes よ in forms such as よくない and よかった.'] : [];
    if (quantity) notes.push('多い and 少ない usually describe a noun with が: 人が多い / 人が少ない. Do not simply place them before a noun to mean “many” or “few”.');
    const sections=[section('core','Core forms',rows),section('usage','Describing & linking',extra,true),section('formal','Alternative negatives',[
      coreRow('Negative · formal polite',negative,append(stem,'くありません'),'The くないです form in Core forms is also polite and common in conversation.'),
      coreRow('Past negative · formal polite',pastNegative,append(stem,'くありませんでした'))
    ],true),section('connecting','More linking patterns',[
      useRow('Negative linking',append(stem,'くなくて'),'Connects a negative description, or gives a reason for what follows.'),
      useRow('Reason · から',append(base,'から'),'A reason clause; finish with a consequence or explanation.'),
      useRow('Reason · ので',append(base,'ので'),'Gives a reason or background for what follows.'),
      useRow('Although · のに',append(base,'のに'),'Introduces a result that goes against the expectation created by the description.')
    ],true),section('conditions','Conditions & concessions',[
      useRow('If · ければ',append(stem,'ければ')),
      useRow('If not · くなければ',append(stem,'くなければ')),
      useRow('If / when · かったら',append(past,'ら')),
      useRow('If not · くなかったら',append(pastNegative,'ら')),
      useRow('If that is the case · なら',append(base,'なら')),
      useRow('If not · くないなら',append(negative,'なら')),
      useRow('Even if · くても',append(stem,'くても')),
      useRow('Even if not · くなくても',append(stem,'くなくても'))
    ],true,['These are clause patterns; the main clause supplies the sentence ending. The different conditional patterns are not interchangeable in every context.']),section('change','Change of state',[
      coreRow('Become',append(stem,'くなる'),append(stem,'くなります'),'The described quality changes: becomes …'),
      coreRow('Make',append(stem,'くする'),append(stem,'くします'),'Make something have this quality, where the meaning allows a deliberate change.')
    ],true)];
    return result('i-adjective','い-adjective. Change the final い to form negatives and past descriptions.',sections,notes,['grammar','past','conditional',...(irregular ? ['good'] : []),...(quantity ? ['quantity'] : [])]);
  }

  function nominalResult(base,isNa,item,tags) {
    const mixedNo=tags.includes('adj-no'), same=base.text==='同じ'&&base.reading==='おなじ';
    const rows=[coreRow('Non-past',append(base,'だ'),append(base,'です')),coreRow('Negative',append(base,'じゃない'),append(base,'ではありません')),coreRow('Past',append(base,'だった'),append(base,'でした')),coreRow('Past negative',append(base,'じゃなかった'),append(base,'ではありませんでした'))];
    const notes=['じゃない is conversational; ではない is another plain negative.'];
    const uses=[];
    let summary=isNa ? 'な-adjective. The base stays unchanged; sentence endings express tense and politeness.' : 'Noun. The word itself does not decline; sentence endings express tense and politeness.';
    if (Object.prototype.hasOwnProperty.call(SEASONS,base.text)&&({春:'はる',夏:'なつ',秋:'あき',冬:'ふゆ'})[base.text]===base.reading) {
      summary='Names the season '+SEASONS[base.text]+'. It can also set the time of an action. The word itself stays unchanged.';
      uses.push(useRow('In '+SEASONS[base.text],append(base,'に'),'Marks the season when something happens.'),useRow('Before another noun',append(base,'の…'),'Links the season to a noun, such as seasonal weather or events.'),useRow('Becomes '+SEASONS[base.text],append(base,'になります'),'に marks the resulting state.'),useRow('As the topic',suffixForm(base,'は','は'),'Introduces what you want to say about this season; は is pronounced わ.'));
    } else if (isNa&&!mixedNo) {
      uses.push(useRow('Before a noun',append(base,same ? '…' : 'な…'),same ? '同じ directly modifies a noun, without な.' : 'Use な before the noun being described.'));
      if (!same) uses.push(useRow('Adverb form',append(base,'に'),'Describes how an action is done.'));
      uses.push(useRow('Linking form',append(base,'で'),'Connects descriptions.'));
    } else {
      uses.push(useRow('Before another noun',append(base,'の…'),'の connects related nouns; the meaning depends on the following noun.'),useRow('As the topic',suffixForm(base,'は','は'),'Introduces this topic; は is pronounced わ.'),useRow('As the subject',append(base,'が'),'Marks the subject when the sentence calls for it.'));
      if (mixedNo) notes.push('Use の in the noun-modifying pattern shown here. Other adjective patterns depend on the sense.');
      else if (tags.includes('adj-na')) notes.push('The dictionary also records an adjective use. These constructions follow the noun use; adjective meanings may differ.');
      if (list(item.parts_of_speech).includes('adverb')) notes.push('This entry also has adverbial uses. Those uses keep the same word form; check the example for its role.');
    }
    const sections=[section('core',isNa ? 'Core forms' : 'With sentence endings',rows),section('usage','Common constructions',uses,true),section('formal','Alternative sentence endings',[
      coreRow('Negative · uncontracted',append(base,'ではない'),append(base,'ではありません'),'では is the uncontracted counterpart of conversational じゃ.'),
      coreRow('Past negative · uncontracted',append(base,'ではなかった'),append(base,'ではありませんでした')),
      coreRow('Negative · conversational polite',append(base,'じゃない'),append(base,'じゃないです')),
      coreRow('Past negative · conversational polite',append(base,'じゃなかった'),append(base,'じゃなかったです'))
    ],true),section('connecting','Linking sentence patterns',[
      useRow('Linking · で',append(base,'で'),'Connects two descriptions. Here で is the linking copula, not a place-of-action particle.'),
      useRow('Negative linking · ではなくて',append(base,'ではなくて'),'Links a negative description, often before an alternative.'),
      useRow('Reason · だから',append(base,'だから')),
      useRow('Reason · なので',append(base,'なので')),
      useRow('Although · なのに',append(base,'なのに'),'Introduces an unexpected contrast.')
    ],true),section('conditions','Conditions & concessions',[
      useRow('If · なら',append(base,'なら'),'Assumes this description or identity; do not put だ before なら.'),
      useRow('If not · ではないなら',append(base,'ではないなら')),
      useRow('If / when · だったら',append(base,'だったら')),
      useRow('If not · じゃなかったら',append(base,'じゃなかったら')),
      useRow('If · であれば',append(base,'であれば'),'A more formal conditional construction.'),
      useRow('If not · でなければ',append(base,'でなければ')),
      useRow('Even if · でも',append(base,'でも'),'A concessive clause: even if it is …; other meanings of でも depend on context.'),
      useRow('Even if not · でなくても',append(base,'でなくても'))
    ],true,['The noun or adjective base stays unchanged. These patterns use the copula and particles; they are not noun declensions.'])];
    if (isNa&&!same&&!mixedNo) sections.push(section('change','Change of state',[
      coreRow('Become',append(base,'になる'),append(base,'になります')),
      coreRow('Make',append(base,'にする'),append(base,'にします'),'Describes bringing about this state, where the adjective meaning permits it.')
    ],true));
    return result(isNa ? 'na-adjective' : 'noun',summary,sections,notes,['grammar','past','conditional',...(SEASONS[base.text] ? ['seasons','autumn'] : [])]);
  }

  function unavailable(summary) { return result('unavailable',summary,[],['Use the example for this entry; no uncertain forms are generated.'],['classes','exceptions']); }

  function fixedResult(base,item,tags) {
    const parts=list(item.parts_of_speech);
    if (tags.includes('adj-pn')) return result('fixed','Placed directly before a noun. This word does not take the standard adjective endings.',[section('usage','In a phrase',[useRow('Before a noun',append(base,'…'),'Continue with the noun being described.')])]);
    if (parts.includes('adverb')||tags.some(x=>x==='adv'||x==='adv-to')) return result('fixed','Adverbial use: the word keeps its form while modifying an action or description.',[],tags.includes('vs') ? ['The dictionary also records a する use. Its meaning depends on the expression, so a general conjugation table is not shown.'] : []);
    if (parts.includes('particle')) return result('fixed','A particle marks a relationship or adds meaning to a sentence. It does not conjugate.');
    if (parts.some(x=>['prefix','suffix','counter'].includes(x))||tags.some(x=>['pref','suf','n-pref','n-suf','ctr'].includes(x))) return result('fixed','Used as part of a larger expression. The surrounding word or number determines the complete form; no standalone conjugation is needed.');
    if (parts.includes('conjunction')||tags.includes('conj')) return result('fixed','Connects ideas or sentences. This use has no tense or politeness conjugation.');
    if (parts.some(x=>['expression','interjection'].includes(x))||tags.some(x=>['exp','int'].includes(x))) return result('fixed','Learn this as a complete expression. Its wording and level of politeness depend on the situation shown in the example.');
    return result('fixed','No regular conjugation is shown for this use. Read the example for how the word connects to the sentence.');
  }

  function describe(item) {
    if (!item||typeof item!=='object') return unavailable('Choose a word to see its forms.');
    const text=str(item.word), reading=kana(item.reading), base=form(text,reading);
    if (!text) return unavailable('A word is needed to show its forms.');
    const tags=list(item.dictionary_pos), parts=list(item.parts_of_speech), group=str(item.verb_group);
    const verbTags=tags.filter(t=>/^v(?:1|2|4|5|s|k|z|n|r|u)/.test(t)&&!['vi','vt'].includes(t));
    const verbFamilies=new Set(verbTags.map(t=>t.startsWith('v5') ? 'godan' : t.startsWith('v1') ? 'ichidan' : t==='vk' ? 'kuru' : ['vs','vs-i','vs-s'].includes(t) ? 'suru' : t));
    const archaic=tags.some(t=>/^v(?:2|4)|^adj-(?:ku|shiku|nari|kari)$/.test(t));
    const unsafeSpelling=!/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々ゝゞヵヶ]+$/u.test(text);
    if (archaic) return unavailable('This entry includes a historical grammatical form; a modern conjugation table would be misleading.');
    if (unsafeSpelling) return fixedResult(base,item,tags);
    if ((group||verbTags.length)&&!reading.match(/^[ぁ-ゖー]+$/u)) return unavailable('One kana reading is needed to show reliable verb forms.');
    if (tags.some(t=>['vs-c','v-unspec','v5uru','vn','vr'].includes(t)) || tags.includes('vz')&&ZURU_READINGS[text]!==reading || tags.includes('v5u-s')&&SPECIAL_U_READINGS[text]!==reading) return unavailable('This verb belongs to a special class that needs a word-specific form check.');
    if (verbFamilies.size>1) return unavailable('This entry combines verb classes; choose the specific dictionary use first.');
    const standaloneNoun=tags.some(t=>['n','n-pr','n-p','n-t','n-adv'].includes(t)) || !tags.length&&parts.includes('noun');
    if (['pref','suf','n-pref','n-suf','ctr'].includes(tags[0])&&!group) return fixedResult(base,item,tags);
    if (group==='ichidan'&&verbTags.some(t=>!['v1','v1-s'].includes(t)) || group==='godan'&&verbTags.some(t=>!Object.prototype.hasOwnProperty.call(GODAN_TAGS,t)) || group==='irregular'&&verbTags.some(t=>!['vk','vs','vs-i','vs-s','vz'].includes(t))) return unavailable('The verb group and dictionary class disagree; this entry needs a word-specific check.');
    if (tags.includes('vk')||group==='irregular'&&['来る','くる'].includes(text)&&reading==='くる') return verbResult(item,base,'kuru',tags);
    if (tags.includes('vz')) return verbResult(item,base,'zuru',tags);
    if (tags.includes('vs-s')) return verbResult(item,base,'suru',tags);
    const checkedSuruParticiple=text==='一定'&&reading==='いってい'&&tags.includes('vs')&&tags.includes('adj-no');
    const checkedSuruPredicate=text==='匹敵'&&reading==='ひってき'&&tags.includes('vs')&&tags.includes('vi')&&parts.includes('suru_verb');
    if ((tags.includes('vs')||tags.includes('vs-i')||group==='irregular'&&parts.includes('suru_verb'))&&(text.endsWith('する')||standaloneNoun||checkedSuruParticiple||checkedSuruPredicate)) return verbResult(item,base,'suru',tags);
    if (tags.includes('vs')&&parts.includes('adverb')&&!standaloneNoun) return fixedResult(base,item,tags);
    if (group==='godan'||verbTags.some(t=>t.startsWith('v5'))) {
      if (verbTags.some(t=>!Object.prototype.hasOwnProperty.call(GODAN_TAGS,t))) return unavailable('This entry combines verb classes; choose the specific dictionary use first.');
      return verbResult(item,base,'godan',tags);
    }
    if (group==='ichidan'||tags.includes('v1')||tags.includes('v1-s')) {
      if (verbTags.some(t=>!['v1','v1-s'].includes(t))) return unavailable('This entry combines verb classes; choose the specific dictionary use first.');
      return verbResult(item,base,'ichidan',tags);
    }
    if (group&&!(tags.includes('vs')&&parts.includes('adverb'))) return unavailable('This verb needs a word-specific conjugation check.');
    if (tags.includes('adj-pn')) return fixedResult(base,item,tags);
    if (item.adjective_type==='i' || tags.includes('adj-i')||tags.includes('adj-ix')) return adjectiveResult(base,tags);
    if (tags.some(t=>['aux','aux-v','aux-adj'].includes(t))) return fixedResult(base,item,tags);
    // A dictionary with multiple senses can label a noun adj-na and adj-no.
    // Prefer its noun use; this avoids inventions such as 黄色な / たくさんな.
    if (standaloneNoun&&(tags.includes('adj-no')||tags[0]==='n')) return nominalResult(base,false,item,tags);
    if ((tags.includes('adj-na')||!tags.length&&item.adjective_type==='na')&&!tags.includes('adj-no')) return nominalResult(base,true,item,tags);
    if (standaloneNoun) return nominalResult(base,false,item,tags);
    return fixedResult(base,item,tags);
  }

  root.KotobaWordForms=Object.freeze({describe,sources:SOURCES});
})(typeof globalThis!=='undefined' ? globalThis : this);
