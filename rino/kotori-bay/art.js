export function drawMap(canvas, crabOut=false, sunset=false, flavour=null){
    canvas.width=320; canvas.height=176;
    const g=canvas.getContext('2d'); g.imageSmoothingEnabled=false;
    const rect=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
    const choose=(day,dusk)=>sunset?dusk:day;
    const scan=(x,y,widths,c)=>{for(let j=0;j<widths.length;j++){let w=widths[j];rect(x-(w>>1),y+j,w,1,c);}};
    const sprite=(x,y,pattern,pal)=>{for(let j=0;j<pattern.length;j++)for(let i=0;i<pattern[j].length;i++){let c=pal[pattern[j][i]];if(c)rect(x+i,y+j,1,1,c);}};
    let state=922; const rand=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0; return Math.floor(state/4294967296*n);};
    const sand=choose('#efcf91','#e7b295'),lightSand=choose('#fae3aa','#f2c9a3'),sandShade=choose('#d5ae77','#ba887d');
    const deep=choose('#397fa2','#787a9e'),open=choose('#4197af','#a4839b'),aqua=choose('#5bb5b8','#c59a9e'),shallows=choose('#83ccc0','#deb09c');
    const white=choose('#d0e9d6','#f5d8bc'),wood=choose('#ac8058','#996d59'),woodLight=choose('#d7a56e','#cc9477'),woodShade='#785e50';
    rect(0,0,320,176,sand);rect(0,0,320,118,deep);
    // Horizontal offshore shoals approach the bay in broad irregular bands.
    for(let x=0;x<320;x++){
      const a=16+Math.floor(3*Math.sin(x*.052))+Math.floor(2*Math.sin(x*.11));
      const b=38+Math.floor(4*Math.cos(x*.032))+Math.floor(2*Math.sin(x*.12));
      const c=65+Math.floor(3*Math.sin(x*.051))+Math.floor(2*Math.sin(x*.14));
      const coast=94+Math.floor(3*Math.sin(x*.051))+Math.floor(2*Math.cos(x*.14));
      rect(x,a,1,coast-a,open);rect(x,b,1,coast-b,aqua);rect(x,c,1,coast-c,shallows);
      rect(x,coast-5,1,3,choose('#a9d9c4','#ecc2ac'));rect(x,coast-2,1,3,white);
      rect(x,coast+1,1,3,choose('#d8c694','#d6aa96'));rect(x,coast+4,1,176-coast-4,sand);
    }
    if(sunset){for(let y=5;y<77;y+=2){let x=89+rand(22);rect(x,y,rand(24)+2,1,'#ecc1ae');}}
    for(let i=0;i<460;i++){
      const x=rand(320),y=rand(89),w=1+rand(y>42?7:5);
      rect(x,y,w,1,y<16?choose('#5ba0b4','#9790a7'):y<40?choose('#72bcc3','#c49fae'):choose('#9bd8ca','#e7c4b3'));
      if(i%9===0){rect(x+w,y-1,2,1,white);rect(x+w+2,y-2,3,1,white);}
    }
    for(let i=0;i<102;i++){let x=rand(320),y=98+rand(78);rect(x,y,1+rand(3),1,rand(2)?lightSand:sandShade);}
    // A small rocky headland encloses the bay on the far left.
    for(let y=0;y<17;y++){
      const w=78-Math.floor(y*3.2)+[3,3,0,1][y%4];
      rect(0,y,w+2,1,choose('#709695','#957d8c'));rect(0,y,Math.max(1,w-2),1,y<10?choose('#638a70','#84766e'):choose('#9c9c7d','#ae9481'));
      if(y===9||y===14)rect(0,y,Math.max(1,w-6),1,choose('#b0ac8b','#bf9d87'));
    }
    const pine=(x,y)=>{rect(x,y+5,2,3,'#656c58');scan(x+1,y,[2,4,4,6,6,8],'#557a65');rect(x,y+2,2,1,'#70957a');};
    for(const x of [0,6,11,18,27,34,45])pine(x,-1+rand(4));
    rect(58,0,5,7,'#ecddae');rect(58,2,5,2,'#c36c61');rect(57,0,7,1,'#8d5b57');rect(56,7,9,1,'#9c987b');
    // Stone breakwater and its red navigational beacon.
    for(let i=0;i<16;i++){
      let x=238+i*5,y=11+Math.floor(i*.65);rect(x,y+1,7,7,'#637c7a');rect(x,y,7,3,'#bbb7a0');rect(x,y+1,5,2,'#d7caae');rect(x+1,y+4,4,1,'#88918a');
    }
    rect(237,9,6,6,'#c86456');rect(237,7,6,2,'#f7d49b');rect(238,4,4,3,'#aa594f');rect(239,3,2,2,'#d58b68');rect(235,15,11,2,'#adac98');
    function boat(x,y,hull,sail,mirror=false){
      g.save();g.translate(x,y);if(mirror)g.scale(-1,1);
      rect(-11,5,25,2,choose('#579eaa','#aa8996'));rect(-6,7,15,1,choose('#75b9bb','#c8a3aa'));
      rect(-13,0,27,2,'#675e59');rect(-11,2,23,3,hull);rect(-8,5,16,1,'#6b6860');
      rect(-11,-1,22,2,'#fae4b0');rect(-7,-3,14,2,'#926c51');rect(0,-18,1,17,'#75634f');
      for(let j=0;j<13;j++){const w=(j>>1)+1;rect(-w,-16+j,w,1,j%5===0?'#e7cfa7':sail);}
      for(let j=0;j<10;j++){const w=(j>>1)+1;rect(2,-13+j,w,1,j<3?'#f3dcac':hull);}
      rect(1,-18,4,2,hull);g.restore();
    }
    boat(94,41,'#ba685b','#fff0c2');boat(213,55,'#4a7e94','#ffe1a6',true);
    const gull=(x,y)=>{rect(x-3,y,2,1,white);rect(x-1,y+1,2,1,white);rect(x+1,y,2,1,white);};gull(184,12);gull(194,8);gull(112,15);
    // Worn pier boards with posts, lashings and a mooring cleat.
    rect(153,58,20,54,choose('#76ac9e','#bf9a8c'));rect(149,56,22,54,woodShade);
    for(let y=57;y<=108;y+=4){rect(150,y,20,3,woodLight);rect(151,y,18,1,'#edc58a');if(y%3===0)rect(156,y+1,5,1,'#b88b62');}
    for(const x of [147,170])for(let y=56;y<=100;y+=14){rect(x,y,3,6,woodShade);rect(x,y-1,3,2,'#d6b186');rect(x+1,y+1,1,2,woodLight);}
    rect(152,58,4,1,'#686b63');rect(153,58,1,2,'#686b63');
    function road(x,y,w,h){rect(x,y,w,h,sandShade);rect(x,y+1,w,h-2,lightSand);}
    road(0,134,320,14);road(152,109,18,26);road(40,118,16,18);road(258,118,17,18);
    for(let i=0;i<80;i++){let x=rand(320),y=137+rand(8);rect(x,y,1+rand(3),1,'#e5c28d');}
    function pane(x,y,w,h){rect(x,y,w,h,'#776855');rect(x+1,y+1,w-2,h-2,choose('#91b7b2','#b19fa3'));rect(x+2,y+2,w-4,2,'#d0d4bc');rect(x+(w>>1),y+1,1,h-2,'#f2deb1');}
    function roof(x,y,w,h,a,b,c){
      for(let j=0;j<h;j++){let e=Math.floor(5*j/h);rect(x-e,y+j,w+e*2,1,j===0?c:a);}
      for(let j=3;j<h;j+=4){let e=Math.floor(5*j/h);rect(x-e,y+j,w+e*2,1,b);for(let i=4+(j%3);i<w;i+=7)rect(x+i,y+j-2,1,2,b);}
      rect(x-5,y+h,w+10,3,b);rect(x-4,y+h,w+8,1,c);
    }
    // Grandma's tiled house with a deep engawa, noren and hydrangea pots.
    rect(13,87,68,31,'#bead82');rect(15,83,61,31,'#a17c58');rect(17,91,57,20,'#f1d8a7');
    roof(15,69,60,21,choose('#718d8d','#77798c'),choose('#506f76','#5d617a'),choose('#98b0a3','#a49aa2'));
    rect(21,91,4,21,'#906e53');rect(65,91,4,21,'#906e53');pane(28,95,14,12);
    rect(46,94,15,16,'#786953');rect(47,96,13,10,'#bebfa1');rect(47,94,6,10,'#9a85a5');rect(54,94,6,10,'#aa93ac');rect(49,96,2,3,'#d7c2bd');
    rect(15,109,61,6,wood);for(let x=16;x<76;x+=6)rect(x,109,1,5,woodShade);rect(14,114,64,2,woodShade);
    rect(40,116,17,2,woodLight);rect(39,118,19,1,woodShade);
    function herb(x,y,bloom){rect(x-2,y+1,5,4,'#b58160');rect(x-3,y,7,2,'#ce9663');scan(x,y-5,[3,5,7,8,7,6],'#799463');rect(x-2,y-4,3,2,bloom);rect(x+1,y-3,3,2,bloom);}
    herb(12,112,'#a29abd');herb(79,111,'#a4afce');
    // Ice-pop shop: striped awning, chilled case and freestanding pop sign.
    rect(238,85,60,33,'#c5b087');rect(237,82,60,31,'#cfbe91');rect(240,85,54,26,'#f7deaa');
    rect(240,71,54,14,'#c88c71');rect(239,70,56,3,'#e8ad86');rect(241,76,52,6,'#f8e2ad');
    for(let j=0;j<11;j++){let x=235+j*6;let col=j%2?'#fbe4b9':'#d3756a';rect(x+1,83,6,4,col);rect(x,87,6,5,col);rect(x+1,92,4,2,j%2?'#d8bc92':'#ad625c');}
    rect(244,95,28,11,'#755c4f');rect(246,96,24,7,'#87bcb7');rect(248,98,19,2,'#c6d8b9');
    for(let i=0;i<5;i++){rect(247+i*4,103,3,2,['#dd8373','#f5ca74','#9cae7c','#f2d9a5','#b7a3ba'][i]);}
    rect(243,106,31,3,'#db9e75');rect(277,95,11,17,'#9a795b');rect(279,97,7,8,'#9eb7a1');
    rect(235,112,62,3,'#b98d69');rect(297,103,3,13,'#886f50');rect(295,93,7,12,'#e5937d');rect(296,92,5,1,'#f7ba92');rect(296,94,1,8,'#f8cda3');rect(296,110,5,1,'#d4b489');
    // Tall seaside grass, driftwood, and a striped beach parasol well off the road.
    function grass(x,y){rect(x-1,y-2,1,3,'#91a66c');rect(x,y-5,1,5,'#97ac70');rect(x+1,y-3,2,3,'#779667');rect(x+3,y-4,1,2,'#9cb278');}
    for(let i=0;i<60;i++){let x=rand(320),y=151+rand(26);if((x>34&&x<80)||(x>125&&x<180)||x>274)grass(x,y);}
    for(let i=0;i<20;i++){let x=rand(320),y=152+rand(24);rect(x,y,3,1,choose('#de9c87','#c39186'));rect(x+1,y-1,1,1,'#fae2b2');}
    rect(98,164,14,2,sandShade);rect(95,163,11,2,'#b79065');rect(104,161,2,3,'#af8a64');
    rect(215,161,17,2,sandShade);rect(222,152,2,10,woodShade);scan(223,145,[4,8,12,16,19,22,23,21],'#d87f70');
    for(let i=0;i<7;i++){let n=1+(i>>1);rect(222-n,146+i,n+2,1,'#f9dbad');}rect(213,152,4,1,'#ead1a6');
    const palettes={
      grandma:{h:'#c4bcab',k:'#8a8178',t:'#897d9b',a:'#b69bb3',l:'#776c7c',f:'#715e57'},
      kid:{h:'#855e46',k:'#974f42',t:'#dc8468',a:'#f4ad7e',l:'#768d84',f:'#805f52'},
      kid2:{h:'#5e5048',k:'#537c89',t:'#6899a0',a:'#a3c7b5',l:'#777c82',f:'#6e6158'},
      vendor:{h:'#695447',k:'#b25e54',t:'#c47466',a:'#f5d7a8',l:'#807561',f:'#745d4e'}
    };
    function person(x,y,type){
      const p=palettes[type],colors={...p,s:'#e5ac81',v:'#f2c499',e:'#57483f',w:'#f0d9aa'};
      rect(x-4,y-1,10,2,sandShade);
      sprite(x-4,y-13,['...hhh...','..hhhhk..','..hvvvh..','..seseh..','...vvs...','..ttatt..','.staaats.','.staaats.','..tatt...','..tllt...','...lll...','...l.l...','..ff.ff..','..ff.ff..'],colors);
      if(type==='grandma'){rect(x-3,y-12,2,3,p.h);rect(x-1,y-10,2,1,'#827569');rect(x+2,y-10,2,1,'#827569');}
      if(type==='vendor'){rect(x-3,y-12,7,2,'#f5dfb5');rect(x-2,y-14,5,2,'#e6ceb1');rect(x-1,y-7,3,4,'#f0d4a5');}
      if(type==='kid'){rect(x-3,y-12,7,1,'#c26d5d');rect(x-2,y-13,5,1,'#d88467');}
    }
    person(48,126,'grandma');person(157,91,'kid');person(166,91,'kid2');person(267,126,'vendor');
    rect(146,91,6,2,'#739f97');rect(145,85,7,2,'#507a8f');rect(146,87,5,4,'#4783a7');rect(147,87,1,3,'#88c4cb');rect(147,83,3,1,'#dfc797');rect(146,84,1,2,'#bcae8b');rect(150,84,1,2,'#bcae8b');
    if(crabOut){
      for(let i=0;i<6;i++){let x=150+Math.floor(i*2.6),y=94+i*3;rect(x,y,1,1,'#a38766');rect(x+3,y+1,1,1,'#a38766');}
      sprite(162,111,['r...r...r','rr.r.r.rr','.rsssssr.','..sosos..','.rsssssr.','r.r...r.r'],{r:'#aa5d4d',s:'#de7b59',o:'#6b5147'});
    }
    if(flavour){
      const key=String(flavour).toLowerCase();
      const col=/melon|green|matcha|メロン|抹茶/.test(key)?'#92b778':/lemon|mango|orange|レモン/.test(key)?'#f1bd63':/soda|blue|ソーダ/.test(key)?'#83b8c2':'#df9584';
      rect(271,119,3,4,col);rect(272,123,1,2,'#b38258');rect(271,119,1,2,'#f9dbaf');
    }
}


export function drawPlayer(c, facing){
   const g=c.getContext('2d');g.clearRect(0,0,32,28);g.imageSmoothingEnabled=false;
   const sprite=[
    '         bb                 ',
    '        bccb                ',
    '       bcoocb               ',
    '      bccccccbbbbb          ',
    '     bcccccccddddddbb       ',
    '    bccccccddkdddddddbb     ',
    '   bccccccddkkdddddddddbb   ',
    '  bcccccccddkddddddddddccbb ',
    '  bccbcccccddddddddddccccccb',
    ' bcccbbcccccddddddddccoooocb',
    'bbccccccccccddddddddccoooocb',
    'bccccccopcccddddddddccoooocb',
    ' bbccccppccdddddddddccoooocb',
    '   bbccccccdddddddddcccccccb',
    '     bbbccdddddddddddcccccbb',
    '       bbddddddddddddddbbb  ',
    '       bdddbbbbbbbdddbb     ',
    '       bkkb      bkkb       ',
    '        bb        bb        '];
   const palette={b:'#343137',c:'#fff2d5',d:'#484446',k:'#615956',o:'#e7854c',p:'#eaae80'};
   g.save();if(facing===1){g.translate(32,0);g.scale(-1,1);}
   sprite.forEach((row,y)=>Array.from(row).forEach((a,x)=>{if(palette[a]){g.fillStyle=palette[a];g.fillRect(x+2,y+6,1,1);}}));
   g.fillStyle='#343137';g.fillRect(2,14,3,2);g.fillStyle='#f1ddae';g.fillRect(2,13,1,2);g.fillRect(3,14,2,1);
   g.restore();
 }


export function bucketArt(canvas, step) {
  canvas.width = 320;
  canvas.height = 140;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const rect = (x,y,w,h,c) => {g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
  const oval = (x,y,rx,ry,c) => {
    for(let row=-ry;row<=ry;row++){
      const half=Math.round(rx*Math.sqrt(Math.max(0,1-row*row/(ry*ry))));
      rect(x-half,y+row,2*half+1,1,c);
    }
  };
  const line = (x1,y1,x2,y2,c,size=1) => {
    const n=Math.max(Math.abs(x2-x1),Math.abs(y2-y1),1);
    for(let k=0;k<=n;k++)rect(x1+(x2-x1)*k/n,y1+(y2-y1)*k/n,size,size,c);
  };
  const path=(p,c,w=1)=>p.slice(1).forEach((a,i)=>line(p[i][0],p[i][1],a[0],a[1],c,w));
  const poly=(p,c)=>{
    const ys=p.map(v=>v[1]);
    for(let y=Math.floor(Math.min(...ys));y<=Math.max(...ys);y++){
      const cut=[];
      for(let i=0,j=p.length-1;i<p.length;j=i++) {
        const a=p[i],b=p[j];
        if((a[1]>y+.5)!==(b[1]>y+.5))cut.push(a[0]+(y+.5-a[1])*(b[0]-a[0])/(b[1]-a[1]));
      }
      cut.sort((a,b)=>a-b);
      for(let i=0;i+1<cut.length;i+=2){const x=Math.ceil(cut[i]);rect(x,y,Math.max(1,Math.ceil(cut[i+1])-x),1,c);}
    }
  };
  let seed=1861;
  const random=(n)=>{seed=(1664525*seed+1013904223)>>>0;return Math.floor(seed/4294967296*n);};
  rect(0,0,320,140,'#ebcc92');
  for(let i=0;i<680;i++){const x=random(320),y=random(140);rect(x,y,1+random(3),1,['#f6dda7','#d5b67f','#e4bf83','#f3d89f'][i%4]);}
  // Weathered boards of the landing angle down into the frame from the left.
  poly([[0,0],[99,0],[34,140],[0,140]],'#9a8066');
  poly([[0,0],[96,0],[31,140],[0,140]],'#c7a378');
  for(let j=-80;j<145;j+=22){
    line(0,j,99,j+44,'#96775d',2);line(0,j-1,99,j+43,'#dfbd91');
  }
  // Trim the planks flush with their diagonal sandy edge.
  for(let y=0;y<140;y++){const edge=98-65*y/140;for(let x=Math.ceil(edge);x<104;x++)rect(x,y,1,1,'#ebcc92');}
  path([[98,0],[33,139]],'#ab8a68',2);
  path([[101,0],[36,139]],'#ddbd88',2);
  for(let i=0;i<38;i++){
    const x=random(84),y=random(138);
    if(x<90-65*y/140){line(x,y,x+2+random(5),y+2,'#b28e68');}
  }
  for(const [x,y] of [[49,20],[30,54],[12,92]]){rect(x,y,2,2,'#8a715b');rect(x,y,1,1,'#d9b993');}
  // Two damp prints. The larger toe sits on the inside of each foot.
  function print(x,y,flip){
    const damp='#bc9f76',deep='#ad9471';
    oval(x,y+7,4,6,damp);oval(x+flip,y-1,5,5,damp);oval(x+flip*2,y-6,5,4,damp);
    for(const [dx,dy,r] of [[-3,-13,2],[1,-14,1],[4,-12,1],[6,-10,1],[7,-8,1]])oval(x+dx*flip,y+dy,r,r,deep);
    rect(x-2,y+8,2,1,deep);rect(x+1,y-8,2,1,'#c7ab82');
  }
  print(258,46,1);print(284,75,-1);
  // Small shells give the bucket scale.
  function shell(x,y){path([[x-5,y],[x-3,y-3],[x,y-4],[x+4,y-3],[x+5,y],[x+1,y+3],[x-1,y+3],[x-5,y]],'#b58770');path([[x-3,y],[x,y+2],[x+3,y-1]],'#fce4ba');line(x,y-2,x,y+1,'#fbdbac');}
  shell(225,122);shell(64,97);
  for(const [x,y] of [[205,27],[286,115],[75,125],[239,15],[209,101],[290,20]]){oval(x,y,3,1,'#caa97e');rect(x-2,y-1,2,1,'#eed3a0');}
  const rim='#304f65',metal='#d2e5dd',hi='#f4f6d9';
  oval(138,111,54,10,'#c3a579');oval(135,110,45,8,'#aa916d');
  poly([[78,63],[183,63],[174,101],[166,114],[147,120],[115,119],[97,113],[90,104]],rim);
  poly([[82,64],[179,64],[171,103],[164,110],[146,116],[117,115],[99,109],[93,101]],'#4187a0');
  poly([[84,71],[97,79],[105,107],[111,114],[100,108],[93,100]],'#79b9c1');
  poly([[160,77],[178,68],[170,103],[162,111],[148,116],[145,116]],'#3c6e89');
  path([[98,96],[102,106],[109,110]],'#a3c9c3',2);
  oval(130,66,54,30,rim);oval(130,64,53,29,'#9fced0');oval(130,63,50,26,hi);oval(131,64,48,24,'#3b7589');oval(131,66,44,21,'#70aebb');
  oval(132,69,41,17,'#8fc9c6');
  path([[93,62],[100,55],[107,52]],'#d6e8dc',2);
  path([[152,53],[158,55],[164,59]],'#b4d9cf');
  path([[102,75],[108,77],[113,77]],'#c9e4d8');rect(147,77,8,1,'#b3d9ca');
  // The raised metal handle sits behind the water and clips to the far edges.
  const handle=[[80,65],[77,57],[80,44],[87,32],[100,22],[115,17],[134,15],[149,17],[163,24],[173,34],[180,49],[181,62]];
  path(handle,'#63746e',3);path(handle,'#dde0c9');path([[113,18],[122,16],[134,16],[143,17]],'#425b62',4);path([[114,18],[125,17],[134,17],[142,18]],'#7b9a9a');
  oval(81,66,2,3,rim);oval(180,65,2,3,rim);rect(80,64,2,2,metal);rect(179,63,2,2,metal);
  function crab(x,y){
    const edge='#884938',red='#d96a49',light='#ed8e61',coral='#f6a06b';
    oval(x+1,y+5,15,4,'#677c714d');
    for(const side of [-1,1]){
      [[-2,-2],[1,1],[4,4]].forEach(([offset,tip])=>{
        path([[x+side*6,y+offset],[x+side*12,y+offset-1],[x+side*16,y+tip+2]],edge,2);
        path([[x+side*7,y+offset],[x+side*12,y+offset-1]],red);
      });
      path([[x+side*6,y],[x+side*11,y-3],[x+side*13,y-7]],edge,3);
      oval(x+side*14,y-8,4,4,edge);oval(x+side*14,y-8,3,3,red);
      path([[x+side*16,y-9],[x+side*18,y-13]],light,2);path([[x+side*13,y-10],[x+side*12,y-13]],coral,2);
    }
    oval(x,y,9,5,edge);oval(x,y-1,8,4,red);rect(x-5,y-3,8,2,light);rect(x-3,y-4,3,1,coral);
    for(const dx of [-4,4]){rect(x+dx-1,y-7,3,4,edge);rect(x+dx-1,y-8,3,2,'#f7e6ba');rect(x+dx,y-8,1,2,'#3c4445');}
  }
  if(step===1)crab(134,68);
  if(step===2){crab(222,88);for(let k=0;k<5;k++){const x=182+k*6,y=82+Math.round(k*1.5);rect(x,y,2,1,'#b69a71');rect(x+2,y+3,2,1,'#b69a71');}}
  function wrack(x,y){
    path([[x-14,y+8],[x-5,y+1],[x,y-3],[x+12,y-5],[x+18,y-9]],'#507968',3);
    for(const [dx,dy,side] of [[-8,4,-1],[-5,1,1],[-1,-2,-1],[4,-3,1],[10,-4,-1],[13,-6,1]]){
      const a=x+dx,b=y+dy;
      poly([[a,b+1],[a-3,b-4*side],[a+1,b-7*side],[a+4,b-4*side],[a+2,b]],'#608b6e');
      line(a,b,a,b-5*side,'#80a27b');
    }
  }
  if(step===0){wrack(133,67);for(const x of [129,137]){rect(x,59,2,4,'#b16c4e');rect(x,57,3,3,'#f4dfa5');rect(x+1,57,2,2,'#4b4840');}}
  else wrack(111,70);
  if(step===0){path([[153,71],[159,71],[162,69]],'#ccdfc8');path([[156,74],[162,74],[165,72]],'#b2d5c8');}
}


export function diaryArt(canvas, selection, flavour) {
  canvas.width=164;canvas.height=96;
  const g=canvas.getContext('2d');g.clearRect(0,0,164,96);
  let seed=167;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  function pencil(points,colour,w=1.2,closed=false){
    for(let pass=0;pass<2;pass++){
      g.save();g.beginPath();g.strokeStyle=colour;g.globalAlpha=pass?.28:.85;g.lineWidth=pass?.65:w;g.lineJoin='round';g.lineCap='round';
      const jitter=pass?1.7:.5;
      points.forEach(([x,y],i)=>{let px=x+(rand()-.5)*jitter,py=y+(rand()-.5)*jitter;if(i)g.lineTo(px,py);else g.moveTo(px,py);});
      if(closed)g.closePath();g.stroke();g.restore();
    }
  }
  function fill(points,colour){g.fillStyle=colour;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
  function shape(p,c,outline){fill(p,c);pencil(p,outline,1.8,true);}
  function ellipse(x,y,rx,ry,c,outline){
    const p=Array.from({length:28},(_,i)=>[x+Math.cos(i*Math.PI/14)*rx,y+Math.sin(i*Math.PI/14)*ry]);
    shape(p,c,outline);
  }
  function stroke(p,c){pencil(p,c,1.2);}
  function hatch(p,c){pencil(p,c,.7);}
  if(selection==='crab'){
    // A child's oversized crab peeking over a wonky blue pail.
    const dark='#3b6174';
    shape([[38,42],[49,79],[61,84],[86,84],[95,77],[104,40]],'#94c8cf',dark);
    for(let k=0;k<7;k++)hatch([[48+k*3,61],[55+k*3,77]],'#5e9bad');
    ellipse(71,41,33,10,'#c2dedc',dark);ellipse(71,42,28,6,'#8dbdbd','#59919d');
    pencil([[40,43],[38,31],[44,22],[52,17],[64,15],[78,15],[91,19],[100,27],[103,38]],'#7c8780',1.5);
    const red='#b95b44',light='#e88a60';
    ellipse(78,38,15,8,light,red);
    for(const side of [-1,1]){
      pencil([[78+side*9,37],[78+side*16,33],[78+side*21,23]],red,2.6);
      shape([[78+side*24,23],[78+side*28,18],[78+side*27,27],[78+side*21,30],[78+side*16,25],[78+side*16,17],[78+side*21,22]],light,red);
      for(let j=0;j<3;j++)pencil([[78+side*11,38+j*2],[78+side*(17+j),36+j*2],[78+side*(21+j),39+j*2]],red,1.5);
      pencil([[78+side*6,34],[78+side*7,28]],red,2);ellipse(78+side*7,28,1.8,2.4,'#504d45','#504d45');
    }
    stroke([[73,38],[78,40],[82,38]],red);
    stroke([[113,36],[119,31]],'#ddb658');stroke([[114,42],[124,42]],'#ddb658');stroke([[113,48],[118,51]],'#ddb658');
  }else if(selection==='pops'){
    const soda=flavour==='soda';const light=soda?'#a6d9db':'#c5d59a',dark=soda?'#568da4':'#719457',shadow=soda?'#7bb9ca':'#a5c581';
    function pop(x,y,angle){
      g.save();g.translate(x,y);g.rotate(angle);
      shape([[-2,18],[-2,34],[0,37],[3,36],[4,18]],'#d9b685','#9e815a');
      const p=[[-14,-18],[-12,-26],[-7,-29],[5,-30],[12,-25],[14,-19],[14,17],[10,21],[-10,21],[-14,17]];
      shape(p,light,dark);fill([[9,-25],[13,-18],[13,17],[9,20],[6,18],[8,-10]],shadow);
      for(let i=0;i<3;i++)pencil([[-7+i*6,-18],[-8+i*6,-12],[-8+i*6,11]],shadow,2);
      stroke([[-11,-14],[-9,-21],[-5,-24]],'#f2efce');
      for(let i=0;i<9;i++){let a=-10+rand()*19,b=-12+rand()*28;hatch([[a,b],[a+3,b+4]],dark);}
      g.restore();
    }
    pop(61,43,-.25);pop(100,46,.27);
    stroke([[38,25],[31,21]],'#caa45b');stroke([[40,19],[37,12]],'#caa45b');stroke([[121,34],[128,29]],'#caa45b');
    ellipse(83,74,2,3,shadow,dark);
  }else{
    // The harbour as remembered in broad crayon strokes.
    for(let j=0;j<5;j++){const y=61+j*4;
      pencil([[19+j*3,y],[28+j*3,y+1],[37+j*3,y-1],[49+j*3,y+1],[58+j*3,y-1],[73+j*3,y+1],[89+j*3,y-1],[104+j*3,y+1],[122+j,y-1],[137-j,y]],j%2?'#9bcac0':'#88b8bd',1.2);}
    shape([[43,55],[99,55],[89,65],[60,66]],'#e7a878','#9d7364');
    stroke([[49,58],[69,60],[93,58]],'#cf7d65');pencil([[72,54],[72,19]],'#867965',2);
    shape([[69,22],[67,50],[49,48]],'#f1d98e','#b69a62');shape([[75,25],[75,50],[93,49]],'#d9e5d6','#81a7a4');
    for(let n=0;n<4;n++){hatch([[66-n,33+n*3],[62-n,44+n]],'#cfb977');}
    pencil([[104,26],[110,24],[116,28],[120,23],[126,21]],'#6f7771',1.8);
    pencil([[119,35],[123,34],[127,36],[130,32],[134,32]],'#92968a',1.2);
    ellipse(34,27,6,6,'#ebca79','#d8b66b');
  }
}

export function drawBeach(canvas, sunset) {
  canvas.width = 320;
  canvas.height = 165;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const fill = (x,y,w,h,c) => { g.fillStyle=c; g.fillRect(x,y,w,h); };
  const colour = (day,dusk) => sunset ? dusk : day;
  const sand = colour('#efcf91','#e7b295');
  const sun = colour('#fae3aa','#f2c9a3');
  const shade = colour('#d5ae77','#ba887d');
  const drift = colour('#c4a67f','#b48f86');
  const timber = colour('#a0886e','#957c7b');
  let seed=72121;
  const next = n => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return Math.floor(seed/4294967296*n);};
  fill(0,0,320,165,sand);
  for(let i=0;i<350;i++){
    const x=next(320), y=next(165);
    fill(x,y,next(5)===0?3:1,1,next(3)===0?shade:sun);
  }
  // Soft wind-scoured stripes follow the contours of the sheltered beach.
  for(let i=0;i<24;i++){
    const x=next(307), y=9+next(148), w=4+next(12);
    fill(x,y,w,1,colour('#e9c88d','#deb092'));fill(x+w,y-1,2+next(5),1,sun);
  }
  function dune(x,y,span,height){
    for(let j=0;j<height;j++){
      const w=Math.max(1,Math.floor(span*Math.sqrt(j/height)));
      fill(x-w,y+j,w*2,1,colour('#e7c48c','#dbab90'));
      if(j<3)fill(x-w,y+j,Math.max(1,w-1),1,sun);
    }
    for(let i=0;i<22;i++){
      const xx=x-span+next(span*2), yy=y+height-3+next(11);
      const leaf=colour('#889964','#8c886c'); fill(xx,yy-3,1,3,leaf);fill(xx-1,yy-5,1,2,leaf);
      fill(xx+1,yy-2,1,3,colour('#9baa72','#a69479'));fill(xx+2,yy-3,1,1,leaf);
    }
  }
  dune(-3,111,37,25);dune(327,123,55,30);dune(256,157,31,10);
  // Two short sections of sun-bleached woven windbreak at the dune edge.
  function windbreak(x,y,count){
    for(let i=0;i<count;i++){
      const px=x+i*5,py=y+Math.floor(i/2);
      fill(px+2,py+10,6,2,shade); fill(px,py,3,11,timber);
      fill(px,py,2,9,drift);fill(px,py-1,2,2,colour('#edd5a5','#d6b49d'));
      if(i<count-1){fill(px+3,py+2,2,2,drift);fill(px+3,py+6,2,2,drift);}
    }
  }
  windbreak(1,88,6);windbreak(283,104,8);
  // A low striped parasol and checked picnic rug sit well below the play path.
  const matx=58, maty=118;
  fill(matx+2,maty+2,32,20,shade);fill(matx,maty,32,20,colour('#b87c65','#b97c72'));
  fill(matx+1,maty+1,30,18,colour('#e6bd96','#d4a297'));
  for(let i=2;i<31;i+=5)fill(matx+i,maty+1,1,18,colour('#c98c75','#be897f'));
  for(let j=3;j<18;j+=5)fill(matx+1,maty+j,30,1,colour('#c98c75','#be897f'));
  for(let i=1;i<32;i+=3){fill(matx+i,maty-1,1,1,sun);fill(matx+i,maty+20,1,1,sun);}
  fill(44,133,21,2,shade);fill(50,112,2,23,timber);fill(50,112,1,20,drift);
  for(let y=0;y<13;y++){
    const rad=Math.min(19,2+y*2),left=51-rad;
    fill(left,104+y,rad*2+1,1,colour('#c87168','#be777e'));
    const pale=colour('#f8dfae','#ecc4b0');
    const w=Math.max(1,Math.floor(rad*.43));
    fill(left+2,104+y,w,1,pale);fill(51-Math.floor(rad*.17),104+y,w,1,pale);
    if(y>3)fill(51+Math.floor(rad*.69),104+y,Math.max(1,Math.floor(rad*.18)),1,pale);
  }
  for(let x=32;x<=68;x+=6){fill(x+1,117,4,1,colour('#a76d64','#9d6871'));fill(x+2,118,2,1,colour('#a76d64','#9d6871'));}
  fill(50,102,3,2,timber);
  // A few evocative props and the tracks of someone coming from the shoreline.
  fill(80,122,5,4,colour('#9c8862','#9f8177'));fill(80,121,5,1,sun);
  fill(84,122,2,2,shade);fill(77,132,6,1,shade);fill(78,130,4,2,colour('#86a69a','#ad9399'));
  for(let i=0;i<8;i++){const x=119-Math.floor(i*3.2)+(i%2)*3,y=17+i*5;fill(x,y,2,2,shade);fill(x-1,y+2,2,1,colour('#e0bd87','#d2a18c'));}
  function shell(x,y){
    fill(x+1,y,3,1,sun);fill(x,y+1,5,2,colour('#dda99a','#d59b9a'));
    fill(x+2,y+1,1,2,colour('#efd4ab','#efbfa6'));fill(x+1,y+3,3,1,shade);
  }
  shell(18,52);shell(253,86);shell(95,146);
}

// Extend the coast at either edge when the game is played in a wide, shallow viewport.
// Use edge strips of the current scene so the horizon and sunset remain continuous.
export function drawCoastEdges(canvas, map, mapWidth, worldWidth, mapHeight) {
  const side = Math.max(0, Math.ceil((worldWidth - mapWidth) / 2 * 320 / mapWidth));
  canvas.hidden = !side;
  if (!side) return;
  canvas.width = 320 + 2 * side;
  canvas.height = 176;
  canvas.style.height = mapHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  for (let x = 0; x < side; x++) {
    const step = x % 30;
    const sample = step <= 15 ? step : 30 - step;
    ctx.drawImage(map, sample, 0, 1, 176, side - 1 - x, 0, 1, 176);
    ctx.drawImage(map, 319 - sample, 0, 1, 176, side + 320 + x, 0, 1, 176);
  }
}
