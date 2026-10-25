// Conservative, target-independent policy over three trained recognizers.
// These cutoffs are engineering abstention rules, not calibrated accuracy estimates.
function isHorizontalStroke(strokes) {
  if(strokes.length!==1||strokes[0].length<2)return false;
  const points=strokes[0],xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
  const travel=Math.abs(points.at(-1)[0]-points[0][0]);
  const length=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
  // Coordinates are normalized to the 109-unit writing pad. Cropping alone
  // makes tiny dashes and repeatedly retraced lines look like full-size 一.
  return width>=20&&height<=width*.18&&travel>=width*.9&&length<=width*1.15;
}

export function decide(evidence, strokeCount, counts, classSets={}, strokes=[]) {
  const { kanjidnn:k, dakanji:d, zinnia:z }=evidence;
  const character=x=>x && [...x.character].length===1;
  const supported=x=>character(x) && (!counts[x.character] || counts[x.character]===strokeCount);
  const kRaw=character(k[0])&&k[0].score>=.98;
  const dRaw=character(d[0])&&d[0].score>=.90;
  const zRaw=character(z[0])&&z[0].score>.40&&z[0].score-(z[1]?.score??-Infinity)>.75;
  const kStrong=supported(k[0])&&kRaw;
  const dStrong=supported(d[0])&&dRaw;
  // Online SVM features depend on pen segmentation. Its own first choice must
  // also have substantial support from both independently trained raster CNNs.
  // This is corroboration of an inferred identity; the question target is absent.
  const visuallySupported=character=>[k,d].every(list=>list.slice(0,5).some(c=>c.character===character&&c.score>=.01));
  const zStrong=supported(z[0])&&zRaw&&visuallySupported(z[0].character);
  // In kanji practice, a plain horizontal 一 and the kana long-vowel mark ー
  // are graphical homographs. Resolve only this pair, using DaKanji's own
  // strong top reading and the ink, never the requested answer or a runner-up.
  const horizontalHomograph=strokeCount===1&&k[0].character==='ー'&&dStrong&&d[0].character==='一'&&isHorizontalStroke(strokes);
  let chosen=null;
  if(horizontalHomograph)chosen='dakanji';
  else if(kStrong)chosen='kanjidnn';
  else if(dStrong)chosen='dakanji';
  else if(zStrong)chosen='zinnia';
  else if(supported(k[0])&&k[0].character===d[0].character&&k[0].score>.8&&d[0].score>.7)chosen='kanjidnn';
  else if(supported(k[0])&&k[0].character===d[0].character&&k[0].character===z[0].character&&k[0].score>.4&&d[0].score>.6&&z[0].score-(z[1]?.score??0)>.3)chosen='kanjidnn';
  if(chosen) {
    const character=evidence[chosen][0].character;
    // A plausible, conflicting CNN or a decisive online model prevents an automatic grade.
    // Unsupported stroke counts can veto a reading but never promote a lower-ranked class.
    const conflict=(kRaw&&k[0].character!==character&&!horizontalHomograph)||(dRaw&&d[0].character!==character)||(zStrong&&z[0].character!==character)
      ||(chosen==='dakanji'&&supported(k[0])&&k[0].score>=.5&&k[0].character!==character&&!horizontalHomograph)
      ||(k[0].character==='REJECT'&&k[0].score>=.98)
      // A smaller-vocabulary CNN cannot rule out a plausible class it never
      // learned. Preserve the larger model's conflicting reading as uncertainty.
      ||(chosen==='kanjidnn'&&classSets.kanjidnn&&!classSets.kanjidnn.has(d[0].character)&&d[0].score>=.5&&d[0].character!==character);
    if(conflict)return {decision:'uncertain',reason:'model-disagreement',selectedModel:'kanjidnn'};
    // This checker grades isolated kanji. A kana/digit label can share the same
    // handwritten shape, so it is not evidence that a kanji answer is wrong.
    // Keep the raw reading for review instead of turning it into a failing grade.
    if(!/^\p{Script=Han}$/u.test(character))return {decision:'uncertain',reason:'non-kanji-reading',selectedModel:chosen};
    return {decision:'confident',reason:horizontalHomograph?'kanji-horizontal-homograph':'trained-model-reading',selectedModel:chosen};
  }
  return {decision:'uncertain',reason:!supported(k[0])?'stroke-count-or-reject':'model-confidence',selectedModel:'kanjidnn'};
}
