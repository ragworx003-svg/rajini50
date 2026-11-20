// Readable UI for the two editions. The existing application supplies its React runtime.
export const editions = [
  {id:'english', language:'English', lang:'en', title:'21 Powerful Management Principles', subtitle:'For Business, Leadership and Life.', publisher:'Inkscribe Publishing Pvt. Ltd.', pages:148, isbn:'978-1-971939-98-8', cover:'/books/english/cover-front.webp'},
  {id:'tamil', language:'தமிழ் · Tamil', lang:'ta', title:'வெற்றிக்கு ஒரு தனி வழி!', subtitle:'ரஜினியிடமிருந்து கற்க வேண்டிய 21 மேலாண்மை கொள்கைகள்', publisher:'மின்கவி · Min E Kavi', pages:230, isbn:'978-93-6274-038-0', cover:'/books/tamil/cover-wrap.jpg'}
];

export function createEditionUI(React, store, useBook) {
  const h=React.createElement;
  function select(id, navigate=false) {
    if(store.get().edition!==id) store.set({edition:id,ready:false,activeSpread:0});
    if(navigate) {
      const target=document.getElementById('inside');
      target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
      history.replaceState(null,'','#inside');
    }
  }
  function Cover({book,small=false}) {
    return h('div',{className:`edition-cover ${book.id}${small?' compact':''}`},
      h('img',{src:book.cover,alt:`${book.language} edition — ${book.title}`,decoding:'async',loading:small?'lazy':'eager',width:book.id==='tamil'?1600:1351,height:book.id==='tamil'?1201:2048}));
  }
  function Hero() {
    return h('section',{id:'top','data-pose':'hero',className:'edition-hero','aria-labelledby':'edition-hero-title'},
      h('div',{className:'edition-intro'},
        h('p',{className:'eyebrow'},'SM. Palaniappan · 50 years of inspiration'),
        h('h1',{id:'edition-hero-title',className:'display'},'One journey. Two languages.'),
        h('p',{className:'edition-lead'},'21 lessons for business, leadership and life, inspired by Rajinikanth. Discover the book in English or Tamil.'),
        h('p',{className:'edition-tamil-note',lang:'ta'},'உங்கள் மொழியில் படியுங்கள் — ஆங்கிலம் அல்லது தமிழ்.')),
      h('div',{className:'edition-grid'},editions.map(book=>h('article',{key:book.id,className:'edition-card','aria-labelledby':`${book.id}-title`},
        h('div',{className:'edition-cover-stage'},h(Cover,{book})),
        h('div',{className:'edition-card-copy'},
          h('p',{className:'edition-language'},book.language),
          h('h2',{id:`${book.id}-title`,className:'display',lang:book.lang},book.title),
          h('p',{className:'edition-subtitle',lang:book.lang},book.subtitle),
          h('button',{className:'edition-button',onClick:()=>select(book.id,true)},`Explore ${book.id==='tamil'?'Tamil':'English'}`,h('span',{'aria-hidden':true},' →')),
          h('p',{className:'edition-preview-note'},'3D book preview · Selected pages'))))),
      h('a',{className:'edition-more',href:'#chapters'},'Discover the 21 principles ↓'));
  }
  function Selector() {
    const active=useBook(s=>s.edition);
    const ready=useBook(s=>s.ready);
    const mode=useBook(s=>s.mode);
    return h('div',{className:'edition-selector'},
      h('p',{className:'edition-selector-label'},'Choose your preview language'),
      h('div',{className:'edition-tabs',role:'group','aria-label':'Book preview language'},editions.map(book=>h('button',{key:book.id,type:'button','aria-pressed':active===book.id,onClick:()=>select(book.id)},book.language))),
      h('p',{className:'edition-status',role:'status','aria-live':'polite'},`${active==='tamil'?'Tamil · தமிழ்':'English'} edition${mode==='3d'&&!ready?' · Loading preview…':' · Selected pages'}`));
  }
  function PreviewHeading() {
    return h('div',{className:'edition-preview-heading'},h('p',{className:'eyebrow text-star'},'Inside the books'),h('h2',{id:'inside-title',className:'display'},'Explore in your language.'),h(Selector));
  }
  function Purchase() {
    return h('section',{id:'buy',className:'edition-purchase','aria-labelledby':'editions-buy-title'},
      h('div',{className:'edition-intro'},h('p',{className:'eyebrow'},'Choose your edition'),h('h2',{id:'editions-buy-title',className:'display'},'The same inspiration. Your language.'),h('p',{className:'edition-lead'},'Explore either edition, or contact the author about ordering your copy.')),
      h('div',{className:'edition-grid'},editions.map(book=>h('article',{key:book.id,className:'edition-order-card'},
        h(Cover,{book,small:true}),
        h('div',null,h('p',{className:'edition-language'},book.language),h('h3',{className:'display',lang:book.lang},book.title),
          h('dl',{className:'edition-details'},h('div',null,h('dt',null,'Publisher'),h('dd',null,book.publisher)),h('div',null,h('dt',null,'Print length'),h('dd',null,`${book.pages} pages`)),h('div',null,h('dt',null,'ISBN'),h('dd',null,book.isbn))),
          h('a',{className:'edition-button',href:`mailto:skypalani@yahoo.com?subject=${encodeURIComponent(`Enquiry about the ${book.id==='tamil'?'Tamil':'English'} edition`)}`},`Enquire about ${book.id==='tamil'?'Tamil':'English'}`),
          h('button',{className:'edition-text-button',onClick:()=>select(book.id,true)},'Preview this edition ↑'))))));
  }
  return {Hero,Selector,PreviewHeading,Purchase};
}

export const previewSections = [
  {label:'Opening pages',title:'Meet the book and its author.',body:'A selected preview of the title, publication details and the author’s introduction.'},
  {label:'About the book',title:'The inspiration behind the principles.',body:'Discover the experiences and ideas that bring this collection of leadership lessons together.'},
  {label:'Begin the journey',title:'A path through the principles.',body:'Explore selected opening pages and the foundations of the book’s management lessons.'},
  {label:'Authenticity',title:'Find strength in your own identity.',body:'Selected pages on individuality, self-awareness and building a distinctive identity.'},
  {label:'Leadership & discipline',title:'Turn insight into everyday action.',body:'A glimpse of the practical lessons on how we work, lead and collaborate.'},
  {label:'Resilience & legacy',title:'Rise again. Leave something meaningful.',body:'Selected pages from the later chapters on resilience and purpose.'}
];
