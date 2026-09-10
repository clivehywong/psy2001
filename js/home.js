export function render(el){
  const card=(src,title,href,desc,items)=>`<a class="home-card" href="${href}">
    <div class="home-tag">${src}</div>
    <h2>${title}</h2>
    <p>${desc}</p>
    <div class="home-list">${items.map(t=>`<span>${t}</span>`).join("")}</div>
  </a>`;
  el.innerHTML=
    `<p class="home-lead">Interactive self-study simulations for <b>PSY2001 Biological Psychology</b>.
       Choose a module and work through its pages at your own pace. Each page has controls to play with —
       press the buttons, drag the sliders, and watch what happens.</p>`+
    `<div class="home-grid">`+
      card("Lecture 2","The Action Potential","#/ap/1",
        "How a neuron carries a signal: the resting membrane, the spike itself, and how it travels down the axon.",
        ["P1 Wire vs. chain","P2 Resting membrane","P3 Stimulate & record","P4 All-or-none","P5 Scrub the AP","P6 Propagation","P7 Myelin & speed","P8 What makes it fire?"])+
      card("Lecture 3","Synapses","#/synapses/1",
        "How one neuron passes the signal to the next: transmission, summation, receptor speed, synaptic delay, reuptake, and gap junctions.",
        ["S1 Transmission cycle","S2 Summation","S3 Fast vs slow receptors","S4 Reflex delay","S5 Blocking reuptake","S6 Gap junctions"])+
    `</div>`+
    `<p class="home-foot">More lectures are on the way — neurons, brain anatomy &amp; research methods, the visual system,
       hearing &amp; the body senses, emotional behaviours, learning &amp; memory, cognition, and sleep.</p>`;
}
