// MRS core — membrane patch rendering, voltage palette, traces, AP/graded curves.
// Ported from Simulations/mrs-style-board.html (locked visual grammar).

export const C = {
  na:"#F28C28", k:"#7B5EA7", cl:"#4C9A6A", ca:"#2E9CA6",
  protein:"#5C6B7A", naChan:"#B8652A", kChan:"#553A80", pump:"#2F6DB5",
  head:"#F2E4A2", headStroke:"#C9B466", tail:"#C9B466",
  ecf:"#EAF3FB", icf:"#FBF7E6", pore:"#D9CDB4", trace:"#222222",
  glu:"#3FA34D", gaba:"#D64541", mod:"#C13B8E", ser:"#E0A100", da:"#C9A227",
  gluR:"#2E7D32", gabaR:"#A63636", alwaysOpen:"#8a8a8a"
};
export const G = { W:960, H:420, bandY:210, bandT:64, pitch:16, headD:14,
                   topHeadY:185, botHeadY:235, beanH:84, beanW:22, poreW:14 };

const IONS = { na:{label:"Na⁺",fg:"#222"}, k:{label:"K⁺",fg:"#fff"},
               cl:{label:"Cl⁻",fg:"#fff"}, ca:{label:"Ca²⁺",fg:"#fff"} };

// ---- voltage → color ----
const VM_STOPS=[[-90,"#8AB6E8"],[-70,"#EFE8D2"],[-55,"#F6D5A0"],[-30,"#F2B078"],[0,"#EE9258"],[30,"#DD6C42"]];
export function hexRgb(h){ return [1,3,5].map(j=>parseInt(h.substr(j,2),16)); }
export function vmRgb(vm){
  vm=Math.max(VM_STOPS[0][0],Math.min(VM_STOPS[VM_STOPS.length-1][0],vm));
  for(let i=0;i<VM_STOPS.length-1;i++){
    const [v0,h0]=VM_STOPS[i],[v1,h1]=VM_STOPS[i+1];
    if(vm<=v1){
      const c0=hexRgb(h0), c1=hexRgb(h1), t=(vm-v0)/(v1-v0);
      return c0.map((c,j)=>Math.round(c+(c1[j]-c)*t));
    }
  }
  return hexRgb(VM_STOPS[VM_STOPS.length-1][1]);
}
export function vmColor(vm){ return `rgb(${vmRgb(vm).join(",")})`; }
export function vmInside(vm){ const a=hexRgb(C.icf), b=vmRgb(vm);
  return `rgb(${a.map((c,j)=>Math.round(c+(b[j]-c)*0.55)).join(",")})`; }

// ---- membrane pieces ----
function tailPath(x,y0,y1,phase,dir){
  const xe=x+dir*2, p=phase, s=Math.sign(y1-y0);
  return `M ${x} ${y0} C ${x+3+p} ${y0+6*s}, ${x-3-p} ${y0+12*s}, ${x} ${y0+16*s} `+
         `C ${x+2} ${y0+18*s}, ${xe} ${y1-3*s}, ${xe} ${y1}`;
}
function lipid(x,row,i){
  const phase=((i*37)%7-3)*0.6, cy=row==="top"?G.topHeadY:G.botHeadY, s=row==="top"?1:-1;
  const y0=cy+s*6, y1=G.bandY-s*1;
  return `<circle cx="${x}" cy="${cy}" r="${G.headD/2}" fill="${C.head}" stroke="${C.headStroke}" stroke-width="1.5"/>`+
    `<path d="${tailPath(x-1.5,y0,y1,phase,-1)}" fill="none" stroke="${C.tail}" stroke-width="2.5" stroke-linecap="round"/>`+
    `<path d="${tailPath(x+1.5,y0,y1,-phase,1)}" fill="none" stroke="${C.tail}" stroke-width="2.5" stroke-linecap="round"/>`;
}
export function bilayerBetween(x0,x1,skip=[]){
  let out="";
  for(let x=x0+8;x<x1;x+=G.pitch){
    const i=Math.round(x/G.pitch);
    if(skip.some(s=>Math.abs(x-s.x)<s.r)) continue;
    out+=lipid(x,"top",i)+lipid(x,"bot",i+3);
  }
  return out;
}
export function fluids(x0,x1,vm=-70,yTop=0,yBot=G.H){
  return `<rect x="${x0}" y="${yTop}" width="${x1-x0}" height="${G.bandY-G.bandT/2-yTop}" fill="${C.ecf}"/>`+
         `<rect x="${x0}" y="${G.bandY-G.bandT/2}" width="${x1-x0}" height="${G.bandT}" fill="${vmColor(vm)}"/>`+
         `<rect x="${x0}" y="${G.bandY+G.bandT/2}" width="${x1-x0}" height="${yBot-(G.bandY+G.bandT/2)}" fill="${vmInside(vm)}"/>`;
}

const BEAN="M 3 -36 C -12 -41, -19 -22, -17 0 C -19 22, -12 41, 3 36 C -3 24, -3 -24, 3 -36 Z";
function beanPair(color,state,bg="#F0EAD6"){
  const sx={closed:1,open:0.5,almost:0.93,locked:1}[state];
  let s=bg?`<rect x="-19" y="-41" width="38" height="82" rx="16" fill="${bg}"/>`:"";
  s+=`<rect x="-19" y="-41" width="38" height="82" rx="18" fill="${C.pore}"/>`;
  s+=`<path d="${BEAN}" fill="${color}" stroke="rgba(0,0,0,.18)" stroke-width="1" transform="translate(-19,0) scale(${sx} 1) translate(19,0)"/>`;
  s+=`<path d="${BEAN}" fill="${color}" stroke="rgba(0,0,0,.18)" stroke-width="1" transform="translate(19,0) scale(${sx} 1) translate(-19,0) scale(-1 1)"/>`;
  if(state!=="open")
    s+=`<line x1="0" y1="-34" x2="0" y2="34" stroke="${state==="locked"?"#222":"rgba(0,0,0,.35)"}" stroke-width="${state==="locked"?2:1}"/>`;
  if(state==="locked")
    s+=`<g transform="translate(0,-2)"><path d="M -4 -1 a 4.5 4.5 0 0 1 8 0" fill="none" stroke="#333" stroke-width="2"/><rect x="-6" y="-1" width="12" height="9" rx="2" fill="#333"/></g>`;
  return s;
}
function vbadge(x,y,ch,color){
  return `<g transform="translate(${x},${y})"><circle r="7.5" fill="#fff" stroke="${color}" stroke-width="1.5"/>`+
         `<text y="3.5" text-anchor="middle" font-size="10" font-weight="700" fill="${color}">${ch}</text></g>`;
}
export function channel(x,color,state,opt={}){
  let s=`<g transform="translate(${x},${G.bandY})">${beanPair(color,state,opt.bg??"#F0EAD6")}`;
  if(opt.ion) s+=ionShape(0,opt.ionY??0,opt.ion,6);
  if(opt.badge) s+=vbadge(15,-50,opt.badge,color);
  s+=`</g>`;
  return s;
}
export function ionShape(x,y,type,r){
  const c=C[type], t=IONS[type];
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="rgba(0,0,0,.15)"/>`+
         (r>=8?`<text x="${x}" y="${y+3.2}" text-anchor="middle" font-size="${r*0.62}" font-weight="700" fill="${t.fg}">${t.label}</text>`:"");
}
export function ntShape(x,y,type,r=9){
  const pts={glu:`0,${-r} ${r*0.9},${r*0.7} ${-r*0.9},${r*0.7}`,
             gaba:`0,${r} ${r*0.9},${-r*0.7} ${-r*0.9},${-r*0.7}`,
             mod:`0,${-r} ${r*0.85},0 0,${r} ${-r*0.85},0`,
             ser:`0,${-r} ${r*0.95},${-r*0.31} ${r*0.59},${r*0.81} ${-r*0.59},${r*0.81} ${-r*0.95},${-r*0.31}`,
             da:`0,${-r} ${r*0.87},${-r*0.5} ${r*0.87},${r*0.5} 0,${r} ${-r*0.87},${r*0.5} ${-r*0.87},${-r*0.5}`}[type];
  return `<polygon points="${pts}" transform="translate(${x},${y})" fill="${C[type]}" stroke="rgba(0,0,0,.25)" stroke-width="1" stroke-linejoin="round"/>`;
}
export function arrow(x1,y1,x2,y2,color,dashed=false,w=2.5){
  const ang=Math.atan2(y2-y1,x2-x1), ah=9, aw=5;
  const bx=x2-ah*Math.cos(ang), by=y2-ah*Math.sin(ang);
  const px=Math.cos(ang+Math.PI/2)*aw, py=Math.sin(ang+Math.PI/2)*aw;
  return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${w}" ${dashed?'stroke-dasharray="2 5"':''} stroke-linecap="round"/>`+
         `<polygon points="${x2},${y2} ${bx+px},${by+py} ${bx-px},${by-py}" fill="${color}"/>`;
}
export function mvChip(x,y,val){
  return `<g transform="translate(${x},${y})"><rect width="96" height="36" rx="9" fill="#fff" stroke="#999"/>`+
         `<text x="48" y="24" text-anchor="middle" font-size="17" font-weight="700" fill="#222">${val<0?"−"+(-val).toFixed(0):"+"+val.toFixed(0)} mV</text></g>`;
}
export function tag(x,y,text,color){
  const w=text.length*6.2+14;
  return `<g transform="translate(${x},${y})"><rect x="${-w/2}" y="-10" width="${w}" height="20" rx="10" fill="rgba(255,255,255,.92)" stroke="${color}" stroke-width="1.2"/>`+
         `<text x="0" y="3.5" text-anchor="middle" font-size="11" fill="#333">${text}</text></g>`;
}

// ---- trace smoothing ----
export function smoothPath(P){
  const n=P.length;
  const sl=[], m=new Array(n);
  for(let i=0;i<n-1;i++){ const dx=P[i+1][0]-P[i][0]; sl.push(dx===0?0:(P[i+1][1]-P[i][1])/dx); }
  m[0]=sl[0]; m[n-1]=sl[n-2];
  for(let i=1;i<n-1;i++)
    m[i]=(sl[i-1]===0||sl[i]===0||Math.sign(sl[i-1])!==Math.sign(sl[i]))?0:(sl[i-1]+sl[i])/2;
  for(let i=0;i<n-1;i++){
    if(sl[i]===0){ m[i]=0; m[i+1]=0; continue; }
    const a=m[i]/sl[i], b=m[i+1]/sl[i], h=Math.hypot(a,b);
    if(h>3){ const t=3/h; m[i]=t*a*sl[i]; m[i+1]=t*b*sl[i]; }
  }
  let d=`M ${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for(let i=0;i<n-1;i++){
    const dx=P[i+1][0]-P[i][0];
    d+=` C ${(P[i][0]+dx/3).toFixed(1)},${(P[i][1]+m[i]*dx/3).toFixed(1)} ${(P[i+1][0]-dx/3).toFixed(1)},${(P[i+1][1]-m[i+1]*dx/3).toFixed(1)} ${P[i+1][0].toFixed(1)},${P[i+1][1].toFixed(1)}`;
  }
  return d;
}
export function densePath(P){ return "M "+P.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L "); }

// ---- voltage-vs-time models (ms) ----
export function apVm(t){
  if(t<=1.4) return -70;
  if(t<=1.9){ const u=(t-1.4)/0.5, f=Math.pow(u,3)/(Math.pow(u,3)+Math.pow(1-u,3));
    return -70+100*f; }
  if(t<=4.4){ const u=(t-1.9)/2.5, e0=Math.exp(-6);
    return -85+115*(Math.exp(-6*u)-e0)/(1-e0); }
  if(t<=6){ const u=(t-4.4)/1.6; return -85+15*u*u*(3-2*u); }
  return -70;
}
export function gradedVm(d){
  const erf=z=>{ const sg=z<0?-1:1, az=Math.abs(z), t=1/(1+0.3275911*az);
    return sg*(1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-az*az)); };
  const Phi=z=>0.5*(1+erf(z/Math.SQRT2));
  const mu=1.5, sig=0.07, tau=0.22;
  const shape=t=>(1/tau)*Math.exp(sig*sig/(2*tau*tau)-(t-mu)/tau)*Phi((t-mu-sig*sig/tau)/sig);
  let mx=0; for(let t=1.2;t<=6;t+=0.005) mx=Math.max(mx,shape(t));
  return t=>(t<1.2||t>6)?-70:-70+d*shape(t)/mx;
}
export function sampleVm(fn,t0=0,t1=6,step=0.04){
  const pts=[];
  for(let t=t0;t<=t1+1e-9;t+=step) pts.push([+t.toFixed(3),+fn(t).toFixed(2)]);
  return pts;
}

// ---- trace panel ----
export function traceSvg(pts,w=460,h=150,cursorT=null,ghosts=[]){
  const X=t=>14+t*(w-28)/6, Y=v=>h-16-((v+90)/130)*(h-28);
  const P=pts.map(([t,v])=>[X(t),Y(v)]);
  const d=P.length>40?densePath(P):smoothPath(P);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`+
    `<rect width="${w}" height="${h}" rx="6" fill="#141A22"/>`+
    `<line x1="${X(0)}" y1="${Y(30)}" x2="${X(6)}" y2="${Y(30)}" stroke="#7A8794" stroke-dasharray="4 3"/>`+
    `<text x="${X(6)-4}" y="${Y(30)+12}" text-anchor="end" font-size="9" fill="#7A8794">peak +30</text>`+
    `<line x1="${X(0)}" y1="${Y(-55)}" x2="${X(6)}" y2="${Y(-55)}" stroke="#E0A458" stroke-dasharray="4 3"/>`+
    `<text x="${X(6)-4}" y="${Y(-55)-4}" text-anchor="end" font-size="9" fill="#E0A458">threshold −55</text>`+
    `<line x1="${X(0)}" y1="${Y(-70)}" x2="${X(6)}" y2="${Y(-70)}" stroke="#5A6B7E" stroke-dasharray="2 3"/>`+
    `<text x="${X(6)-4}" y="${Y(-70)-4}" text-anchor="end" font-size="9" fill="#8A98A8">resting −70</text>`+
    `<text x="${X(4.35)}" y="${Y(-85)+13}" text-anchor="middle" font-size="8.5" fill="#7A8794">undershoot ≈ −85 · hyperpolarization</text>`+
    ghosts.map(g=>{
      const gd=densePath(g.map(([t,v])=>[X(t),Y(v)]));
      return `<path d="${gd}" fill="none" stroke="#3EDAD8" stroke-width="2" opacity="0.22"/>`;
    }).join("")+
    `<path d="${d}" fill="none" stroke="#3EDAD8" stroke-width="5" opacity="0.22"/>`+
    `<path d="${d}" fill="none" stroke="#3EDAD8" stroke-width="2.4"/>`+
    (cursorT==null?"":`<line x1="${X(cursorT)}" y1="8" x2="${X(cursorT)}" y2="${h-16}" stroke="#E0A458" stroke-width="1.5"/>`)+
    `</svg>`;
}

// ---- background ion fields (deterministic hash grid + drift) ----
function hashJ(a,b){ const h=Math.sin(a*127.1+b*311.7)*43758.5453; return h-Math.floor(h); }
export function ionGrid(x0,x1,y0,y1,pitch,type,time=0,r=5){
  let sc="", j=0;
  for(let y=y0+pitch/2;y<y1;y+=pitch,j++){
    let i=0;
    for(let x=x0+pitch/2;x<x1;x+=pitch,i++){
      const jx=(hashJ(i,j)-0.5)*pitch*0.7, jy=(hashJ(j+31,i+57)-0.5)*pitch*0.7;
      sc+=ionShape(x+jx,y+jy,type,r);
    }
  }
  return sc;
}
export function ionField(x0,x1,yOut0,yOut1,yIn0,yIn1,time=0,base=26,r=4){
  return ionGrid(x0,x1,yOut0,yOut1,base,"na",time,r)+
         ionGrid(x0,x1,yOut0,yOut1,base*4,"k",time,r)+
         ionGrid(x0,x1,yIn0,yIn1,base,"k",time,r)+
         ionGrid(x0,x1,yIn0,yIn1,base*4,"na",time,r);
}

// ---- Na⁺-entry / K⁺-exit rate curves (Kalat Fig 1.23) ----
export function naRate(t){ const z=(t-1.73)/0.095; return Math.exp(-z*z); }
export function kRate(t){
  if(t<1.78) return 0;
  const x=t-1.78;
  return (1-Math.exp(-x/0.3))*Math.exp(-x/1.2);
}
export function ratesSvg(active,cursorT=null,w=460,h=86){
  const X=t=>14+t*(w-28)/6, Y=v=>h-14-v*(h-24);
  const mk=(fn,col)=>{ const P=[];
    for(let t=0;t<=6;t+=0.04) P.push([X(t),Y(fn(t))]);
    return `<path d="${densePath(P)}" fill="none" stroke="${col}" stroke-width="2.2"/>`; };
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`+
    `<rect width="${w}" height="${h}" rx="6" fill="#141A22"/>`+
    (active?mk(naRate,C.na)+mk(kRate,C.k):
      `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(6)}" y2="${Y(0)}" stroke="${C.na}" stroke-width="2.2"/>`+
      `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(6)}" y2="${Y(0)}" stroke="${C.k}" stroke-width="2.2"/>`)+
    `<text x="${X(1.72)+10}" y="16" font-size="9.5" fill="${C.na}">Na⁺ in</text>`+
    `<text x="${X(2.5)+10}" y="34" font-size="9.5" fill="${C.k}">K⁺ out</text>`+
    (cursorT==null?"":`<line x1="${X(cursorT)}" y1="6" x2="${X(cursorT)}" y2="${h-14}" stroke="#E0A458" stroke-width="1.5"/>`)+
    `</svg>`;
}

// +/− lining the membrane: inside negative vs outside at rest; flips past 0 mV
function chargeLining(x0,x1,vm){
  if(Math.abs(vm)<6) return "";
  const flip=vm>0, op=Math.min(1,Math.abs(vm)/70).toFixed(2);
  const inG=flip?"+":"−", outG=flip?"−":"+";
  let s="";
  for(let x=x0+16;x<x1;x+=26){
    s+=`<text x="${x}" y="${G.bandY-40}" font-size="13" font-weight="700" fill="rgba(60,60,60,${0.75*op})" text-anchor="middle">${outG}</text>`;
    s+=`<text x="${x}" y="${G.bandY+50}" font-size="13" font-weight="700" fill="rgba(60,60,60,${0.75*op})" text-anchor="middle">${inG}</text>`;
  }
  return s;
}

// ---- membrane patch scene (Zoom A, Page 2–5 view) ----
export function patchSvg(vm,naSt,kSt,extras="",time=0){
  const inner=fluids(300,660,vm,100,340)+
    `<text x="308" y="112" font-size="11" fill="#446">Outside of cell</text>`+
    `<text x="308" y="334" font-size="11" fill="#653">Inside of cell</text>`+
    ionField(300,660,104,168,248,334,time)+
    chargeLining(300,660,vm)+
    bilayerBetween(300,660,[])+
    channel(410,C.naChan,naSt,{badge:"V",bg:vmColor(vm)})+
    channel(520,C.kChan,kSt,{badge:"V",bg:vmColor(vm)})+
    extras+
    mvChip(556,192,vm);
  return `<svg width="400" height="278" viewBox="300 96 360 250" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ---- AP channel timing + traveling ions (Kalat Fig 1.23) ----
export function apChannels(t){
  if(t<1.4)  return ["closed","almost"];
  if(t<1.58) return ["almost","almost"];   // threshold
  if(t<1.75) return ["open","almost"];     // Na⁺ in (K⁺ not yet)
  if(t<1.9)  return ["open","open"];       // both open briefly
  if(t<2.1)  return ["locked","open"];     // peak — Na⁺ snaps shut first
  if(t<3.3)  return ["locked","open"];     // K⁺ streaming out
  if(t<4.4)  return ["closed","open"];     // Na⁺ resets; K⁺ still open
  return ["closed","almost"];              // K⁺ closes last — undershoot → rest
}
export function along(path,f){
  f=Math.max(0,Math.min(1,f)); const e=f*f*(3-2*f);
  const seg=(path.length-1)*e, i=Math.min(path.length-2,Math.floor(seg)), u=seg-i;
  const a=path[i], b=path[i+1];
  return [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u];
}
const NA_PATHS=[
  [[350,130],[395,160],[408,200],[410,245],[400,305]],
  [[468,126],[425,160],[412,200],[414,250],[448,298]],
];
const K_PATHS=[
  [[530,300],[522,240],[520,205],[520,165],[548,132]],
  [[498,308],[515,240],[519,205],[521,165],[498,128]],
];
export function apExtras(t){
  let s="";
  NA_PATHS.forEach((path,i)=>{
    const t0=1.6+i*0.1, t1=1.85+i*0.04;    // enter during the rising phase, done before the lock
    const [x,y]=along(path,(t-t0)/(t1-t0));
    s+=ionShape(x,y,"na",6.5);
  });
  K_PATHS.forEach((path,i)=>{
    const t0=1.95+i*0.3, t1=2.55+i*0.3;    // leave once K⁺ channels open
    const [x,y]=along(path,(t-t0)/(t1-t0));
    s+=ionShape(x,y,"k",6.5);
  });
  return s;
}

// ---- Na⁺/K⁺ pump (alternating access) + resting scene ----
const PUMP_BEAN_L="M 3 -42 C -14 -46, -24 -24, -22 0 C -24 24, -14 46, 3 42 L 3 31 A 7 7 0 0 1 3 17 L 3 7 A 7 7 0 0 1 3 -7 L 3 -17 A 7 7 0 0 1 3 -31 Z";
const PUMP_BEAN_R="M 3 -42 C -14 -46, -24 -24, -22 0 C -24 24, -14 46, 3 42 L 3 20 A 7 7 0 0 1 3 6 L 3 -6 A 7 7 0 0 1 3 -20 Z";
export function pump(x,state="closed",seated="both",bg="#F0EAD6"){
  const t={closed:{b:0,a:0,p:42},openUp:{b:7,a:12,p:42},openDown:{b:7,a:-12,p:-46}}[state];
  const ionsL=((seated==="na"||seated==="both")?[-24,0,24].map(sy=>ionShape(0,sy,"na",6.5)).join(""):"");
  const ionsR=((seated==="k"||seated==="both")?[-13,13].map(sy=>ionShape(0,sy,"k",6.5)).join(""):"");
  const beanL=`<g transform="translate(${-t.b},0) rotate(${-t.a} 0 ${t.p})"><path d="${PUMP_BEAN_L}" fill="${C.pump}" stroke="rgba(0,0,0,.18)" stroke-width="1"/>${ionsL}</g>`;
  const beanR=`<g transform="translate(${t.b},0) rotate(${t.a} 0 ${t.p}) scale(-1 1)"><path d="${PUMP_BEAN_R}" fill="${C.pump}" stroke="rgba(0,0,0,.18)" stroke-width="1"/>${ionsR}</g>`;
  let g=`<g transform="translate(${x},${G.bandY})"><rect x="-28" y="-50" width="56" height="100" rx="22" fill="${bg}"/>`;
  if(state==="openUp") g+=`<rect x="-7" y="-40" width="14" height="42" rx="6" fill="${C.pore}"/>`;
  if(state==="openDown") g+=`<rect x="-7" y="-2" width="14" height="42" rx="6" fill="${C.pore}"/>`;
  g+=beanL+beanR;
  if(state==="closed") g+=`<line x1="0" y1="-40" x2="0" y2="40" stroke="rgba(0,0,0,.35)" stroke-width="1"/>`;
  g+=`</g>`;
  return g;
}
export function proteinBlob(x,y,s,v=0){
  const d=[ "M -12 -4 Q -10 -14 0 -12 Q 12 -14 13 -2 Q 15 8 4 11 Q -8 14 -12 4 Z",
            "M -10 -8 Q 0 -16 10 -9 Q 16 0 10 8 Q 0 15 -11 7 Q -15 -1 -10 -8 Z",
            "M -13 0 Q -8 -12 2 -10 Q 14 -8 12 3 Q 9 13 -3 11 Q -14 9 -13 0 Z"][v%3];
  return `<g transform="translate(${x},${y}) scale(${s/14})"><path d="${d}" fill="${C.protein}" opacity="0.9"/>`+
         `<text y="4" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">−</text></g>`;
}

const EXTRA_NA=[[390,300],[470,285],[430,320],[380,290],[505,308],[360,268]];
// pump ion choreography, ph = cycle position 0..5 (frames of the 5-frame cycle)
const NA_HOME=[[430,300],[455,315],[415,285]], NA_SEAT=[[468,185],[463,209],[458,232]], NA_OUT=[[520,118],[536,133],[510,108]];
const K_HOME=[[540,115],[555,130]], K_SEAT=[[498,198],[493,224]], K_IN=[[500,295],[515,308]];
function pumpExtras(ph){
  let s="";
  NA_HOME.forEach((h,i)=>{
    const q=Math.max(0,Math.min(4.999,ph));
    if(q>=1&&q<2) return;                                   // seated: the pump draws its own
    let pos;
    if(q<1) pos=along([h,[480,285],[474,245],NA_SEAT[i]],q);        // in through the downward mouth
    else if(q<3) pos=along([NA_SEAT[i],[478,185],[492,150],NA_OUT[i]],q-2);  // flipped — out through the upward mouth
    else pos=NA_OUT[i];
    s+=ionShape(pos[0],pos[1],"na",6.5);
  });
  K_HOME.forEach((h,i)=>{
    if(ph>=3&&ph<4) return;                                 // seated: the pump draws its own
    let pos;
    if(ph<2.2) pos=h;                                       // waiting outside
    else if(ph<3) pos=along([h,[505,150],[492,178],K_SEAT[i]],(ph-2.2)/0.8);
    else if(ph<5) pos=along([K_SEAT[i],[478,245],[492,280],K_IN[i]],ph-4);   // released inside
    else pos=K_IN[i];
    s+=ionShape(pos[0],pos[1],"k",6.5);
  });
  return s;
}
export function restSvg(vm,pumpState,extraNa=0,pumpOff=false,seated="both",ph=0){
  let ex="";
  for(let i=0;i<extraNa&&i<EXTRA_NA.length;i++) ex+=ionShape(EXTRA_NA[i][0],EXTRA_NA[i][1],"na",6);
  const inner=fluids(300,680,vm,100,340)+
    `<text x="308" y="112" font-size="11" fill="#446">Outside of cell</text>`+
    `<text x="308" y="334" font-size="11" fill="#653">Inside of cell</text>`+
    ionField(300,680,104,168,248,334,0)+
    chargeLining(300,680,vm)+
    bilayerBetween(300,680,[])+
    channel(380,C.naChan,"closed",{badge:"V",bg:vmColor(vm)})+
    pump(480,pumpState,seated,vmColor(vm))+
    channel(580,C.kChan,"almost",{badge:"V",bg:vmColor(vm)})+
    channel(650,C.alwaysOpen,"open",{bg:vmColor(vm)})+
    (pumpOff?"":pumpExtras(ph))+
    proteinBlob(360,310,14,0)+proteinBlob(430,320,15,1)+proteinBlob(620,305,14,2)+
    ex+
    mvChip(572,116,vm)+
    (pumpOff?tag(480,140,"pump OFF","#B03A2E"):"");
  return `<svg width="440" height="278" viewBox="300 96 380 250" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ---- myelin segment (Page 7) ----
export function myelinSeg(x0,x1){
  let s="";
  for(let i=0;i<6;i++)
    s+=`<rect x="${x0}" y="${G.bandY-G.bandT/2-6*(i+1)}" width="${x1-x0}" height="5" rx="2.4" fill="${i%2?"#CBB896":"#E3D8C4"}"/>`;
  return s;
}
