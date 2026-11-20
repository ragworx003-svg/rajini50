// Readable UI for the two editions. The existing application supplies its React runtime.
export const editions = [
  {id:'english', language:'English', lang:'en', title:'21 Powerful Management Principles', subtitle:'For Business, Leadership and Life.', publisher:'Inkscribe Publishing Pvt. Ltd.', pages:148, isbn:'978-1-971939-98-8', cover:'/books/english/cover-front.webp'},
  {id:'tamil', language:'தமிழ் · Tamil', lang:'ta', title:'வெற்றிக்கு ஒரு தனி வழி!', subtitle:'ரஜினியிடமிருந்து கற்க வேண்டிய 21 மேலாண்மை கொள்கைகள்', publisher:'மின்கவி · Min E Kavi', pages:230, isbn:'978-93-6274-038-0', cover:'/books/tamil/cover-wrap.jpg'}
];

// Replace these ISBN search destinations with direct product pages when available.
export const purchaseLinks = {
  amazon: 'https://www.amazon.in/s?k=9781971939988',
  inkscribe: 'https://store.theinkscribe.com/search?q=9781971939988'
};

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
    const [orderOpen,setOrderOpen]=React.useState(false);
    const [currentPrice,setCurrentPrice]=React.useState(null);
    const dialogRef=React.useRef(null);
    const [orderReady,setOrderReady]=React.useState(false);
    const [saveStatus,setSaveStatus]=React.useState('idle');
    const [order,setOrder]=React.useState(null);
    async function saveOrderDetails(data) {
      setSaveStatus('saving');
      const result=window.bookOrderSubmit?await window.bookOrderSubmit(data):{status:'not_configured'};
      if(result.status==='saved') {
        data.orderReference=result.reference;
        data.unitPricePaise=result.unitPricePaise;
        data.totalPricePaise=result.totalPricePaise;
        setOrder({...data});
      }
      setSaveStatus(result.status);
    }
    async function reviewOrder(event) {
      event.preventDefault();
      const data=Object.fromEntries(new FormData(event.currentTarget));
      data.quantity=Number(data.quantity);
      setOrder(data);
      setOrderReady(true);
      await saveOrderDetails(data);
    }
    React.useEffect(()=>{
      let active=true;
      window.bookGetPrice?.().then(price=>{if(active)setCurrentPrice(price)}).catch(()=>{});
      return ()=>{active=false};
    },[]);
    React.useEffect(()=>{
      const dialog=dialogRef.current;
      if(!dialog)return;
      if(orderOpen&&!dialog.open)dialog.showModal();
      if(!orderOpen&&dialog.open)dialog.close();
    },[orderOpen]);
    function closeOrder() {
      setOrderOpen(false);
      setOrderReady(false);
      setOrder(null);
      setSaveStatus('idle');
    }
    return h('section',{id:'buy',className:'edition-purchase','aria-labelledby':'editions-buy-title'},
      h('div',{className:'edition-intro'},h('p',{className:'eyebrow'},'Choose your edition'),h('h2',{id:'editions-buy-title',className:'display'},'The same inspiration. Your language.'),h('p',{className:'edition-lead'},'Choose where to buy the English edition, or add your Tamil edition details for checkout.')),
      h('div',{className:'edition-grid'},editions.map(book=>h('article',{key:book.id,className:'edition-order-card'},
        h(Cover,{book,small:true}),
        h('div',null,h('p',{className:'edition-language'},book.language),h('h3',{className:'display',lang:book.lang},book.title),
          h('dl',{className:'edition-details'},h('div',null,h('dt',null,'Publisher'),h('dd',null,book.publisher)),h('div',null,h('dt',null,'Print length'),h('dd',null,`${book.pages} pages`)),h('div',null,h('dt',null,'ISBN'),h('dd',null,book.isbn))),
          book.id==='tamil'&&currentPrice?h('p',{className:'edition-store-price'},`Price · ${new Intl.NumberFormat('en-IN',{style:'currency',currency:currentPrice.currency||'INR'}).format(currentPrice.pricePaise/100)}`):null,
          book.id==='english'
            ? h('div',{className:'edition-buy-options','aria-label':'Buy the English edition'},
                h('a',{className:'edition-button',href:purchaseLinks.amazon,target:'_blank',rel:'noopener noreferrer'},'Buy on Amazon',h('span',{'aria-hidden':true},' ↗')),
                h('a',{className:'edition-button edition-button-secondary',href:purchaseLinks.inkscribe,target:'_blank',rel:'noopener noreferrer'},'Buy from Inkscribe',h('span',{'aria-hidden':true},' ↗')))
            : h('button',{type:'button',className:'edition-button',onClick:()=>setOrderOpen(true)},'Buy the Tamil edition',h('span',{'aria-hidden':true},' →')),
          h('button',{type:'button',className:'edition-text-button',onClick:()=>select(book.id,true)},'Preview this edition ↑')))),
      h('dialog',{ref:dialogRef,className:'tamil-order-dialog','aria-labelledby':'tamil-order-title',onClose:closeOrder,onCancel:event=>{event.preventDefault();closeOrder();}},
        h('div',{className:'tamil-order-dialog-inner'},
          h('button',{type:'button',className:'tamil-order-close','aria-label':'Close order form',onClick:closeOrder},'×'),
          !orderReady
            ? h(React.Fragment,null,
                h('p',{className:'eyebrow'},'Tamil edition · Order details'),
                h('h3',{id:'tamil-order-title',className:'display'},'Where should we send your book?'),
                h('p',{className:'tamil-order-lead'},'Add your contact and delivery details, then review them before payment.'),
                h('form',{className:'tamil-order-form',onSubmit:reviewOrder},
                  h('label',null,'Full name',h('input',{name:'name',autoComplete:'name',defaultValue:order?.name||'',required:true,maxLength:100})),
                  h('div',{className:'tamil-order-fields'},
                    h('label',null,'Email address',h('input',{name:'email',type:'email',autoComplete:'email',defaultValue:order?.email||'',required:true,maxLength:160})),
                    h('label',null,'Phone number',h('input',{name:'phone',type:'tel',autoComplete:'tel',defaultValue:order?.phone||'',required:true,inputMode:'tel',pattern:'[+0-9() .-]{8,20}',title:'Enter a valid phone number'}))),
                  h('fieldset',null,h('legend',null,'Delivery address'),
                    h('label',null,'Address line',h('input',{name:'address',autoComplete:'address-line1',defaultValue:order?.address||'',required:true,maxLength:180})),
                    h('label',null,'Apartment, landmark or area (optional)',h('input',{name:'address2',autoComplete:'address-line2',defaultValue:order?.address2||'',maxLength:180})),
                    h('div',{className:'tamil-order-fields'},
                      h('label',null,'City / town',h('input',{name:'city',autoComplete:'address-level2',defaultValue:order?.city||'',required:true,maxLength:100})),
                      h('label',null,'State',h('input',{name:'state',autoComplete:'address-level1',defaultValue:order?.state||'',required:true,maxLength:100}))),
                    h('div',{className:'tamil-order-fields'},
                      h('label',null,'PIN code',h('input',{name:'postalCode',autoComplete:'postal-code',defaultValue:order?.postalCode||'',required:true,inputMode:'numeric',pattern:'[0-9A-Za-z -]{4,12}',maxLength:12})),
                      h('label',null,'Country',h('input',{name:'country',autoComplete:'country-name',defaultValue:order?.country||'India',required:true,maxLength:80})))),
                  h('div',{className:'tamil-order-fields tamil-order-last-row'},
                    h('label',null,'Number of copies',h('input',{name:'quantity',type:'number',min:1,max:20,defaultValue:order?.quantity||1,required:true})),
                    h('label',null,'Delivery notes (optional)',h('input',{name:'notes',defaultValue:order?.notes||'',maxLength:300,placeholder:'Anything the delivery team should know?'}))),
                  h('p',{className:'tamil-order-price'},currentPrice?`Current price: ${new Intl.NumberFormat('en-IN',{style:'currency',currency:currentPrice.currency||'INR'}).format(currentPrice.pricePaise/100)} per copy`:'Tamil book price has not been set yet.'),
                  h('p',{className:'tamil-order-privacy'},window.bookOrderSubmit?.isConfigured?'Submitting this form saves your details to the shop’s private order list. Payment is not taken yet.':'Supabase is not connected yet. Your details stay in this page and are not sent or saved.'),
                  h('button',{className:'edition-button tamil-order-submit',type:'submit'},'Submit order details',h('span',{'aria-hidden':true},' →'))))
            : h(React.Fragment,null,
                h('p',{className:'eyebrow'},'Review · Tamil edition'),
                h('h3',{id:'tamil-order-title',className:'display'},'Your details are ready'),
                h('p',{className:`order-save-status ${saveStatus}`,'role':'status','aria-live':'polite'},
                  saveStatus==='saving'?'Saving your order details…':
                  saveStatus==='saved'?`Order details saved · Reference ${order.orderReference}`:
                  saveStatus==='error'?'We could not save the order details. Please try again.':
                  saveStatus==='price_not_set'?'The Tamil book price has not been set. Set it in the admin dashboard, then retry.':
                  'Supabase is not connected yet. No order has been sent or saved.'),
                h('div',{className:'tamil-order-review'},
                  h('p',null,h('strong',null,order.name),h('br'),order.email,h('br'),order.phone),
                  h('p',null,order.address,order.address2?h('br'):null,order.address2||null,h('br'),`${order.city}, ${order.state} ${order.postalCode}`,h('br'),order.country),
                  h('p',null,`${order.quantity} ${order.quantity===1?'copy':'copies'} of வெற்றிக்கு ஒரு தனி வழி!`),
                  order.totalPricePaise?h('p',null,`Total: ${new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(order.totalPricePaise/100)}`):null,
                  order.notes?h('p',null,`Delivery note: ${order.notes}`):null),
                h('div',{className:'payment-placeholder'},
                  h('p',{className:'payment-placeholder-label'},'Payment gateway · Integration point'),
                  h('p',null,'Payment is not connected yet. No payment will be taken. '+(saveStatus==='saved'?'The order is saved as pending payment.':'')),
                  h('button',{type:'button',className:'edition-button',disabled:true},'Payment setup coming soon')),
                saveStatus==='error'||saveStatus==='price_not_set'?h('button',{type:'button',className:'edition-button',onClick:()=>saveOrderDetails(order)},saveStatus==='price_not_set'?'Check price & save order':'Retry saving details'):null,
                h('button',{type:'button',className:'edition-text-button',onClick:()=>setOrderReady(false)},'← Edit delivery details'))))));
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
