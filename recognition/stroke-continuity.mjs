// Reconnect only nearby, smoothly continuing pen fragments. No character or
// expected answer participates, and the raster recognizers retain the raw ink.
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
function tangent(stroke,fromStart,reach){
  const endpoint=fromStart?stroke[0]:stroke.at(-1);
  let point=endpoint,length=0;
  for(let offset=1;offset<stroke.length;offset++){
    const index=fromStart?offset:stroke.length-1-offset;
    const previous=fromStart?index-1:index+1;
    length+=distance(stroke[index],stroke[previous]);point=stroke[index];
    if(length>=reach)break;
  }
  const v=fromStart?[point[0]-endpoint[0],point[1]-endpoint[1]]:[endpoint[0]-point[0],endpoint[1]-point[1]];
  const size=Math.hypot(...v);
  return size?v.map(value=>value/size):[0,0];
}
export function joinContinuousStrokes(strokes){
  const points=strokes.flat();
  if(!points.length)return [];
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const span=Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
  const maximumGap=Math.min(1.5,span*.025),reach=Math.max(2,span*.05),joined=[];
  for(const stroke of strokes){
    const previous=joined.at(-1);
    if(previous){
      const gap=distance(previous.at(-1),stroke[0]);
      const incoming=tangent(previous,false,reach),outgoing=tangent(stroke,true,reach);
      const bridge=[(stroke[0][0]-previous.at(-1)[0])/(gap||1),(stroke[0][1]-previous.at(-1)[1])/(gap||1)];
      if(gap<=maximumGap&&dot(incoming,outgoing)>=.94&&
        (gap<=.15||(dot(incoming,bridge)>=.85&&dot(outgoing,bridge)>=.85))){
        joined[joined.length-1]=[...previous,...(gap<.000001?stroke.slice(1):stroke)];
        continue;
      }
    }
    joined.push(stroke);
  }
  return joined;
}
