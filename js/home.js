export function render(el, groups){
  groups = groups || [];
  const card=g=>`<a class="home-card" href="${g.href}">
    <div class="home-tag">${g.lecture}</div>
    <h2>${g.name.replace(/^Module \d+ · /,"")}</h2>
    <p>${g.desc}</p>
    <div class="home-list">${g.items.map(it=>`<span>${it.label}</span>`).join("")}</div>
  </a>`;
  el.innerHTML=
    `<p class="home-lead">Interactive self-study simulations for <b>PSY2001 Biological Psychology</b>.
       Choose a module and work through its pages at your own pace. Each page has controls to play with —
       press the buttons, drag the sliders, and watch what happens.</p>`+
    `<div class="home-grid">${groups.map(card).join("")}</div>`+
    `<p class="home-foot">More lectures are on the way — neurons, brain anatomy &amp; research methods, the visual system,
       hearing &amp; the body senses, emotional behaviours, learning &amp; memory, cognition, and sleep.</p>`;
}
