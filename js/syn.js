// Synapse core — terminal geometry (Fig 2.10), vesicles, transporters, scene renderer.
// Ported from Simulations/synapse-style-board.html & synapse-keyframes.html (locked grammar).
import { C, G, vmInside, vmColor, ionShape, ntShape, arrow, channel } from "./mrs.js";

export const CS = { ...C,
  caChan:"#1F7A82", transporter:"#8C6D1F", gprotein:"#7E57C2",
  camp:"#A8B83E", retro:"#A0522D", astro:"#7CB07C", vesicle:"#8FA9B8", drug:"#444444" };

export function catmull(pts,n=10){
  const P=[pts[0],...pts,pts[pts.length-1]]; let out=[];
  for(let i=1;i<P.length-2;i++){
    const [p0,p1,p2,p3]=[P[i-1],P[i],P[i+1],P[i+2]];
    for(let j=0;j<n;j++){
      const t=j/n, t2=t*t, t3=t2*t;
      out.push([0,1].map(k=>
        0.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3)));
    }
  }
  out.push(pts[pts.length-1]);
  return out;
}
export function samplePath(pts,step=16){
  let d=0, out=[], prev=pts[0], next=step;
  for(let i=1;i<pts.length;i++){
    const [x0,y0]=prev,[x1,y1]=pts[i];
    const len=Math.hypot(x1-x0,y1-y0);
    while(next<=d+len){
      const f=(next-d)/len;
      out.push({p:[x0+(x1-x0)*f, y0+(y1-y0)*f], t:[(x1-x0)/len,(y1-y0)/len]});
      next+=step;
    }
    d+=len; prev=pts[i];
  }
  return out;
}
function lipidAt(hx,hy,nx,ny,i,s=0.2){
  const ph=((i*37)%7-3)*0.5*s, px=-ny, py=nx, r=7*s, t0=6*s, tm=9*s, te=14*s, tf=19*s;
  const t1=(a,b)=>`M ${hx-nx*t0+px*a*s} ${hy-ny*t0+py*a*s} C ${hx-nx*tm+px*(a*s+1.5*s+ph)} ${hy-ny*tm+py*(a*s+1.5*s+ph)}, ${hx-nx*te+px*(a*s-1.5*s-ph)} ${hy-ny*te+py*(a*s-1.5*s-ph)}, ${hx-nx*tf+px*b*s} ${hy-ny*tf+py*b*s}`;
  return `<circle cx="${hx}" cy="${hy}" r="${r}" fill="${C.head}" stroke="${C.headStroke}" stroke-width="${1.5*s+0.15}"/>`+
    `<path d="${t1(-1.4,-2.8)}" fill="none" stroke="${C.tail}" stroke-width="${2.5*s+0.15}" stroke-linecap="round"/>`+
    `<path d="${t1(1.4,2.8)}" fill="none" stroke="${C.tail}" stroke-width="${2.5*s+0.15}" stroke-linecap="round"/>`;
}
export function bilayerPath(pts,s=0.2,skip=[]){
  return samplePath(pts,13.5*s).map((pt,i)=>{
    const [x,y]=pt.p,[tx,ty]=pt.t, ox=-ty, oy=tx;
    if(skip.some(k=>Math.hypot(x-k.x,y-k.y)<k.r)) return "";
    return lipidAt(x+ox*20*s,y+oy*20*s,ox,oy,i,s)+lipidAt(x-ox*20*s,y-oy*20*s,-ox,-oy,i+3,s);
  }).join("");
}
export function pathFill(pts,close){
  return pts.map((p,i)=>(i?"L":"M")+p[0]+" "+p[1]).join(" ")+close;
}

// Fig 2.10 terminal + postsynaptic cup
export const TERM=catmull([[440,-30],[440,100],[428,124],[385,172],[350,226],[355,272],[405,296],[480,300],[555,296],[605,272],[610,226],[575,172],[532,124],[520,100],[520,-30]]);
export const POST=catmull([[60,490],[240,490],[300,468],[330,432],[350,372],[480,346],[610,372],[630,432],[660,468],[720,490],[900,490]]);
export const TERM_FUSED=(()=>{
  const arc=[];
  for(let a=175;a<=365;a+=15){ const r=a*Math.PI/180; arc.push([480+24*Math.cos(r),272+24*Math.sin(r)]); }
  return catmull([[440,-30],[440,100],[428,124],[385,172],[350,226],[355,272],[405,296],[448,299],
                  ...arc,[512,299],[555,296],[605,272],[610,226],[575,172],[532,124],[520,100],[520,-30]]);
})();

export function vesicle(x,y,nt="glu",r=20,s=0.2,fused=false,empty=false){
  const pts=[];
  if(fused){
    const gap=0.5;
    for(let a=Math.PI/2+2*Math.PI-gap;a>Math.PI/2+gap;a-=Math.PI/24)
      pts.push([x+r*Math.cos(a), y+r*Math.sin(a)]);
  }else{
    for(let a=0;a>-2*Math.PI-0.01;a-=Math.PI/24)
      pts.push([x+r*Math.cos(a), y+r*Math.sin(a)]);
  }
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(255,255,255,.45)"/>`+
    bilayerPath(pts,s)+
    (empty?"":ntShape(x-3.8,y-3.4,nt,3.8)+ntShape(x+3.8,y-4.6,nt,3.8)+ntShape(x,y+3.8,nt,3.8));
}
export function stepBadge(x,y,n,color="#2F6DB5"){
  const fs=String(n).length>1?9.5:13;
  return `<g transform="translate(${x},${y})"><circle r="11" fill="${color}"/><text y="4" text-anchor="middle" font-size="${fs}" font-weight="700" fill="#fff">${n}</text></g>`;
}
const BEAN="M 3 -36 C -12 -41, -19 -22, -17 0 C -19 22, -12 41, 3 36 C -3 24, -3 -24, 3 -36 Z";
export function transporter(x,baseY,state,nt="glu"){
  let inner=`<rect x="-26" y="-48" width="52" height="96" rx="20" fill="#F0EAD6"/>`;
  if(state==="collecting") inner+=`<rect x="-7" y="-2" width="14" height="42" rx="6" fill="${C.pore}"/>`;
  inner+=`<path d="${BEAN}" fill="${CS.transporter}" stroke="rgba(0,0,0,.18)" transform="${state==="collecting"?"translate(-7,0) rotate(12 0 -42)":""}"/>`+
         `<path d="${BEAN}" fill="${CS.transporter}" stroke="rgba(0,0,0,.18)" transform="${state==="collecting"?"translate(7,0) rotate(-12 0 -42) scale(-1 1)":"scale(-1 1)"}"/>`;
  if(state==="closed") inner+=`<line x1="0" y1="-34" x2="0" y2="34" stroke="rgba(0,0,0,.35)"/>`;
  if(state==="collecting") inner+=`<g transform="translate(0,14)">${ntShape(0,0,nt,7)}</g>`;
  if(state==="blocked") inner+=`<polygon points="0,-10 9,-5 9,5 0,10 -9,5 -9,-5" transform="translate(0,26)" fill="${CS.drug}"/>`+
         `<line x1="0" y1="-34" x2="0" y2="34" stroke="rgba(0,0,0,.35)"/>`;
  return `<g transform="translate(${x},${baseY})">${inner}</g>`;
}
export function retroParticle(x,y,s=0.55){
  return `<polygon points="8,-6 -6,0 8,6" transform="translate(${x},${y}) rotate(180) scale(${s})" fill="${CS.retro}" stroke="rgba(0,0,0,.25)"/>`;
}
export function cupShape(x,y,color,flip=false){
  return `<path d="M -9 0 L 0 9 L 9 0" transform="translate(${x},${y}) ${flip?"scale(1 -1)":""}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
}
export function metabo(x,baseY,state){
  const bent=state!=="rest";
  let inner=`<rect x="-26" y="-48" width="52" height="96" rx="20" fill="#F0EAD6"/>`+cupShape(10,-45,CS.mod)+
    `<path d="${BEAN}" fill="${CS.gprotein}" stroke="rgba(0,0,0,.18)" transform="${bent?"rotate(-8 0 36) skewX(-6)":""}"/>`+
    `<path d="${BEAN}" fill="${CS.gprotein}" stroke="rgba(0,0,0,.18)" transform="scale(-1 1) ${bent?"rotate(8 0 36) skewX(6)":"translate(0,0)"}"/>`+
    `<line x1="0" y1="-34" x2="0" y2="34" stroke="rgba(0,0,0,.35)"/>`;
  if(bent) inner+=`<g transform="translate(14,-52) rotate(180)">${ntShape(0,0,"mod",8)}</g>`;
  inner+=`<g transform="translate(-15,-50)"><circle r="7.5" fill="#fff" stroke="${CS.gprotein}" stroke-width="1.5"/>`+
    `<text y="3.5" text-anchor="middle" font-size="10" font-weight="700" fill="${CS.gprotein}">M</text></g>`;
  let extra="";
  if(state==="rest") extra=`<circle cx="14" cy="44" r="9" fill="${CS.gprotein}" stroke="rgba(0,0,0,.2)"/>`;
  if(state==="bound") extra=`<circle cx="30" cy="58" r="9" fill="${CS.gprotein}" stroke="rgba(0,0,0,.2)"/>`;
  if(state==="signaling") extra=[0,1,2,3,4,5].map(i=>`<circle cx="${-30+i*13}" cy="${58+(i%2)*10}" r="4" fill="${CS.camp}"/>`).join("")+
       `<circle cx="34" cy="60" r="9" fill="${CS.gprotein}" opacity="0.55" stroke="rgba(0,0,0,.2)"/>`;
  return `<g transform="translate(${x},${baseY})">${inner}${extra}</g>`;
}
export function miniBouton(x,y){
  const pts=catmull([[x-10,y-34],[x-10,y-16],[x-18,y-6],[x-18,y+8],[x-9,y+15],[x+9,y+15],[x+18,y+8],[x+18,y-6],[x+10,y-16],[x+10,y-34]]);
  return `<path d="${pathFill(pts," Z")}" fill="${vmInside(-70)}"/>`+bilayerPath(pts,0.2);
}
export function gliaBrackets(){
  return `<path d="M 384 148 C 326 214, 310 302, 325 390" fill="none" stroke="${CS.astro}" stroke-width="24" stroke-linecap="round"/>`+
         `<path d="M 576 148 C 634 214, 650 302, 635 390" fill="none" stroke="${CS.astro}" stroke-width="24" stroke-linecap="round"/>`;
}
export const TERM_S=samplePath(TERM,2.7), POST_S=samplePath(POST,2.7);
export function nearestSample(samples,x,y){
  let best=samples[0], bd=1e9;
  samples.forEach(pt=>{ const d=Math.hypot(pt.p[0]-x,pt.p[1]-y); if(d<bd){bd=d;best=pt;} });
  return best;
}
// place a membrane protein ON the membrane curve, aligned to local tangent; flip = mouth faces the cleft side
export function proteinOnPath(samples,x,y,draw,scale=0.14,flip=false,skipR=9){
  const pt=nearestSample(samples,x,y);
  const ang=Math.atan2(pt.t[1],pt.t[0])*180/Math.PI+(flip?180:0);
  const [px,py]=pt.p;
  return { skip:{x:px,y:py,r:skipR},
           svg:`<g transform="translate(${px},${py}) rotate(${ang}) scale(${scale})">${draw}</g>` };
}

// vesicle morph: round bulb, narrow neck, pore lips exactly AT the membrane surface
export function vesicleMorph(x,y,f,nt="glu"){
  const r=20-f*4;
  const pw=3+f*5;
  const yMem=296;
  const yy=yMem-r-2+f*2;                       // bulb bottom meets the membrane; sinks slightly as it opens
  const pts=[];
  pts.push([x+pw, yMem]);                      // right pore lip, at the membrane surface
  pts.push([x+pw+7, yMem-5]);                  // right neck
  for(let a=0.9;a>-Math.PI-0.91;a-=Math.PI/24) // over the bulb, right → left
    pts.push([x+r*Math.cos(a), yy+r*Math.sin(a)]);
  pts.push([x-pw-7, yMem-5]);                  // left neck
  pts.push([x-pw, yMem]);                      // left pore lip
  return `<path d="${pathFill(pts," Z")}" fill="rgba(255,255,255,.45)"/>`+
    bilayerPath(pts,0.2,[])+
    (f>0.45?"":ntShape(x-3.8,yy-3.4,nt,3.8)+ntShape(x+3.8,yy-4.6,nt,3.8)+ntShape(x,yy+3.8,nt,3.8));
}

// mrs channel wrapped onto a synapse coordinate point (channels live at bandY in mrs space)
export function channelAt(x,baseY,color,state,opt={},scale=1){
  return `<g transform="translate(${x},${baseY}) scale(${scale}) translate(${-x},${-G.bandY})">${channel(x,color,state,opt)}</g>`;
}

// the Fig-2.10 scene
export function synScene(opts){
  let inner=`<rect x="330" y="150" width="300" height="300" fill="${C.ecf}"/>`+
    `<path d="${pathFill(POST," L 900 600 L 60 600 Z")}" fill="${vmInside(opts.vmP??-70)}"/>`+
    `<path d="${pathFill(opts.fused?TERM_FUSED:TERM," Z")}" fill="${vmInside(opts.vmT??-70)}"/>`+
    bilayerPath(opts.fused?TERM_FUSED:TERM,0.2,opts.skipT??[])+
    bilayerPath(POST,0.2,opts.skipP??[])+
    (opts.body??"");
  return `<svg width="100%" style="aspect-ratio:1/1" viewBox="330 150 300 300" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}
