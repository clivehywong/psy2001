import { C, ionShape, ntShape, arrow, along, channel } from "../mrs.js";
import { CS, synScene, vesicle, vesicleMorph, stepBadge, transporter, retroParticle, proteinOnPath, gliaBrackets, TERM_S, POST_S } from "../syn.js";

// Transmission cycle (Kalat Fig 2.10): step ② broken into its real sub-steps.
const STEPS=[
  ["1",  0,    "“The neuron synthesizes chemicals that serve as neurotransmitters.” — made right in the terminal and packed into vesicles; the empty one (recycled last round) is refilling now."],
  ["2a", 3,    "“Action potentials travel down the axon.” — the terminal blinks deep orange with the arriving depolarization."],
  ["2b", 4.2,  "“At the presynaptic terminal, the depolarization enables calcium to enter the cell.” — the voltage-gated Ca²⁺ channel opens first."],
  ["2c", 5.4,  "“…the depolarization enables calcium to enter the cell.” — Ca²⁺ streams in through the open channel's pore."],
  ["2d", 6.8,  "“Calcium releases neurotransmitters from the terminals.” — the closest loaded vesicle docks at the membrane, ready."],
  ["2e", 8.0,  "“Calcium releases neurotransmitters…” — the vesicle wall merges into the membrane: a round bulb on a narrow neck, the omega of exocytosis."],
  ["2f", 9.6,  "“Calcium releases neurotransmitters from the terminals and into the synaptic cleft.” — the transmitter escapes through the pore; the empty vesicle is recycled immediately."],
  ["3",  11,   "“The released molecules diffuse across the narrow cleft, attach to receptors, and alter the activity of the postsynaptic neuron.” — each transmitter lands on its own receptor; Na⁺ enters and the postsynaptic cell warms (EPSP)."],
  ["4",  12.8, "“The neurotransmitter molecules separate from their receptors.” — they drift free again in the cleft."],
  ["5",  14.4, "“The neurotransmitter molecules may be taken back into the presynaptic neuron for recycling, or they may diffuse away.” — here a transporter protein ferries them back in."],
  ["6",  17,   "“Some postsynaptic cells send reverse messages to control the further release of neurotransmitter.” — retrograde transmitters head back across the cleft."],
  ["7",  18.6, "“Negative feedback sites respond to retrograde transmitter, or to the presynaptic cell's own transmitter.” — they dock at the autoreceptor: “stop sending”. The recycled vesicle refills for the next cycle."],
];
const END=21;

function gauss(t,c,w){ return Math.exp(-Math.pow((t-c)/w,2)); }
function stepAt(t){
  if(t<3) return "1";
  if(t<4.2) return "2a";
  if(t<5.4) return "2b";
  if(t<6.8) return "2c";
  if(t<8) return "2d";
  if(t<9.6) return "2e";
  if(t<11) return "2f";
  if(t<12.8) return "3";
  if(t<14.4) return "4";
  if(t<17) return "5";
  if(t<18.6) return "6";
  return "7";
}
const s01=x=>{ const u=Math.max(0,Math.min(1,x)); return u*u*(3-2*u); };

// three transmitter molecules, continuous travelers from inside the vesicle to reuptake
const NT_IN=[[476,283],[484,281],[480,290]];
const NT_PORE=[480,297];
const NT_CLEFT=[[458,318],[470,320],[482,318]];
const NT_CUP=[[412,335],[482,337],[552,335]];
const NT_DRIFT=[[500,314],[516,310],[530,316]];
const NT_TRANS=[[545,314],[545,314],[545,314]];
const NT_UP=[[556,246],[552,240],[558,252]];
const NT_SCHED=[[8.0,NT_IN],[9.6,NT_IN],[9.9,[NT_PORE,NT_PORE,NT_PORE]],[10.8,NT_CLEFT],[11.2,NT_CLEFT],[12.0,NT_CUP],[12.8,NT_CUP],[13.9,NT_DRIFT],[15.3,NT_TRANS],[16.1,NT_UP]];
function ntPos(t,i){
  if(t<=NT_SCHED[0][0]) return NT_SCHED[0][1][i];
  for(let k=1;k<NT_SCHED.length;k++){
    if(t<=NT_SCHED[k][0]){
      const [t0,A]=NT_SCHED[k-1], [t1,B]=NT_SCHED[k];
      const a=A[i]??NT_PORE, b=B[i]??NT_PORE;
      return along([a,b],s01((t-t0)/(t1-t0)));
    }
  }
  return NT_UP[i];
}

const REC_X=[410,480,550];

function frameAt(t){
  const skipT=[];
  let body=gliaBrackets(), vmT=-70, vmP=-70;

  // --- Ca²⁺ channel, embedded & aligned in the terminal membrane, mouth to the cleft ---
  {
    const caOpen = t>=4.2&&t<10.6;
    const pr=proteinOnPath(TERM_S,410,296,`<g transform="translate(-410,-210)">${channel(410,CS.caChan,caOpen?"open":"closed",{})}</g>`,0.19,true);
    body+=pr.svg;
    if(t>=5.4&&t<8){                                       // 2c — Ca²⁺ streams in THROUGH the pore
      [[404,322],[412,320],[418,322]].forEach((h,i)=>{
        const [x,y]=along([h,[408,300],[408,278],[416,266]],(t-5.4-i*0.35)/1.1);
        body+=ionShape(x,y,"ca",2.2);
      });
    }
  }
  // --- three postsynaptic receptors — one per transmitter ---
  REC_X.forEach((rx,i)=>{
    const docked = t>=11.6&&t<13.2;
    const pr=proteinOnPath(POST_S,rx,346,`<g transform="translate(-${rx},-210)">${channel(rx,CS.gluR,docked?"open":"closed",{cup:"glu",ion:docked?"na":undefined,ionY:26})}</g>`,0.19,false);
    body+=pr.svg;
  });
  // --- reuptake transporter — permanent resident; collects during ⑤ ---
  {
    const collecting = t>=14.4&&t<17;
    const pr=proteinOnPath(TERM_S,545,296,`<g transform="translate(-545,-210)">${transporter(545,210,collecting?"collecting":"closed")}</g>`,0.24,true);
    body+=pr.svg;
    if(collecting) body+=arrow(545,322,545,310,CS.transporter);
  }
  // --- autoreceptor — permanent resident ---
  {
    const pr=proteinOnPath(TERM_S,368,296,`<g transform="translate(-368,-210)">${channel(368,CS.retro,"closed",{cup:"gaba"})}</g>`,0.19,true);
    body+=pr.svg;
  }

  // --- vesicles ---
  if(t<3){                                    // ① refilling the refill-spot vesicle
    const f=t/3;
    body+=vesicle(430,210,"glu",20,0.2,false,true);
    [[392,168],[408,180],[420,166]].forEach((h,i)=>{
      const [x,y]=along([h,[430,205]],Math.max(0,Math.min(1,(f-i*0.2)/0.8)));
      body+=ntShape(x,y,"glu",4);
    });
    body+=vesicle(520,200)+vesicle(470,252);
  } else if(t<6.8){                           // ②a–c: all parked
    body+=vesicle(430,210)+vesicle(520,200)+vesicle(470,252);
  } else if(t<7.6){                           // ②d: the closest vesicle docks (touch, never cross)
    const [vx,vy]=along([[470,252],[480,276]],(t-6.8)/0.8);
    body+=vesicle(430,210)+vesicle(520,200)+vesicle(vx,vy);
  } else if(t<9.6){                           // ②e: modest omega; NTs ride inside
    const f=Math.min(0.8,(t-8.0)/1.0);
    body+=vesicle(430,210)+vesicle(520,200)+vesicleMorph(480,276,f,"none");
    NT_IN.forEach((p,i)=>{ body+=ntShape(p[0],p[1]+f*4,"glu",4.5); });
    if(f>0.45) skipT.push({x:480,y:299,r:Math.min(11,(f-0.45)*22)});
  } else if(t<10.2){                          // ②f: release; remnant holds while NTs exit
    body+=vesicle(430,210)+vesicle(520,200)+vesicleMorph(480,276,0.8,"none");
    skipT.push({x:480,y:299,r:11});
  } else if(t<11.3){                          // recycle right after release: pinch off + swap spots
    const f=s01((t-10.2)/1.1);
    const [rx2,ry2]=along([[480,284],[430,210]],f);
    body+=vesicle(rx2,ry2,"glu",20,0.2,false,true);         // recycled empty → refill spot
    const [fx,fy]=along([[430,210],[470,252]],f);
    body+=vesicle(fx,fy);                                   // full → docking spot
    body+=vesicle(520,200);
  } else if(t<18.6){                          // settled: full parked at the docking spot, empty at refill spot
    body+=vesicle(470,252)+vesicle(520,200)+vesicle(430,210,"glu",20,0.2,false,true);
  } else {                                    // ⑦: the recycled vesicle refills for the next cycle
    const f=Math.min(1,(t-18.6)/1.6);
    body+=vesicle(470,252)+vesicle(520,200);
    body+=vesicle(430,210,"glu",20,0.2,false,f<0.9);
    if(f<1){
      [[392,168],[408,180],[420,166]].forEach((h,i)=>{      // refilling the recycled one
        const [x,y]=along([h,[430,205]],Math.max(0,Math.min(1,(f-i*0.2)/0.8)));
        body+=ntShape(x,y,"glu",4);
      });
    }
  }

  // --- the three transmitters: one continuous journey each ---
  if(t>=8){
    for(let i=0;i<3;i++){
      const [x,y]=ntPos(t,i);
      if(t<16.1) body+=ntShape(x,y,"glu",4.5);
    }
  }

  if(t>=11.6&&t<13.4){                        // ③ EPSP: Na⁺ streams in through each receptor
    REC_X.forEach((rx,i)=>{
      const [x,y]=along([[rx-2,320],[rx+2,338],[rx+2,366]],(t-11.6-i*0.2)/1.1);
      body+=ionShape(x,y,"na",3);
    });
  }
  if(t>=17){                                  // ⑥ retrograde out → ⑦ dock at the feedback site
    [[470,340],[442,344]].forEach((h,i)=>{
      let pos;
      if(t<18.6) pos=along([h,[432-i*10,310]],(t-17-i*0.2)/1.2);          // out into the cleft
      else pos=along([[432-i*10,310],[368+i*4,293]],Math.min(1,(t-18.6-i*0.2)/1.0));  // → dock in the autoreceptor cup
      body+=`<g transform="rotate(-90 ${pos[0]} ${pos[1]})">${retroParticle(pos[0],pos[1])}</g>`;
    });
  }

  if(t>=3&&t<4.2) vmT=-70+100*gauss(t,3.6,0.35);   // ②a: the orange blink
  if(t>=11.6) vmP=-70+24*s01((t-11.6)/0.8)*(1-s01((t-13.4)/1.4));  // EPSP while docked — visibly orange
  body+=stepBadge(352,178,stepAt(t));
  return synScene({vmT,vmP,fused:false,skipT,skipP:[],body});
}

export function render(el){
  el.innerHTML = `<div class="card">
    <div class="stim-btns"><button id="s1-go">Play the cycle</button></div>
    <div id="s1-scene"></div>
    <div class="p5-stops" id="s1-stops"></div>
    <p class="p3-caption" id="s1-note"></p>
    <p class="p3-caption">One trip around the synapse (Kalat Fig 2.10): make it, package it, release it,
      receive it — then clean up and dial it down. Step ② is itself a chain: the AP arrives (orange blink),
      the Ca²⁺ channel opens, Ca²⁺ enters, the nearest vesicle docks, opens into an omega — and only then
      releases. Three transmitters, three receptors; the recycled vesicle and the refilled one swap places
      for the next round.</p>
  </div>`;

  const sceneEl=el.querySelector("#s1-scene"), noteEl=el.querySelector("#s1-note");
  const stopBox=el.querySelector("#s1-stops");
  let raf=null;
  function playFrom(t0,t1,hold){
    if(raf) cancelAnimationFrame(raf);
    const st0=performance.now();
    const step=now=>{
      const t=Math.min(t1, t0+(now-st0)/1000);
      draw(t,hold);
      if(t<t1) raf=requestAnimationFrame(step);
      else raf=null;
    };
    raf=requestAnimationFrame(step);
  }
  STEPS.forEach(([n,t0,txt])=>{
    const b=document.createElement("button");
    b.textContent=n;
    b.title=txt;
    b.onclick=()=>{
      const idx=STEPS.findIndex(x=>x[0]===n);
      const tEnd=idx+1<STEPS.length?STEPS[idx+1][1]:END;
      playFrom(t0,Math.min(END,tEnd-0.4),n);
    };
    stopBox.appendChild(b);
  });
  function draw(t,forceStep){
    sceneEl.innerHTML=frameAt(t);
    const st=forceStep??stepAt(t);
    stopBox.querySelectorAll("button").forEach(b=>b.classList.toggle("active",b.textContent===st));
    const rec=STEPS.find(x=>x[0]===st);
    noteEl.innerHTML=`<b>Step ${st}:</b> ${rec[2]}`;
  }
  el.querySelector("#s1-go").onclick=()=>{
    if(raf) cancelAnimationFrame(raf);
    const t0=performance.now();
    const step=now=>{
      const t=Math.min(END,(now-t0)/1000);
      draw(t);
      if(t<END) raf=requestAnimationFrame(step);
      else { raf=null; noteEl.innerHTML="Cycle complete — ready for the next action potential. Press play again."; }
    };
    raf=requestAnimationFrame(step);
  };

  const q=new URLSearchParams(location.search).get("t");
  draw(q!==null?Math.min(END,+q):0);
}
