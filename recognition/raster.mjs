export function raster(strokes, { size = 64, width = 2.5, inverse = false, crop = true } = {}) {
  const all = strokes.flat();
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = crop ? Math.max(maxX-minX, maxY-minY) : 109;
  const scale = (size-12) / span;
  const cx = crop ? (minX+maxX)/2 : 54.5, cy = crop ? (minY+maxY)/2 : 54.5;
  const paths = strokes.map(s => s.map(p => [(p[0]-cx)*scale+size/2, (p[1]-cy)*scale+size/2]));
  const pixels = new Float32Array(size*size);
  for (const path of paths) for(let i=1; i<path.length; i++) {
      const a = path[i-1], b = path[i];
      const vx=b[0]-a[0], vy=b[1]-a[1];
      const radius=width/2+.5;
      const left=Math.max(0,Math.floor(Math.min(a[0],b[0])-radius));
      const right=Math.min(size-1,Math.ceil(Math.max(a[0],b[0])+radius));
      const top=Math.max(0,Math.floor(Math.min(a[1],b[1])-radius));
      const bottom=Math.min(size-1,Math.ceil(Math.max(a[1],b[1])+radius));
      for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
      const t = Math.max(0, Math.min(1, ((x+.5-a[0])*vx+(y+.5-a[1])*vy)/(vx*vx+vy*vy || 1)));
      const d = Math.hypot(x+.5-a[0]-t*vx, y+.5-a[1]-t*vy);
      const ink = Math.max(0,Math.min(1,radius-d));
      pixels[y*size+x]=Math.max(pixels[y*size+x],ink);
      }
    }
  if(inverse)for(let i=0;i<pixels.length;i++)pixels[i]=1-pixels[i];
  return pixels;
}
