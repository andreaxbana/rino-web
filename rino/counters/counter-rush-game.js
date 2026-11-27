/* Hand-drawn game objects from the Counter Rush prototype. */
(function counterRushGame() {
'use strict';

function drawCounterObject(kind, document, frame = 0, canvas = document.createElement('canvas')) {
  if (canvas.width !== 240 || canvas.height !== 240) canvas.width = canvas.height = 240;
  canvas.setAttribute('aria-hidden', 'true');
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  const ink = '#55483e', cream = '#fff2d0', shine = '#fff9ed';
  c.setTransform(2,0,0,2,0,0);
  c.clearRect(0,0,120,120);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  function path(data, color, stroke = ink, width = 2.8) {
    const item = new Path2D(data);
    if (color) { c.fillStyle = color; c.fill(item); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(item); }
  }
  function line(data, color = ink, width = 2.2) { path(data, null, color, width); }
  function oval(x, y, rx, ry, color, stroke = null, width = 2.4) {
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (color) { c.fillStyle = color; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function dot(x, y, r, color) { oval(x, y, r, r, color); }
  function shadow(rx) { oval(62, 99, rx, 5.5, 'rgba(94,68,51,.16)'); }
  function star(x, y, color) {
    c.save(); c.translate(x, y);
    path('M0 -8 Q1 -2 6 0 Q1 1 0 7 Q-1 1 -6 0 Q-1 -2 0 -8Z',color,null);
    c.restore();
  }
  function clock(x, y, radius, face) {
    const angle = frame * Math.PI / 2 - Math.PI / 2;
    oval(x,y,radius,radius,face,ink,2.6);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      dot(x + Math.cos(a) * (radius-4), y + Math.sin(a) * (radius-4), 1.1,ink);
    }
    line('M'+x+' '+y+' l'+Math.cos(angle)*(radius-6)+' '+Math.sin(angle)*(radius-6),ink,2.7);
    dot(x,y,2.2,'#c47458');
  }
  function musicNote(x, y, color, scale = 1) {
    c.save(); c.translate(x,y); c.scale(scale,scale);
    path('M-7 1 V-15 L8 -19 V-2 Q7 4 2 4 Q-3 5 -4 1 Q-4 -3 4 -5 V-13 L-3 -11 V3 Q-4 8 -10 8 Q-15 8 -15 4 Q-15 1 -7 1Z',color,ink,1.4);
    c.restore();
  }
  switch (kind) {
    case 'jump': {
      const lift = [0, 10, 22, 10][frame];
      shadow(20 - lift/3);
      line('M19 98 H101','#96a88d',2);
      c.save(); c.translate(0,-lift);
      const knee = lift > 15;
      line(knee ? 'M54 70 L42 77 L36 70 M66 70 L76 77 L86 71' :
        'M54 69 L50 82 L46 92 M65 70 L70 82 L74 91',ink,8);
      line(knee ? 'M35 70 L30 66 M85 71 L90 67' : 'M47 92 L39 92 M74 91 L82 91','#c87961',7);
      line(knee ? 'M47 52 L34 44 L27 34 M70 52 L83 44 L90 34' :
        'M47 52 L37 63 L29 62 M70 52 L80 62 L89 60','#c68d6c',6);
      path('M48 48 Q58 43 69 49 L74 70 Q59 76 44 70Z','#65a3a5');
      oval(58,35,13,14,'#f1c3a0',ink);
      path('M45 34 Q44 19 57 19 Q69 18 72 31 L64 27 L61 31 L53 26Z','#6b5151');
      dot(65,35,1.6,ink); c.restore();
      break;
    }
    case 'clap': {
      const gap = [7, 3, 0, 4][frame];
      shadow(34);
      for (const side of [-1,1]) {
        c.save(); c.translate(60 + side*(gap+3),69); c.scale(side,1); c.rotate(-.37);
        path('M-1 18 Q-11 7 -7 -1 L-3 -17 Q-2 -21 1 -18 L1 -4 L4 -30 Q5 -34 8 -32 L7 -12 L11 -31 Q12 -35 15 -32 L13 -9 L18 -26 Q20 -30 22 -27 L19 -5 L26 -17 Q29 -21 31 -18 L25 4 Q21 14 13 21 L13 32 L-2 30Z',side < 0 ? '#e7b58b' : '#f4caa5',ink,2);
        path('M-4 24 L16 26 L16 35 L-6 33Z',side < 0 ? '#8dabc0' : '#c38b7a',ink,2);
        c.restore();
      }
      if (gap <= 3) line('M60 23 V13 M50 27 L45 19 M70 27 L76 19','#c58b48',3);
      break;
    }
    case 'ring': {
      shadow(30);
      c.save(); c.translate(59,37); c.rotate([-.20,.06,.23,-.04][frame]);
      oval(0,-13,6,7,'#eed3a0',ink); oval(0,44,7,8,'#be8968',ink);
      path('M-28 36 Q-17 31 -17 9 Q-17 -8 -2 -9 Q17 -10 19 11 Q20 32 31 36 Q30 44 0 44 Q-26 44 -28 36Z','#e8ba65');
      line('M-23 35 Q-3 40 25 36','#a67546',2); line('M-10 9 Q-11 20 -13 23','#ffe5a1',3);
      c.restore();
      line('M20 40 Q13 48 15 55 M98 40 Q105 48 103 55','#76a4ad',2.8);
      break;
    }
    case 'request':
    case 'order':
    case 'report': {
      const lift = [0, 6, 13, 6][frame];
      shadow(34);
      c.save(); c.translate(53,52-lift); c.rotate(-.08);
      path('M-24 -19 L21 -19 L26 -12 L26 25 L-24 25Z','#ffedcf');
      line('M12 -18 L12 -10 L23 -10','#b39978',1.7);
      if (kind === 'request') {
        path('M-15 -6 Q-7 -14 0 -8 Q6 -3 -4 5 L-8 8 L-8 3 Q-18 2 -15 -6Z','#a6c3b9','#6f9086',1.5);
        dot(-10,-3,1,ink); dot(-6,-3,1,ink);
      } else if (kind === 'order') {
        path('M-15 -7 L-11 -7 L-8 1 H1 L5 -5 H-10','#d5ae6d',ink,1.5); dot(-7,5,1.8,ink); dot(1,5,1.8,ink);
      } else {
        path('M-8 -10 L2 5 H-18Z','#e5ac6e',ink,1.5);
        line('M-8 -5 V-1',ink,1.7); dot(-8,2,1,ink);
      }
      line('M-15 13 H14 M-15 18 H5','#a49581',2);
      c.restore();
      if (kind === 'request') {
        path('M18 61 L54 48 L92 61 L91 89 L20 89Z','#d89c78');
        path('M18 61 L53 77 L92 61 L91 89 L20 89Z','#efc58c');
      } else if (kind === 'order') {
        path('M16 65 L32 57 L46 62 L36 69Z','#eab986');
        path('M36 69 L46 62 L63 68 L51 75Z','#f7c995');
        path('M16 65 L36 69 L51 75 L50 94 L16 85Z','#cf9b6e');
        path('M51 75 L63 68 L63 86 L50 94Z','#b98463');
        line('M30 68 L30 77','#f5db9b',4);
      } else {
        path('M19 61 H45 L50 68 H96 L90 90 H17Z','#81aab2');
        path('M17 71 H39 L45 75 H92 L88 94 H19Z','#abc8c5');
        line('M26 82 H48','#6c9599',2);
      }
      break;
    }
    case 'arithmetic':
    case 'riddle':
    case 'spelling': {
      shadow(36);
      path('M18 23 L83 18 L87 85 L22 93Z',kind==='riddle'?'#bdd3ca':kind==='spelling'?'#efc6bd':'#eddbaf');
      path('M22 27 L78 23 L82 80 L26 87Z','#fff3d9',ink,1.6);
      if (kind === 'arithmetic') {
        line('M32 40 Q45 32 44 42 Q44 46 34 54 L46 52 M55 43 L65 42 M60 38 L61 48 M31 65 L45 63 M32 70 L46 68',ink,2.6);
      } else if (kind === 'spelling') {
        path('M34 36 L65 33 L68 63 L37 66Z',null,'#c8b9aa',1.6);
        line('M48 36 L52 64 M36 51 L67 48','#d6c6ae',1.1);
        line('M40 46 L61 43 M49 39 L51 59 M49 45 Q47 50 41 56 M51 46 L60 54',ink,2.7);
      } else {
        path('M32 44 Q33 30 47 31 Q59 30 60 40 Q61 47 52 52 L51 56',null,'#698e98',3.9); dot(51,63,2.7,'#698e98');
      }
      const x = 58 + frame*4;
      c.save(); c.translate(x,74); c.rotate(.56);
      path('M-3 2 V-35 H4 V2 L0 11Z','#d9a665',ink,1.6);
      path('M-3 2 H4 L0 11Z','#ead9b6',ink,1.2); c.restore();
      break;
    }
    case 'break': {
      shadow(35);
      path('M21 64 Q21 82 34 88 H51 Q64 81 65 64Z','#8bb6a7');
      path('M64 66 Q76 62 76 69 Q75 78 61 79',null,ink,3.4);
      oval(43,64,22,6,'#ead5ae',ink,1.9); oval(43,64,17,3.6,'#aa785b');
      line('M33 94 Q44 98 61 93','#9b9c83',2.4);
      clock(78,40,20,'#f9e2a4');
      break;
    }
    case 'wait': {
      shadow(38);
      path('M13 68 H73 V73 H13Z','#bc9671'); line('M20 75 V91 M67 74 V91',ink,4);
      oval(39,37,10,11,'#eec19e',ink);
      path('M28 36 Q26 22 39 24 Q49 23 51 34 L42 30 L37 34Z','#665463');
      path('M32 49 Q45 44 48 53 L52 64 L39 67 L30 62Z','#929fb4');
      line('M36 66 L53 67 L57 83 L66 84',ink,5.5);
      clock(83,33,16,'#f6dbad'); line('M83 50 V85 M72 88 H94','#8a948b',2.4);
      break;
    }
    case 'timer': {
      shadow(28);
      path('M53 25 V18 H64 V25 M50 16 H67 V20 H50Z','#b1b8b9');
      line('M82 34 L87 28 M84 25 L91 31',ink,4);
      oval(59,60,32,34,'#c88473',ink,2.6);
      clock(59,59,24,'#fff0cd');
      break;
    }
    case 'hotel':
    case 'inn':
    case 'camp': {
      const moonX = 67 + frame*4;
      path('M15 81 Q16 33 44 19 Q71 9 94 34 Q105 49 103 81Z','#7d91a1',null);
      c.save(); c.translate(moonX,29);
      path('M4 -10 Q-3 -5 1 2 Q4 7 10 7 Q3 14 -5 9 Q-15 3 -10 -6 Q-6 -11 4 -10Z','#ffdb91',null); c.restore();
      dot(36,40,1.7,'#fff1ca'); dot(52,28,1.4,'#fff1ca'); dot(92,49,1.4,'#fff1ca');
      if (kind === 'camp') {
        path('M17 88 L52 43 L86 54 L103 88Z','#be8a64');
        path('M15 88 L52 43 L74 88Z','#efc37d'); path('M31 88 L51 58 L57 88Z','#76695f');
        line('M11 94 L19 85 M94 86 L105 95','#99896f',2.4);
      } else if (kind === 'inn') {
        path('M21 62 H91 V92 H22Z','#efcaab');
        path('M12 61 Q23 59 32 45 H83 Q90 57 101 59 L96 65 H15Z','#675e5c');
        path('M33 71 H53 V87 H33Z','#f4e7be');
        line('M43 71 V87 M34 79 H52 M62 92 V70 H81 V92','#a27c65',2.1);
        path('M61 68 H82 V76 H74 V73 L72 77 H61Z','#809e98',ink,1.2);
      } else {
        path('M24 46 L67 39 L82 47 V92 H24Z','#deb798');
        path('M67 39 L82 47 V92 H68Z','#c6957d',ink,1.5);
        for(const y of [52,68]) for(const x of [32,47]) path('M'+x+' '+y+' h8 v8 h-8Z','#ffde96',ink,1.4);
        path('M46 92 V80 H57 V92Z','#896f65',ink,1.5);
      }
      line('M11 94 H106','#989983',2.5);
      break;
    }
    case 'piano':
    case 'piano-repeat':
    case 'piano-minutes':
    case 'playlist':
    case 'concert': {
      shadow(35);
      if (kind.startsWith('piano')) {
        path('M20 50 Q36 47 60 38 Q73 33 83 41 L93 62 L40 81 L18 69Z','#77a1a2');
        path('M20 63 L54 70 L89 56 L92 66 L54 82 L20 72Z','#fff0ca');
        for (let i = 0; i < 4; i++) line('M'+(26+i*6)+' '+(65+i)+' l-1 7',ink,1.3);
        line('M24 74 L23 88 M52 82 V95 M88 69 V81',ink,4);
      } else if (kind === 'playlist') {
        path('M27 30 Q26 26 32 25 L68 21 Q73 20 75 25 L83 88 Q83 93 77 94 L39 98 Q34 98 33 91Z','#8e9eaa');
        path('M33 34 L69 30 L75 77 L39 83Z','#e2ded6',ink,1.6);
        for (let i = 0; i < 3; i++) {
          const y = 45 + i * 12;
          dot(44,y,2.1,frame%3===i ? '#ae6d5c' : '#9b9e99'); line('M50 '+y+' l15 -2','#7d9195',2);
        }
        oval(57,88,5,3,'#c9c5b4',ink,1.3);
      } else {
        path('M18 29 H92 V88 H18Z','#bda2ab');
        path('M18 29 H45 Q40 49 23 57 L29 85 H16Z M93 29 H68 Q73 49 88 57 L83 85 H96Z','#af6e6e');
        path('M28 83 H88 L99 92 H15Z','#c59870');
        line('M57 58 V79 M50 81 H65',ink,2.8);
        oval(57,52,4,8,'#697a80',ink,1.8);
      }
      musicNote(kind==='concert'?78:84,40-[0,3,7,10][frame],'#edbe67',.82);
      break;
    }
    case 'pen': {
      shadow(29);
      c.save(); c.translate(58,59); c.rotate(-.7);
      path('M-24 -7 L33 -7 Q44 -7 46 -2 Q48 4 35 8 L-24 7Z','#557d91');
      path('M-26 -6 L-18 -6 L-18 6 L-26 6Z','#cfa66c');
      path('M-26 -5 L-32 -7 L-47 0 L-32 7 L-26 5Z','#efcf88');
      line('M-45 0 L-33 0',ink,1.5); dot(-33,0,1.8,ink);
      line('M12 -7 L12 7','#bf9c63',2);
      line('M34 -3 L21 -3 Q17 -3 17 0','#f1d494',2.7);
      line('M-16 -4 L7 -4','#95b6be',2);
      c.restore();
      break;
    }
    case 'candle': {
      shadow(23);
      oval(60,88,26,9,'#b6a5ad',ink);
      path('M44 48 Q59 42 76 48 L75 84 Q74 90 60 90 Q47 91 44 85Z','#eaa3a3');
      path('M45 52 Q48 57 51 53 L52 62 Q57 66 59 57 Q65 61 66 54 Q72 56 75 50 L75 47 Q59 43 45 47Z','#ffd5bc','#b47e70',1.8);
      line('M60 47 Q56 39 61 33',ink,2);
      path('M59 39 Q48 37 51 28 Q56 20 59 10 Q63 16 67 23 Q72 35 62 39Z','#f6ad54');
      path('M59 36 Q54 34 58 28 L61 21 Q66 34 59 36Z','#fff0b4',null);
      line('M50 71 L50 80','#ffdac0',2.5);
      break;
    }
    case 'bottle': {
      shadow(24);
      path('M50 17 L69 17 L69 39 Q69 45 77 50 Q83 54 83 65 L83 87 Q83 94 77 96 Q61 99 43 96 Q38 95 38 89 L38 63 Q38 55 44 49 Q51 44 51 39Z','#89b7a6');
      path('M39 61 Q61 65 82 61 L82 79 Q61 83 39 79Z','#f6dda7','#af9979',1.6);
      path('M53 66 Q59 62 66 68 Q64 75 57 76 Q54 73 53 66Z','#94a17c',null);
      path('M49 15 Q59 12 71 15 L71 22 Q60 25 49 22Z','#da9b73');
      line('M55 27 L55 37 M48 51 Q43 56 43 59 M44 84 L44 89','#d6e9cc',2.6);
      break;
    }
    case 'postcard': {
      shadow(36);
      c.save(); c.translate(60,60); c.rotate(.13);
      path('M-46 -29 L45 -29 L45 29 L-46 29Z','#fff0cb');
      for (const x of [-40,-18,4,26]) {
        line('M'+x+' -26 l8 0','#cc7772',3);
        line('M'+(x+10)+' 26 l8 0','#7696a9',3);
      }
      line('M-2 -16 L-2 17','#b9aa8d',1.6);
      path('M26 -21 L37 -21 L37 -9 L26 -9Z','#b5b67b','#a08c62',1.2);
      oval(20,-10,7,7,null,'#9d8c78',1.3); line('M20 -11 Q27 -14 34 -11 M20 -8 Q28 -10 34 -8','#9d8c78',1);
      line('M7 2 L34 2 M7 9 L31 9 M-35 -7 L-15 -7 M-35 -1 L-20 -1','#bca78a',1.8);
      c.restore();
      break;
    }
    case 'photo': {
      shadow(33);
      c.save(); c.translate(60,60); c.rotate(-.14);
      path('M-37 -38 L37 -38 L37 39 L-37 39Z','#fff4df');
      path('M-30 -30 L30 -30 L30 20 L-30 20Z','#91c0c8');
      dot(15,-18,6,'#f6d68d');
      path('M-30 10 L-12 -14 L9 11 L18 -2 L30 10 L30 20 L-30 20Z','#708a86',null);
      path('M-18 -6 L-12 -14 L-5 -5 L-11 -8 L-14 -5Z',cream,null);
      path('M-30 14 Q-12 5 -1 12 Q13 18 30 11 L30 20 L-30 20Z','#9eac76',null);
      c.restore();
      break;
    }
    case 'stamp': {
      shadow(27);
      c.save(); c.translate(61,59); c.rotate(.17);
      let edge = 'M-29 -36 ';
      for(let i=0;i<6;i++) edge+='q4.8 6 9.6 0 ';
      for(let i=0;i<7;i++) edge+='q-6 5.1 0 10.2 ';
      for(let i=0;i<6;i++) edge+='q-4.8 -6 -9.6 0 ';
      for(let i=0;i<7;i++) edge+='q6 -5.1 0 -10.2 ';
      path(edge+'Z','#fff2ce',ink,2.2);
      path('M-21 -27 L21 -27 L21 27 L-21 27Z','#ac8da2','#8e707f',1.7);
      path('M-16 9 Q-2 5 4 -10 Q10 -22 15 -17 L11 -10 Q13 -3 5 1 Q-2 12 -16 9Z','#fff0c5',null);
      path('M3 2 Q-7 -8 -12 -15 Q-9 -13 -3 -13 L9 -4Z','#e6bfba',null);
      line('M-13 18 L12 18','#f5dcc3',1.8); c.restore();
      break;
    }
    case 'dictionary': {
      shadow(31);
      path('M24 25 L74 15 L93 79 L86 93 L39 102 L24 93Z','#694d66');
      path('M32 34 L74 24 L89 80 L82 88 L40 96Z','#ead7af');
      path('M21 27 L72 15 L87 78 L35 92Z','#8c637f');
      path('M23 27 L31 25 L45 89 L36 91Z','#68465f',null);
      line('M35 34 L68 26 M46 78 L78 71','#d9b786',2);
      line('M47 62 L51 40 L64 58 M49 54 L60 51','#f9ddae',3.2);
      line('M82 47 L88 45 M84 56 L90 54 M87 65 L92 63','#dfb65d',3.2);
      break;
    }
    case 'magazine': {
      shadow(33);
      c.save(); c.translate(60,62); c.rotate(.14);
      path('M-31 -41 L31 -40 L33 34 Q18 42 -29 38Z','#ead9b6');
      path('M-33 -43 L30 -43 L31 32 Q12 37 -32 35Z','#eab0a0');
      path('M-26 -33 L24 -33 L24 -24 L-26 -24Z','#a05a65',null);
      path('M-25 -16 L4 -16 L5 15 L-25 15Z','#ead7a4','#bd8d7b',1.3);
      line('M-11 10 L-9 -3','#7b8a65',2.4);
      for(const [x,y] of [[-12,-8],[-7,-10],[-5,-6],[-10,-4]]) dot(x,y,4.1,'#c77776');
      dot(-9,-7,2.1,'#ffdb86');
      line('M10 -15 L24 -15 M10 -8 L22 -8 M10 0 L24 0 M-24 23 L20 23','#a76b68',2.1);
      c.restore();
      break;
    }
    case 'comic': {
      shadow(32);
      path('M25 20 L84 22 L91 87 Q63 94 29 96Z','#e6c897');
      path('M23 16 L82 19 L87 82 L27 90Z','#73a5ab');
      path('M27 17 L33 17 L36 88 L28 89Z','#4d7886',null);
      path('M43 33 L50 38 L58 27 L61 38 L75 36 L69 46 L78 53 L66 56 L69 68 L57 62 L51 73 L47 61 L37 63 L42 53 L34 45 L45 44Z','#f2ce76','#856f57',1.8);
      line('M55 44 L55 54',ink,3.4); dot(55,59,1.9,ink);
      path('M66 24 Q74 22 78 26 Q79 31 74 33 L69 36 L69 32 Q62 31 66 24Z',shine,ink,1);
      break;
    }
    case 'dog': {
      shadow(35);
      path('M73 64 Q91 62 94 51 Q98 43 102 48 Q106 57 98 67 Q88 78 74 77Z','#d4ac79');
      path('M38 60 Q59 50 78 58 Q91 63 90 77 L87 91 Q85 97 78 94 L76 82 L57 85 L52 96 Q47 99 43 94 L43 82 Q33 83 30 73Z','#e0b77d');
      path('M25 40 Q24 25 39 24 Q55 20 66 36 Q74 49 64 59 Q57 69 38 68 Q21 68 17 56 Q17 49 25 45Z','#edc991');
      path('M33 29 Q20 21 17 32 Q14 43 19 53 Q23 57 27 48Z','#ab7959');
      path('M55 28 Q69 24 72 37 Q76 49 66 54 Q60 54 58 43Z','#ad7957');
      oval(39,55,13,8,'#f4deae'); oval(33,49,4.3,3.1,ink);
      dot(32,40,2.3,ink); dot(49,39,2.4,ink);
      line('M35 51 Q34 58 40 58 M40 65 Q53 68 61 61','#9b7058',2.1);
      break;
    }
    case 'mouse': {
      shadow(32);
      line('M70 83 Q88 85 99 69 Q106 56 96 51 Q90 49 89 54',ink,5.5);
      line('M70 83 Q88 85 99 69 Q106 56 96 51 Q90 49 89 54','#dca3a7',3.5);
      path('M15 70 Q22 63 31 60 Q40 42 57 41 Q79 41 85 61 Q92 84 71 88 Q38 96 17 78Z','#9b99ae');
      oval(34,48,11,13,'#a29fb3',ink); oval(35,49,6.7,8,'#e1b0b3');
      oval(54,42,12,14,'#a29fb3',ink); oval(54,44,7.3,8.6,'#e4b5b7');
      dot(32,65,3.2,ink); dot(31,64,1,shine); oval(16,72,4,3.4,'#d797a0',ink,1.4);
      line('M24 73 L10 68 M25 76 L10 78 M35 87 L29 91 M68 87 L63 91',ink,1.6);
      break;
    }
    case 'turtle': {
      shadow(37);
      oval(35,83,8,10,'#8caa80',ink);
      oval(69,84,8,10,'#8caa80',ink);
      path('M70 69 Q81 69 86 60 Q92 50 102 55 Q112 60 107 68 Q104 76 93 77 Q86 86 72 84Z','#aac28b');
      path('M20 72 L12 70 L20 78Z','#8d9c74');
      path('M18 71 Q22 42 46 36 Q73 30 85 64 L87 73 Q64 87 21 79Z','#759987');
      path('M33 58 L42 43 L56 42 L66 56 L55 68 L41 66Z','#a3b88b','#5e8171',1.8);
      line('M33 58 L22 58 M41 66 L35 77 M55 68 L60 79 M66 56 L80 58 M56 42 L58 36','#5e8171',1.8);
      path('M17 72 Q50 81 86 69 L86 75 Q53 88 20 79Z','#e3c48b');
      dot(101,61,2.5,ink); line('M101 69 Q105 70 108 66',ink,1.4);
      break;
    }
    case 'coffee': {
      shadow(35);
      oval(57,85,37,9,'#dbcbb4',ink); oval(57,84,29,5,'#e9d9b9','#b8a98f',1.3);
      path('M77 46 Q94 41 95 53 Q97 66 79 70 L75 64 Q88 61 88 54 Q89 49 78 53Z','#f3e4c9');
      path('M25 44 Q50 41 80 43 L76 65 Q74 82 56 83 Q38 84 32 70Z','#efe1c3');
      oval(53,44,27,6.5,'#f7ead0',ink); oval(53,45,22,4.2,'#714939');
      line('M39 45 Q51 39 64 45','#c69a6e',1.8);
      line('M40 31 Q35 25 41 19 M53 32 Q48 26 53 19 Q56 15 54 12','#c6a78d',2.2);
      line('M31 61 Q46 68 75 59','#ad756b',3.5);
      break;
    }
    case 'juice': {
      shadow(24);
      path('M33 34 Q58 29 84 34 L76 89 Q73 96 59 95 Q45 95 42 89Z','#f6e6c4');
      path('M37 45 Q57 42 80 45 L73 86 Q61 91 46 86Z','#e8a44c',null);
      oval(59,44,21,4,'#f7c570','#c88c4e',1.2);
      line('M63 47 L74 18 L84 14','#72695d',4.5); line('M63 47 L74 18 L84 14','#eea09a',2.5);
      path('M33 46 Q20 43 22 30 Q24 17 38 19 Q49 20 51 29 L39 35Z','#eeae5c');
      path('M27 38 Q21 29 31 24 Q39 19 45 27 L35 33Z','#ffd88a',null);
      line('M36 32 L30 24 M36 32 L26 32','#fff0c1',1.5);
      line('M41 53 L45 68',shine,2.5);
      break;
    }
    case 'milk': {
      shadow(25);
      path('M32 27 Q58 22 85 27 L79 89 Q79 94 62 96 Q44 96 40 89Z','#b1cdd4');
      path('M35 39 Q59 34 82 39 L76 86 Q61 93 43 86Z','#fff8de',null);
      oval(59,39,23,4.8,'#fffbed','#b6bbb0',1.3);
      oval(58.5,27,26.4,4.4,'#d4e2df',ink,2);
      path('M45 53 Q49 48 55 54 Q59 59 53 64 Q45 65 45 59Z M68 70 Q72 62 77 66 L76 75 Q71 78 68 74Z','#737a79',null);
      line('M39 44 L42 59',shine,2.6);
      break;
    }
    case 'bus': {
      shadow(43);
      path('M10 39 Q10 30 22 29 L91 28 Q103 29 106 39 L109 75 Q111 84 100 86 L20 86 Q10 85 10 77Z','#e6b269');
      path('M14 39 L34 38 L34 56 L14 57Z M39 38 L56 38 L56 55 L39 56Z M61 38 L77 37 L77 55 L61 55Z M82 37 L99 37 L103 54 L82 55Z','#a3c7c7',ink,1.7);
      path('M15 65 L106 62 L106 68 L15 71Z','#d58e62',null);
      path('M85 59 L100 59 L103 78 L85 78Z','#d2ac81',ink,1.4); line('M92 60 L94 77',ink,1.4);
      for(const x of [28,80]) {
        oval(x,85,8.4,9,'#585a57',ink,2); dot(x,85,3.4,'#e3d0a9');
      }
      break;
    }
    case 'truck': {
      shadow(43);
      path('M10 29 L71 27 L73 70 L11 74Z','#91a69e');
      path('M15 35 L67 33 L68 63 L16 67Z','#afc1ae','#7c9589',1.6);
      line('M24 38 L25 63 M33 37 L34 62 M43 36 L44 60 M53 36 L54 60','#89a195',1.8);
      path('M72 46 L88 44 Q93 44 97 52 L104 61 L109 65 L109 80 L72 84Z','#d79c73');
      path('M77 50 L88 49 L97 62 L78 63Z','#b8d1cb',ink,1.8);
      path('M11 73 L70 69 L72 83 L12 85Z','#717773'); line('M77 69 L82 69',ink,1.8);
      for(const x of [29,89]) {
        oval(x,84,9.2,9.8,'#525552',ink,2); dot(x,84,4,'#d8c7a5');
      }
      break;
    }
    case 'camera': {
      shadow(37);
      path('M18 39 L37 37 L42 28 Q44 25 49 25 L66 25 Q72 25 75 34 L94 34 Q101 34 102 41 L103 79 Q103 85 97 85 L21 89 Q15 89 15 80 L14 46 Q14 41 18 39Z','#9eabad');
      path('M16 49 L102 44 L103 72 L16 78Z','#5d7778',ink,1.8);
      path('M19 36 L32 35 L32 40 L19 41Z','#b6b5a7',ink,1.7);
      oval(61,61,23,23,'#d3c9b5',ink); oval(61,61,17,17,'#57686c',ink,1.7);
      oval(61,61,11.5,11.5,'#7c96a1',ink,1.7); dot(58,57,4,'#c5dcda');
      path('M82 37 L94 37 L94 43 L82 43Z','#f5d891','#978a72',1.2);
      break;
    }

    case 'student': {
      shadow(22);
      path('M43 52 Q28 52 28 64 L29 79 Q32 83 39 81 L48 66Z','#b67a59');
      path('M44 75 L72 75 L71 91 L74 97 Q70 101 60 98 L57 84 L54 97 Q42 101 40 96 L44 92Z','#616b77');
      path('M43 51 Q57 45 68 52 Q76 59 79 72 L74 77 L68 70 L69 80 Q57 84 39 79 L42 65 L36 71 Q30 75 29 68Z','#6f94a2');
      path('M48 52 L63 51 L58 61Z','#fbebcb','#65767b',1.4); line('M55 60 L53 73','#bd776b',3);
      oval(55,35,18,19,'#e8bc97',ink);
      path('M37 38 Q30 17 48 14 Q65 9 74 25 L72 36 L67 28 L57 28 L55 24 L49 30 L40 30Z','#604d47');
      dot(48,37,1.8,ink); dot(62,36,1.8,ink); line('M52 43 Q55 47 60 42','#a8776a',1.5);
      path('M64 61 L79 58 L83 77 L68 81Z','#e8c27b',ink,1.8);
      break;
    }
    case 'chef': {
      shadow(24);
      path('M44 76 L75 76 L74 91 L78 95 Q75 99 63 97 L59 83 L55 96 Q44 99 40 96 L44 91Z','#687775');
      path('M44 49 Q59 46 72 50 L82 66 Q84 73 77 75 L71 67 L74 83 Q57 86 40 81 L43 65 L35 72 Q28 72 31 64Z','#f5e6cc');
      path('M49 53 L57 59 L65 52 L61 49 L51 49Z','#d68f7b',ink,1.4);
      line('M59 59 L58 80 M48 73 L53 73','#b5a78b',1.7); dot(64,64,1.5,ink); dot(64,71,1.5,ink);
      oval(56,38,16,16,'#bc896e',ink);
      dot(49,38,1.8,ink); dot(61,37,1.8,ink); line('M52 44 Q56 47 61 42',ink,1.5);
      path('M40 31 L37 21 Q26 17 31 9 Q35 3 42 7 Q48 0 55 5 Q64 -1 70 7 Q80 4 82 13 Q83 20 73 23 L72 30 Q58 34 40 31Z','#fff5da');
      line('M40 24 Q53 27 73 23 M45 10 Q47 14 46 17 M65 9 L65 16','#caba9e',1.5);
      line('M78 67 L85 42',ink,3); oval(86,39,4.5,8,'#ba936b',ink,1.8);
      break;
    }
    case 'shoes': {
      shadow(40);
      path('M50 32 L70 27 Q75 29 76 40 L92 51 Q105 52 106 61 Q107 68 91 69 L54 69 Q46 68 45 62Z','#82a29c');
      path('M47 58 Q75 64 105 58 L106 64 Q101 71 86 71 L53 70 Q46 68 46 65Z','#f3e5c5',ink,1.8);
      line('M70 40 L80 37 M75 44 L85 42','#f7edd8',2.5);
      path('M17 55 L35 49 Q41 48 44 58 L61 71 Q76 70 79 80 Q80 86 70 90 Q42 95 17 88 Q12 85 13 78Z','#87aaa2');
      path('M14 79 Q38 88 78 78 L79 84 Q73 91 61 92 Q27 96 14 87Z','#fff0cc',ink,2);
      path('M19 58 Q25 61 32 56 L35 52 Q28 52 19 55Z','#547c79',null);
      line('M37 62 L47 58 M41 67 L52 63 M48 71 L58 67','#fff0cf',3);
      break;
    }
    case 'socks': {
      shadow(30);
      path('M59 20 L84 24 L77 62 L88 72 Q96 81 85 88 Q80 92 73 87 L53 73 Q49 70 52 60Z','#9cabb8');
      path('M59 20 L84 24 L82 36 L56 32Z','#d3a68e',ink,1.6);
      line('M58 28 L82 32','#ead5ab',2);
      path('M28 27 L54 31 L47 67 L53 74 Q57 81 48 85 L31 94 Q22 98 17 90 Q13 83 22 76 L25 73Z','#9bb5c3');
      path('M28 27 L54 31 L52 42 L27 38Z','#dbab8e',ink,1.6);
      line('M28 34 L52 38','#f2dcaf',2); line('M34 45 L32 62','#c9d4d2',2.3);
      path('M18 82 Q24 80 30 91 L26 94 Q18 96 16 88Z','#d5a58f','#a18678',1.2);
      break;
    }
    case 'horse': {
      shadow(39);
      path('M78 51 Q100 45 104 55 Q109 65 104 77 Q101 70 97 74 Q99 63 86 60Z','#775748');
      path('M56 70 L66 71 L62 92 L56 93Z M80 69 L87 70 L87 90 L81 91Z','#a47754',ink,1.8);
      path('M27 28 L27 16 L33 22 L39 13 L42 24 Q47 26 49 39 L54 52 Q73 45 85 50 Q98 55 92 70 L86 79 L82 96 L75 95 L77 74 L54 76 L49 94 L42 94 L44 69 Q37 65 36 51 L35 43 L23 52 Q17 54 14 47 Q12 43 20 36Z','#c79264');
      path('M41 23 Q48 23 51 31 L55 47 L59 52 L50 55 L44 39Z','#7f5a47',ink,1.6);
      path('M17 41 Q25 42 26 48 L21 51 Q16 52 14 47Z','#e4bb89',null);
      dot(31,34,2.3,ink); dot(18,44,1.5,ink);
      line('M42 94 L49 94 M75 95 L82 96 M57 92 L61 92',ink,3.5);
      break;
    }
    case 'elephant': {
      shadow(40);
      line('M28 51 Q17 54 17 71','#667b81',3.3); line('M17 70 L15 75',ink,4);
      path('M22 56 Q22 36 43 31 Q62 26 75 35 Q89 27 100 40 Q109 50 103 60 Q96 68 98 78 Q99 85 106 80 Q111 75 111 82 Q108 97 97 92 Q87 88 88 66 L82 68 L80 91 Q76 96 69 91 L68 74 L47 75 L43 93 Q36 97 32 91 L32 72 Q23 69 22 56Z','#92a9b1');
      path('M62 42 Q73 31 83 40 Q92 49 83 62 Q74 78 65 68 Q59 59 62 42Z','#a7bdbe','#6d858b',2);
      path('M90 61 Q94 70 99 67 Q96 75 89 69Z','#fff0c8','#9c9b88',1.4);
      dot(93,48,2.6,ink); dot(94,47.5,.8,shine);
      line('M99 69 L103 70 M99 74 L103 75 M35 91 L36 87 M40 92 L40 87 M73 92 L74 87','#6d858b',1.8);
      break;
    }
    case 'sparrow': {
      shadow(25);
      line('M50 77 L49 90 L43 92 M50 90 L54 92 M63 77 L64 87 L60 90 M64 87 L69 88','#87684d',2.4);
      path('M79 55 L103 45 L93 59 L104 56 L86 69 L73 71Z','#a87d5c');
      path('M25 53 Q23 34 39 29 Q56 24 67 40 Q83 45 87 58 Q87 75 65 81 Q44 85 31 71 Q24 64 25 53Z','#ba926c');
      path('M27 51 Q33 45 42 49 Q48 55 48 61 Q60 67 76 65 Q69 80 54 80 Q31 78 27 61Z','#f2d7b0',null);
      path('M49 52 Q63 42 81 55 Q77 63 58 66Z','#9a7756','#775e4f',1.6);
      line('M55 53 L73 54 M59 58 L74 57','#e1bb8d',2);
      path('M26 47 L15 51 L26 55Z','#b99358'); dot(35,43,2.6,ink); dot(41,55,3.1,'#78604d');
      break;
    }
    case 'duck': {
      shadow(35);
      path('M36 53 Q26 48 29 36 Q31 22 45 22 Q57 21 61 33 Q65 43 56 49 L55 54 Q72 50 83 57 Q92 57 101 48 Q100 63 89 74 Q84 86 61 87 Q33 88 25 74 Q22 62 36 53Z','#e7bb64');
      path('M31 41 Q24 43 16 41 Q14 47 22 52 L33 50Z','#d78b58');
      path('M47 63 Q63 56 80 61 Q76 76 58 76 Q51 73 47 63Z','#f6d384','#be985d',1.8);
      path('M29 74 Q42 79 57 79 Q71 80 86 72 Q78 85 61 85 Q37 87 29 74Z','#f5dca2',null);
      dot(39,36,2.5,ink); dot(38,35,1,shine); line('M18 46 L26 47',ink,1.3);
      break;
    }
    case 'house': {
      shadow(40);
      path('M23 52 L61 22 L94 52 L94 92 L22 92Z','#e9cb9e');
      path('M76 32 L76 18 L86 18 L86 43Z','#bd8b76');
      path('M13 54 L58 17 Q61 14 64 17 L105 52 L100 59 L61 27 L18 61Z','#c78270');
      path('M30 60 L48 60 L48 78 L30 78Z','#b5d0c8');
      line('M39 61 L39 78 M30 69 L48 69',ink,1.5);
      path('M60 90 L60 63 Q68 57 77 63 L77 91Z','#9d7761'); dot(73,77,1.8,'#efd49c');
      line('M20 93 L97 93','#8c856b',3);
      break;
    }
    case 'bakery': {
      shadow(40);
      path('M22 38 L95 38 L96 92 L21 92Z','#e8c69f');
      path('M28 23 L90 23 L94 39 L22 39Z','#9b7c63');
      path('M21 37 L95 37 L103 54 Q98 61 91 55 Q84 63 76 56 Q68 63 60 56 Q52 63 44 56 Q35 62 29 55 Q22 62 14 55Z','#db9986');
      for(const x of [24,48,72]) path('M'+x+' 38 h9 l-2 17 q-4 4 -10 0Z','#fff0cd',null);
      path('M27 61 L65 61 L65 83 L27 83Z','#a9bfaf');
      path('M70 60 L88 60 L88 91 L70 91Z','#927760'); path('M73 63 L85 63 L85 76 L73 76Z','#c3cebc',ink,1.1);
      path('M35 79 Q28 76 37 70 Q40 66 44 69 Q52 62 57 68 Q65 74 54 78Z','#dfa566','#9d7654',1.6);
      line('M41 70 L44 73 M50 68 L53 71','#f4d096',2);
      oval(60,29,15,5.5,'#efcc8c','#795f4c',1.4);
      line('M52 28 L55 31 M59 26 L62 29 M65 26 L68 28','#b18155',1.3);
      break;
    }
    case 'ferry': {
      shadow(41);
      path('M23 62 L29 45 L74 44 L87 59Z','#ebd9b6');
      path('M40 45 L45 34 L69 34 L73 45Z','#f3e5c8');
      path('M48 33 L48 24 L55 24 L57 33Z','#bd8374'); line('M48 25 L55 25','#686c69',3);
      path('M12 64 L85 60 L107 52 Q103 71 91 77 Q63 87 31 85 Q19 80 12 64Z','#829eaa');
      path('M18 70 Q64 72 101 61 L97 68 Q52 82 23 77Z','#eed8ab',null);
      for(const x of [34,44,54,64]) path('M'+x+' 50 h6 v6 h-6Z','#789ba6',ink,1.1);
      oval(82,59,5.4,5.4,'#d78e74',ink,1.1); dot(82,59,2.1,'#f0dfbd');
      line('M20 87 Q30 90 42 86 M57 89 Q69 92 85 86','#99b8b5',2);
      break;
    }
    case 'cargo': {
      shadow(43);
      path('M17 61 L18 41 L31 41 L33 60Z','#f4dfb7');
      path('M20 40 L20 32 L27 32 L27 40Z','#9a8572'); path('M19 44 L29 44 L29 49 L19 49Z','#9bbbbe',ink,1.2);
      const containers=[[34,48,'#bc8279'],[54,48,'#d9b169'],[74,48,'#839d91'],[43,34,'#83a3a5'],[63,34,'#c09372']];
      for(const [x,y,color] of containers) {
        path('M'+x+' '+y+' h19 v13 h-19Z',color,ink,1.7);
        line('M'+(x+6)+' '+(y+3)+' v7 M'+(x+12)+' '+(y+3)+' v7','rgba(78,61,52,.5)',1.1);
      }
      path('M8 63 L86 62 L109 54 Q106 74 92 81 Q69 89 29 87 Q17 82 8 63Z','#687e85');
      path('M16 75 Q63 83 102 70 L96 78 Q69 88 29 85Z','#cb8974',null);
      oval(99,65,2.5,2.5,'#f2d6af');
      line('M16 90 Q26 93 35 90 M77 90 Q86 92 97 88','#9ab9b4',2);
      break;
    }

    case 'notebook':
      shadow(33);
      path('M20 32 L77 20 L100 81 Q101 85 97 87 L39 101 L19 36 Z','#536f63');
      path('M21 31 L80 21 L99 80 L40 94Z','#f6dbac');
      path('M19 28 L78 16 Q81 15 82 19 L100 75 L39 89Z','#81ad98');
      path('M21 27 L31 25 L51 86 L40 89Z','#547e72',null);
      line('M38 28 L55 82','#bcd6b8',1.3);
      path('M42 34 L69 28 L76 45 L48 51Z','#f5e5be','#719480',1.7);
      line('M49 39 L65 35 M52 44 L63 41','#81866a',1.7);
      for(const [x,y] of [[18,34],[21,44],[24,54],[27,64],[30,74]]) {
        line('M'+(x+9)+' '+(y-2)+' Q'+(x-5)+' '+(y+1)+' '+(x+2)+' '+(y+6),ink,3.5);
      }
      line('M44 94 L94 82','#b39f85',1.4);
      break;
    case 'book':
      shadow(39);
      path('M9 43 L50 32 Q57 31 61 35 Q64 29 70 28 L101 23 L112 78 L70 92 Q65 97 59 94 L20 100Z','#ce7c69');
      path('M13 40 L45 31 Q54 29 61 35 Q64 28 74 26 L100 22 L108 74 L74 84 Q68 85 65 89 Q59 86 52 88 L21 96Z','#ead3aa');
      path('M12 37 L42 29 Q52 26 59 32 L66 85 Q57 80 49 83 L20 91 Z','#fff0cd');
      path('M59 32 Q64 25 75 23 L99 20 L107 71 L81 79 Q72 80 66 85Z','#fff6dc');
      line('M24 47 Q41 40 49 42 M26 56 Q42 49 51 51 M28 65 Q43 59 52 60 M72 39 L92 33 M74 48 L95 42 M75 58 L96 51','#bba885',2);
      path('M77 25 L85 23 L89 45 L84 42 L80 48Z','#e39a78','#a36f58',1.2);
      break;
    case 'pencil':
      shadow(31);
      c.save(); c.translate(58,58); c.rotate(-.79);
      path('M-47 0 L-27 -10 L38 -10 Q45 -10 46 -4 L46 4 Q46 10 38 10 L-27 10Z','#e6af53');
      path('M-27 -9 L25 -9 L25 -3 L-27 -3Z','#ffdb79',null);
      path('M-28 3 L26 3 L26 9 L-27 9Z','#cc8a3d',null);
      path('M-47 0 L-27 -10 L-29 -3 L-25 0 L-29 4 L-27 10Z','#eed1a2',ink,1.8);
      path('M-47 0 L-39 -4 L-38 4Z',ink,null);
      path('M27 -9 L38 -9 Q45 -9 45 -4 L45 4 Q45 9 38 9 L27 9Z','#df9587',null);
      path('M21 -11 L29 -11 L29 11 L21 11Z','#a7bdb0',ink,1.8);
      line('M24 -8 L24 7',shine,1.5);
      c.restore();
      break;
    case 'umbrella':
      shadow(31);
      line('M64 24 L59 83 Q58 96 49 96 Q41 96 42 86','#55483e',6.4);
      line('M59 79 Q59 94 50 94 Q45 94 45 89','#c68853',3.4);
      path('M10 59 Q20 28 58 20 Q89 15 109 51 Q96 45 84 58 Q68 50 55 63 Q38 55 26 66 Q19 57 10 59Z','#dc8b7b');
      path('M26 66 Q32 35 58 20 Q51 36 55 63 Q38 55 26 66Z','#f0ab91','#a77765',1.4);
      path('M58 20 Q83 28 84 58 Q96 45 109 51 Q90 18 58 20Z','#b96562','#99695d',1.5);
      line('M56 20 L58 15 M81 36 Q85 42 86 48',ink,2);
      line('M19 51 Q29 34 40 29','#f7c2a1',2.4);
      break;
    case 'paper':
      shadow(31);
      path('M19 32 L77 18 L99 79 L82 94 L40 102Z','#e7d4b2');
      path('M17 27 L76 14 L97 75 L78 90 L39 97Z','#fff5d5');
      line('M30 38 L76 28 M33 47 L80 36 M36 57 L82 45 M39 67 L86 54 M42 78 L77 70','#adbfad',2);
      line('M32 26 L52 91','#daa39a',1.6);
      path('M78 90 Q82 80 79 74 Q89 79 97 75Z','#dbc8a3','#9f9078',1.6);
      break;
    case 'ticket':
      shadow(35);c.save();c.translate(60,60);c.rotate(-.27);
      path('M-44 -21 L44 -21 L44 -9 C34 -9 34 8 44 8 L44 22 L-44 22 L-44 9 C-34 9 -34 -8 -44 -8Z','#e9ab77');
      line('M-33 -16 L30 -16 M-33 16 L30 16','#fce1ac',2);
      for(const y of [-14,-7,0,7,14])line('M19 '+y+' l0 3','#956c56',1.8);
      star(-11,0,'#926652');star(2,-5,'#c38560');
      line('M25 -6 L32 -6 M25 -2 L30 -2 M25 3 L32 3','#a77759',2);c.restore();
      break;
    case 'cup':
      shadow(34);
      path('M78 43 Q102 36 102 55 Q100 73 79 76 L75 67 Q93 65 93 55 Q93 48 80 53Z','#dc926b');
      path('M19 38 Q47 33 82 34 L80 69 Q77 88 58 91 Q39 94 30 81 Q23 70 19 38Z','#e7a27b');
      path('M23 44 Q49 49 78 39 L77 47 Q50 55 24 50Z','#f3bd90',null);
      oval(50.8,36,31.5,8.4,'#ffdfae',ink,2.4);oval(51,37,25.5,4.8,'#956346');
      line('M32 52 Q33 72 40 79','#ffd0a0',3.8);
      path('M57 65 C53 57 44 62 48 68 L57 74 L63 65 C66 57 59 57 57 65Z','#f5d6a1',null);
      break;
    case 'glass':
      shadow(27);
      path('M31 23 Q59 16 88 23 L80 86 Q79 95 62 97 Q44 98 40 88Z','#d9e9d9');
      path('M37 51 Q59 57 82 49 L77 84 Q75 90 61 90 Q49 91 44 85Z','#88b7af',null);
      oval(59.5,51,22.5,4.7,'#b2d7bd','#7da59d',1.5);
      oval(59.5,23,28.5,6,'#c9ddcd',ink,2.2);
      line('M39 34 L43 59 M45 67 L46 75',shine,2.8);
      line('M48 91 Q63 96 75 89','#9eafa1',2);
      break;
    case 'cat':
      shadow(28);
      path('M68 90 Q88 94 94 79 Q97 73 91 70 Q89 69 87 76 Q84 83 75 81 Q64 77 63 84Z','#dba173');
      path('M40 80 Q35 63 47 54 Q61 44 73 59 Q82 71 81 85 Q80 93 74 94 L46 95 Q36 94 36 89 Q36 84 40 80Z','#e7ac79');
      path('M46 76 Q47 62 60 63 Q74 65 71 84 Q68 91 60 93 Q50 92 46 76Z','#ffe1ad',null);
      path('M28 47 Q28 38 35 33 L33 18 Q32 14 36 16 L50 24 Q57 21 64 23 L77 13 Q81 12 81 18 L80 34 Q87 42 83 52 Q79 65 59 68 Q38 71 29 57 Q26 53 28 47Z','#e9b481');
      path('M37 21 L46 26 L37 31Z M76 20 L76 30 L69 25Z','#d68c7e',null);
      path('M48 24 L53 23 L56 32 Q54 35 52 32Z M57 23 L62 23 L63 30 Q62 33 60 31Z','#ba855f',null);
      oval(43,45,2.5,3.4,ink);oval(68,42,2.5,3.4,ink);
      path('M51 48 Q56 45 60 47 Q58 54 55 53Z','#a5685d',null);
      line('M56 52 Q54 58 51 55 M56 52 Q59 56 62 52 M27 50 L39 51 M27 55 L39 54 M73 48 L86 44 M73 51 L87 50',ink,1.3);
      line('M44 86 Q42 94 47 94 M69 83 Q66 93 71 94','#a77552',2);
      break;
    case 'fish':
      shadow(36);
      path('M47 39 Q49 25 67 24 Q70 28 65 41Z','#df9c77');
      path('M51 74 Q56 88 70 89 L66 74Z','#e5ac80');
      path('M73 57 Q89 41 99 40 Q102 40 101 44 L97 56 L104 69 Q106 72 101 72 Q91 73 74 66Z','#df987b');
      path('M12 59 Q25 34 51 35 Q69 33 85 57 Q70 78 47 81 Q24 81 12 62 Q10 61 12 59Z','#8daf9d');
      path('M15 65 Q45 77 77 62 Q64 77 46 79 Q26 78 15 65Z','#c7d5ae',null);
      line('M38 40 Q49 56 39 71','#657f72',2);
      path('M50 56 Q57 54 65 57 Q62 66 57 67Z','#e4aa80','#8b8970',1.7);
      dot(28,54,4.2,ink);dot(27,52.5,1.3,shine);
      line('M15 64 L20 65 M84 58 L95 49 M87 61 L97 66','#886c5b',1.5);
      break;
    case 'car':
      shadow(40);
      path('M9 72 Q9 60 17 57 L32 53 L42 34 Q45 29 53 29 L72 28 Q79 27 84 34 L95 52 Q107 56 109 69 L108 78 Q107 81 100 82 L18 85 Q9 85 9 78Z','#ce7f70');
      path('M36 52 L45 36 Q47 33 52 33 L59 33 L60 51Z','#b7d1c4');
      path('M65 33 L71 33 Q77 33 80 38 L87 50 L66 51Z','#b7d1c4');
      line('M22 59 L35 56 M70 58 L76 58','#f0b499',2.3);
      path('M11 67 L20 66 L21 71 L11 73Z','#f4d296','#9a705d',1.4);
      path('M101 60 L106 63 L107 69 L100 68Z','#fff2bb','#a7795b',1.4);
      for(const [x,y] of [[32,81],[87,78]]){
        oval(x,y,10,11,'#525150',ink,2);oval(x,y,4.5,5,'#e2d5b6');
      }
      break;
    case 'bicycle':
      shadow(42);
      for(const [x,y] of [[27,78],[92,73]]){
        oval(x,y,17,18,'#d6dccc',ink,3.5);oval(x,y,13.8,14.5,'#faf1d7','#b6b9a6',1.5);
        for(const [dx,dy] of [[11,6],[-5,12],[-12,-5],[4,-12]]){
          line('M'+x+' '+y+' l'+dx+' '+dy,'#b7b8a7',1);
        }
      }
      const cycleFrame='M28 77 L45 49 L60 75 L28 77 L79 46 L60 75 M78 37 L93 73';
      line(cycleFrame,ink,6);line(cycleFrame,'#82a79a',3.8);
      line('M44 49 L40 40 M78 40 L75 30 L86 27',ink,4);
      line('M33 40 L47 39',ink,5);line('M84 27 L90 27','#ad8062',4);
      oval(60,74,5,5,'#cfab7b',ink,2);line('M60 74 L67 81 L72 80',ink,2.2);
      break;
  }
  return canvas;
}

const numberKeys = ['A', 'S', 'D'];
const suffixKeys = ['J', 'K', 'L'];
const counterKeys = [...'1234567890QWERTYUI'];
const speeds = {easy:8400, slow:8400, normal:5700, fast:3500};
const numerals = {1:'一',2:'二',3:'三',4:'四',5:'五',6:'六',7:'七',8:'八',9:'九',10:'十',100:'百',1000:'千'};

function shuffled(list, random) {
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i],result[j]] = [result[j],result[i]];
  }
  return result;
}

function create({settings, onAnswer = () => {}, onFinish = () => {}, env = globalThis, random = Math.random}) {
  const data = globalThis.RinoCounterData;
  const entries = data.catalog.filter(entry => settings.counters.includes(entry.glyph)).map(entry => ({
    ...entry, goods:entry.goods.filter(good => !settings.objects || settings.objects.includes(good.kind))
  })).filter(entry => entry.goods.length);
  if (!entries.length) throw Error('Seleziona almeno un esempio per iniziare.');
  const numbers = data.numbers.filter(n => settings.largeNumbers || n <= 10);
  const level = settings.level === 2 ? 2 : 1;
  const belt = settings.layout === 'belt';
  const duration = (speeds[settings.speed] || speeds.normal) * (level === 2 ? 1.45 : 1);
  const planned = Math.max(1, Math.min(100, Math.round(Number(settings.length) || 12)));
  const answers = [], jobs = [], objectBags = new Map(), illustrated = new Map();
  const mix = list => shuffled(list,random);
  let families = [], quantities = [], lastFamily = '', streak = 0, bestStreak = 0;
  let index = 0, fraction = 0, carry = 0, hold = 0, paused = false, modal = '', ended = false;
  let root = null, doc = null, nodes = new Map(), observer = null, frame = null, lastTime = null;
  let geom = null, modalTrigger = null, sceneTime = 0;
  const target = () => jobs[index];
  const find = name => root?.querySelector('[data-rush-' + name + ']');
  const reduced = () => !!env.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const count = (entry,n) => entry.counts.find(item => item.n === n);

  function nextObject(entry, previous) {
    let bag = objectBags.get(entry.glyph);
    if (!bag?.length) {
      bag = mix(entry.goods);
      objectBags.set(entry.glyph,bag);
    }
    if (previous && bag.at(-1)?.kind === previous && bag.length > 1) {
      [bag[0],bag[bag.length-1]] = [bag.at(-1),bag[0]];
    }
    return bag.pop();
  }
  function makeJob(entry,n,good) {
    return {entry,n,good:good || nextObject(entry),parts:data.partsFor(entry,n),selected:{},pads:null};
  }
  // Keep incoming goods visible all the way to the last scored target.
  while (jobs.length < planned + 11) {
    if (!families.length) {
      families = mix(entries);
      if (families.length > 1 && families.at(-1).glyph === lastFamily) {
        [families[0],families[families.length-1]] = [families.at(-1),families[0]];
      }
    }
    if (!quantities.length) quantities = mix(numbers);
    const entry = families.pop();
    lastFamily = entry.glyph;
    jobs.push(makeJob(entry,quantities.pop()));
  }
  function report() {
    return {correct:answers.filter(a => a.status === 'correct').length,
      incorrect:answers.filter(a => a.status === 'incorrect').length,
      missed:answers.filter(a => a.status === 'missed').length, total:answers.length,
      planned,bestStreak,answers:answers.map(a => ({...a}))};
  }
  function markup() {
    return `<section class="cr-play" lang="it" tabindex="-1" data-many-answers="${level === 1 && entries.length > 12}">
      <header class="cr-top"><h1 id="game-title" tabindex="-1">Counter Rush</h1>
        <div class="cr-stats"><span><b data-rush-score>0</b> punti</span><span>Domanda <b data-rush-round></b></span></div>
        <div class="cr-tools"><button type="button" class="game-button" data-rush-action="reference">Tabella</button>
        <button type="button" class="game-button" data-rush-action="pause">Pausa</button>
        <button type="button" class="game-button" data-rush-action="end">Termina</button></div></header>
      <div class="cr-stage" data-rush-stage><div class="cr-rails" data-rush-rails aria-hidden="true"></div>
        <div class="cr-moving" data-rush-moving aria-hidden="true"></div><div class="cr-paused" data-rush-paused hidden>
        <button type="button" class="game-button game-primary" data-rush-action="pause">Riprendi</button></div></div>
      <div class="cr-time" aria-hidden="true"><i data-rush-time></i></div>
      <div class="cr-prompt"><strong data-rush-prompt aria-live="polite"></strong><span data-rush-status aria-live="polite"></span></div>
      <div data-rush-controls></div>
      <dialog class="cr-dialog" data-rush-dialog aria-label="Counter Rush"><div data-rush-dialog-body></div></dialog>
    </section>`;
  }
  function choices(job) {
    if (job.pads) return job.pads;
    const nums = [], suffixes = [];
    const add = (list,value,glyph,n) => {
      if (list.length < 3 && !list.some(option => option.value === value && option.glyph === glyph)) list.push({value,glyph,n});
    };
    const addNum = (prefix,n) => add(nums,prefix,numerals[n],n);
    const addSuffix = (suffix,entry) => add(suffixes,suffix,entry.glyph);
    const valid = job.parts[0];
    addNum(valid.prefix,job.n); addSuffix(valid.suffix,job.entry);
    const alt = mix(job.parts.slice(1))[0];
    if (alt) { addNum(alt.prefix,job.n); addSuffix(alt.suffix,job.entry); }
    const otherFamilies = mix(entries.filter(e => e !== job.entry));
    if (otherFamilies.length) addSuffix(data.partsFor(otherFamilies[0],job.n)[0].suffix,otherFamilies[0]);
    const stems = {1:['いち','いっ'],2:['に'],4:['よん'],6:['ろく','ろっ'],8:['はち','はっ'],10:['じゅう','じゅっ'],100:['ひゃく','ひゃっ']};
    for (const stem of stems[job.n] || []) {
      if (nums.length >= 2) break;
      addNum(stem,job.n);
    }
    for (const n of mix(numbers.filter(n => n !== job.n))) addNum(data.partsFor(job.entry,n)[0].prefix,n);
    for (const suffix of data.counterSoundForms[job.entry.glyph]) addSuffix(suffix,job.entry);
    for (const entry of otherFamilies) addSuffix(data.partsFor(entry,job.n)[0].suffix,entry);
    job.pads = {number:mix(nums),suffix:mix(suffixes)};
    return job.pads;
  }
  function shownChoice(job) {
    const {number,suffix,counter} = job.selected;
    if (level === 1) return counter?.glyph || '';
    if (!number && !suffix) return '';
    return (number?.glyph || '＿') + (suffix?.glyph || '＿') + '（' + (number?.value || '＿') + (suffix?.value || '＿') + '）';
  }
  function correct(job) {
    if (level === 1) return job.selected.counter?.glyph === job.entry.glyph;
    const {number,suffix} = job.selected;
    return number?.n === job.n && suffix?.glyph === job.entry.glyph &&
      job.parts.some(pair => pair.prefix === number.value && pair.suffix === suffix.value);
  }
  function insertReview(job) {
    // Revisit the same sound change after two intervening retrievals, with another noun where possible.
    const later = index + 3;
    if (later >= planned) return;
    const available = job.entry.goods.filter(good => good.kind !== job.good.kind);
    jobs[later] = makeJob(job.entry,job.n,mix(available)[0] || job.good);
  }
  function record(status) {
    const job = target();
    if (!job || job.status || ended) return;
    job.status = status;
    const form = count(job.entry,job.n);
    answers.push({glyph:job.entry.glyph,kind:job.good.kind,jp:job.good.jp,n:job.n,
      form:form.form,kana:form.kana,chosen:shownChoice(job),status});
    streak = status === 'correct' ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak,streak);
    if (status === 'correct') hold = level === 2 ? 1000 : 480;
    else { insertReview(job); modal = 'correction'; }
    if (nodes.has(job)) nodes.get(job).dataset.result = status;
    paintControls(); paintStats(); paintDialog();
    onAnswer(report());
  }
  function end() {
    if (ended) return;
    ended = true; unmount(); onFinish(report());
  }
  function next() {
    index++;
    if (index === planned) { end(); return; }
    carry = reduced() ? 0 : Math.max(-1,Math.min(0,fraction - 1));
    fraction = 0; hold = 0; sceneTime = 0; lastTime = null;
    layOut(); paintControls(); paintStats(); paintTravel();
  }
  function choose(group,i) {
    const job = target();
    if (!root || ended || !job || paused || modal || job.status || doc.hidden) return;
    if (level === 1) {
      if (group !== 'counter' || !entries[i]) return;
      job.selected.counter = entries[i];
    } else {
      if (!['number','suffix'].includes(group)) return;
      const option = choices(job)[group][i];
      if (!option) return;
      job.selected[group] = option;
      if (!job.selected.number || !job.selected.suffix) { paintControls(); return; }
    }
    record(correct(job) ? 'correct' : 'incorrect');
  }
  function focusArena() { root?.querySelector('.cr-play')?.focus({preventScroll:true}); }
  function setPaused(value) {
    if (!root || ended || modal) return;
    paused = value; lastTime = null;
    find('paused').hidden = !value;
    root.querySelector('.cr-top [data-rush-action="pause"]').textContent = value ? 'Riprendi' : 'Pausa';
    root.querySelector('.cr-play').dataset.frozen = String(value);
    paintControls();
    if (!value) focusArena();
  }
  function paintStats() {
    if (!root) return;
    find('score').textContent = String(10 * answers.filter(a => a.status === 'correct').length);
    find('round').textContent = (index + 1) + '/' + planned;
  }
  function pad(group,option,i,key,selected,disabled) {
    return `<button type="button" class="game-button cr-pad" data-rush-group="${group}" data-rush-index="${i}"
      aria-pressed="${selected === option}" ${disabled ? 'disabled' : ''}>${key ? '<kbd aria-hidden="true">'+key+'</kbd>' : ''}
      <span class="cr-pad-glyph" lang="ja">${option.glyph}</span>
      <span class="cr-pad-sound" lang="ja">${option.value || option.kana}</span></button>`;
  }
  function paintControls() {
    if (!root || !target()) return;
    const job = target(), controls = find('controls');
    const locked = paused || !!modal || !!job.status;
    const prev = doc.activeElement;
    const prevKey = controls.contains(prev) && prev.dataset.rushGroup ?
      [prev.dataset.rushGroup,prev.dataset.rushIndex] : null;
    const correctForm = count(job.entry,job.n);
    const cue = job.good.cue || job.good.jp;
    const prompt = job.good.example && job.status === 'correct' && level === 2
      ? job.good.example.replace('{count}',correctForm.form)
      : cue + (level === 2 ? ' × ' + job.n : '');
    find('prompt').textContent = prompt;
    find('prompt').lang = 'ja';
    const status = find('status');
    status.dataset.tone = job.status || '';
    if (job.status === 'correct') {
      status.textContent = '✓ ' + shownChoice(job);
    } else if (level === 2 && (job.selected.number || job.selected.suffix)) {
      status.textContent = (job.selected.number?.value || '＿') + ' ＋ ' + (job.selected.suffix?.value || '＿');
    } else {
      status.textContent = level === 2 ? 'Componi il conteggio.' : 'Scegli il contatore.';
    }
    if (level === 1) {
      controls.innerHTML = '<div class="cr-keys" role="group" aria-label="Contatori">' +
        entries.map((entry,i) => pad('counter',entry,i,counterKeys[i],job.selected.counter,locked)).join('') + '</div>';
    } else {
      const panels = choices(job);
      controls.innerHTML = '<div class="cr-compose">' + [['number','Parte numerica',numberKeys],['suffix','Suffisso del contatore',suffixKeys]]
        .map(([group,title,keys]) => `<fieldset><legend>${title}</legend><div class="cr-part-keys">` +
          panels[group].map((option,i) => pad(group,option,i,keys[i],job.selected[group],locked)).join('') + '</div></fieldset>').join('') + '</div>';
    }
    if (prevKey && !locked) controls.querySelector('[data-rush-group="' + prevKey[0] + '"][data-rush-index="' + prevKey[1] + '"]')?.focus({preventScroll:true});
  }
  function makeNode(job) {
    const node = doc.createElement('div');
    node.className = 'cr-object';
    node.dataset.kind = job.good.kind;
    node.dataset.glyph = job.entry.glyph;
    node.dataset.quantity = job.n;
    if (job.good.cue) node.dataset.sceneFrame = '0';
    const image = doc.createElement('div');
    image.className = 'cr-art';
    if (!illustrated.has(job.good.kind)) illustrated.set(job.good.kind,drawCounterObject(job.good.kind,doc));
    const source = illustrated.get(job.good.kind);
    const sprite = doc.createElement('canvas');
    sprite.width = source.width; sprite.height = source.height;
    const context = sprite.getContext('2d');
    if (context) context.drawImage(source,0,0);
    image.append(sprite);
    const name = doc.createElement('span');
    name.className = 'cr-name'; name.lang = 'ja';
    if (job.good.cue) {
      const cue = doc.createElement('span');
      cue.className = 'cr-cue'; cue.textContent = job.good.cue;
      name.append(cue);
    } else if (job.good.jp === job.good.reading) name.append(job.good.jp);
    else {
      const ruby = doc.createElement('ruby'), rt = doc.createElement('rt');
      rt.textContent = job.good.reading; ruby.append(job.good.jp,rt); name.append(ruby);
    }
    if (level === 2) {
      const qty = doc.createElement('b'); qty.textContent = '×' + job.n; name.append(qty);
    }
    node.append(image,name);
    return node;
  }
  function layOut() {
    const stage = find('stage');
    if (!stage || !stage.clientWidth || !stage.clientHeight) return;
    const {clientWidth:w,clientHeight:h} = stage, wide = w >= 585;
    const lanes = belt ? (wide ? 3 : 2) : (wide ? 4 : 3);
    const capacity = wide ? 12 : 6;
    const slotList = belt ? (lanes === 3 ? [1,0,2] : [0,1]) : (lanes === 4 ? [1,3,0,2] : [1,0,2]);
    const axis = belt ? w : h, cross = belt ? h : w;
    const padding = 10;
    const maxCard = lanes * (axis - 2 * padding) / (capacity + lanes) - 5;
    const cardW = Math.round(belt ? Math.min(196,maxCard) : Math.min(208,cross/lanes-8));
    const cardH = Math.round(belt ? Math.min(174,cross/lanes-12) : Math.min(155,maxCard));
    const span = (axis - 2 * padding - (belt ? cardW : cardH)) / capacity;
    geom = {span};
    const rails = find('rails');
    if (rails.children.length !== lanes) {
      rails.innerHTML = '<i></i>'.repeat(lanes);
      rails.style.setProperty('--cr-lanes',lanes);
    }
    stage.dataset.layout = belt ? 'belt' : 'columns';
    stage.style.setProperty('--cr-card-w',cardW + 'px');
    stage.style.setProperty('--cr-card-h',cardH + 'px');
    const active = jobs.slice(index,index + capacity);
    for (const [job,node] of nodes) if (!active.includes(job)) { node.remove(); nodes.delete(job); }
    active.forEach((job,i) => {
      let node = nodes.get(job);
      if (!node) { node = makeNode(job); nodes.set(job,node); find('moving').append(node); }
      const lane = slotList[(index+i) % lanes];
      const x = belt ? padding + (i+1)*span : (lane + .5)*cross/lanes-cardW/2;
      const y = belt ? (lane + .5)*cross/lanes-cardH/2 : padding + (capacity-i-1)*span;
      node.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      node.dataset.target = String(i === 0);
      node.dataset.lane = String(lane);
      node.dataset.result = job.status || '';
    });
    paintTravel();
  }
  function paintTravel() {
    if (!root || !geom) return;
    const offset = reduced() ? 0 : (fraction + carry) * geom.span;
    find('moving').style.transform = belt ? 'translateX(' + (-offset).toFixed(2) + 'px)' : 'translateY(' + offset.toFixed(2) + 'px)';
    find('time').style.transform = 'scaleX(' + Math.max(0,1-fraction).toFixed(4) + ')';
  }
  function paintScene(job) {
    if (!job?.good.cue) return;
    const node = nodes.get(job);
    const pose = reduced() ? 0 : Math.floor(sceneTime / 235) % 4;
    if (!node || node.dataset.sceneFrame === String(pose)) return;
    drawCounterObject(job.good.kind,doc,pose,node.querySelector('canvas'));
    node.dataset.sceneFrame = String(pose);
  }
  function renderComparison(title,entry,example,n,suffix) {
    const f = count(entry,n);
    const spelling = suffix ? data.partsFor(entry,n).find(pair => pair.suffix === suffix) : undefined;
    const reading = spelling ? spelling.prefix + spelling.suffix : f.kana;
    const form = '<ruby>'+f.form+'<rt>'+reading+'</rt></ruby>';
    const phrase = example.example ? example.example.replace('{count}',form) : example.jp + ' × ' + n + ' → ' + form;
    return `<section class="cr-rule"><h3>${title}</h3><p><strong lang="ja">${entry.glyph}（${entry.kana}）</strong> · ${entry.it}</p>
      <p>${entry.note}</p><p lang="ja">${phrase}</p></section>`;
  }
  function correctionHTML() {
    const job = target(), {entry,n,selected} = job, canonical = count(entry,n);
    const chosenEntry = level === 1 ? selected.counter : entries.find(e => e.glyph === selected.suffix?.glyph);
    const reasons = [];
    if (selected.number && selected.number.n !== n) reasons.push('La quantità richiesta è ' + n + '.');
    else if (selected.number && !job.parts.some(pair => pair.prefix === selected.number.value))
      reasons.push('Qui la parte numerica si legge ' + job.parts[0].prefix + '.');
    if (chosenEntry && chosenEntry.glyph !== entry.glyph)
      reasons.push(job.good.cue ? 'Qui si usa ' + entry.glyph + ' per ' + entry.it.toLocaleLowerCase('it') + '.' : 'Per ' + job.good.jp + ' si usa ' + entry.glyph + '.');
    if (level === 2 && chosenEntry?.glyph === entry.glyph && !correct(job) && selected.suffix && selected.number) {
      const pair = job.parts.find(p => p.prefix === selected.number.value);
      if (!job.parts.some(p => p.suffix === selected.suffix.value) || pair && pair.suffix !== selected.suffix.value)
        reasons.push('Con ' + (pair || job.parts[0]).prefix + ', il contatore si legge ' + (pair || job.parts[0]).suffix + '.');
    }
    const right = level === 1 ? entry.glyph + '（' + entry.kana + '）' : canonical.form + '（' + canonical.kana + '）';
    let comparison = renderComparison('Contatore richiesto',entry,job.good,n);
    if (chosenEntry && chosenEntry !== entry) {
      const sameSubject = data.catalog.find(family => family.glyph === chosenEntry.glyph).goods.find(good => good.jp === job.good.jp);
      comparison += renderComparison('Contatore scelto',chosenEntry,sameSubject || chosenEntry.goods[0],n,selected.suffix?.value);
    } else if (level === 2 && selected.suffix?.glyph === entry.glyph) {
      const candidate = data.numbers.find(other => other !== n && data.partsFor(entry,other).some(p =>
        p.suffix === selected.suffix.value && (!selected.number || selected.number.n === n || other === selected.number.n)));
      if (candidate) comparison += renderComparison('Un altro conteggio con ' + selected.suffix.value,entry,job.good,candidate,selected.suffix.value);
    }
    return `<h2 id="cr-popup-title" tabindex="-1">${job.status === 'missed' ? 'Tempo scaduto' : 'Rivedi la risposta'}</h2>
      <p class="cr-summary"><span lang="ja">${job.good.cue || job.good.jp}${level === 2 ? ' × '+n : ''}</span></p>
      <dl class="cr-compare"><div><dt>Hai scelto</dt><dd>${shownChoice(job) || 'Nessuna risposta'}</dd></div>
      <div><dt>Risposta corretta</dt><dd lang="ja">${right}</dd></div></dl>
      ${reasons.length ? '<p>'+reasons.join(' ')+'</p>' : ''}<div class="cr-examples">${comparison}</div>
      <div class="cr-dialog-actions"><button type="button" class="game-button game-primary" data-rush-action="dismiss">Continua</button></div>`;
  }
  function paintDialog() {
    if (!root) return;
    const dialog = find('dialog');
    root.querySelector('.cr-play').dataset.frozen = String(paused || !!modal);
    if (!modal) { if (dialog.open) dialog.close(); return; }
    const contents = find('dialog-body');
    dialog.dataset.view = modal;
    dialog.setAttribute('aria-labelledby','cr-popup-title');
    if (modal === 'reference') {
      contents.innerHTML = '<div class="cr-ref-head"><h2 id="cr-popup-title" tabindex="-1">Tabella dei contatori</h2><button type="button" class="game-button" data-rush-action="dismiss">Torna al gioco</button></div>' + globalThis.RinoCounterRushSetup.reference();
    } else contents.innerHTML = correctionHTML();
    if (!dialog.open) dialog.showModal();
    contents.querySelector('h2')?.focus({preventScroll:true});
  }
  function dismiss() {
    if (!modal) return;
    const previous = modal;
    modal = ''; lastTime = null; paintDialog();
    if (previous === 'correction') { next(); focusArena(); }
    else { paintControls(); modalTrigger?.focus({preventScroll:true}); }
    modalTrigger = null;
  }
  function click(event) {
    const button = event.target.closest('button');
    if (!button || !root?.contains(button) || button.disabled) return;
    const {rushAction:action,rushGroup:group,rushIndex:i} = button.dataset;
    if (group) choose(group,Number(i));
    else if (action === 'dismiss') dismiss();
    else if (modal) return;
    else if (action === 'pause') setPaused(!paused);
    else if (action === 'reference') {
      modal = 'reference'; modalTrigger = button; lastTime = null; paintDialog();
    } else if (action === 'end') end();
  }
  function keydown(event) {
    if (!root || !root.isConnected || ended || modal || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey ||
        event.target?.closest?.('input,select,textarea,[contenteditable="true"]')) return;
    const key = event.key.toUpperCase();
    const group = level === 1 ? 'counter' : numberKeys.includes(key) ? 'number' : 'suffix';
    const i = (level === 1 ? counterKeys : group === 'number' ? numberKeys : suffixKeys).indexOf(key);
    if (i < 0) return;
    if (!event.repeat && !paused) choose(group,i);
    event.preventDefault();
  }
  function cancelDialog(event) { event.preventDefault(); dismiss(); }
  function visibility() {
    lastTime = null;
    if (doc?.hidden && !modal) setPaused(true);
  }
  function tick(time) {
    frame = null;
    if (!root || !root.isConnected || ended) return;
    const dt = lastTime === null ? 0 : Math.min(160,Math.max(0,time-lastTime));
    lastTime = time;
    if (!doc.hidden && !paused && !modal) {
      if (hold > 0) {
        hold -= dt;
        if (hold <= 0) next();
      } else if (!target()?.status) {
        fraction = Math.min(1,fraction + dt/duration);
        carry *= Math.exp(-dt/88);
        paintTravel();
        sceneTime += dt; paintScene(target());
        if (fraction >= 1) record('missed');
      }
    }
    if (root && !ended) frame = env.requestAnimationFrame(tick);
  }
  function unmount() {
    if (!root) return;
    env.cancelAnimationFrame(frame); frame = null; lastTime = null;
    observer?.disconnect(); observer = null;
    env.removeEventListener('resize',layOut);
    doc.removeEventListener('keydown',keydown); doc.removeEventListener('visibilitychange',visibility);
    root.removeEventListener('click',click);
    const dialog = find('dialog'); dialog?.removeEventListener('cancel',cancelDialog);
    if (dialog?.open) dialog.close();
    nodes.clear(); geom = null; root = null; doc = null; modalTrigger = null;
  }
  function mount(container) {
    unmount();
    if (!container || ended) return;
    root = container; doc = root.ownerDocument;
    if (!find('stage')) root.innerHTML = markup();
    find('moving').replaceChildren();
    root.addEventListener('click',click); find('dialog').addEventListener('cancel',cancelDialog);
    doc.addEventListener('keydown',keydown); doc.addEventListener('visibilitychange',visibility);
    env.addEventListener('resize',layOut);
    if (env.ResizeObserver) { observer = new env.ResizeObserver(layOut); observer.observe(find('stage')); }
    layOut(); paintStats(); find('paused').hidden = !paused;
    root.querySelector('.cr-top [data-rush-action="pause"]').textContent = paused ? 'Riprendi' : 'Pausa';
    paintControls(); paintDialog();
    frame = env.requestAnimationFrame(tick);
  }
  return {markup,mount,unmount,report,end};
}

globalThis.RinoCounterRushGame = Object.freeze({create});
})();
