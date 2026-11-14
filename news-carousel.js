/**
 * Carousel used by public articles and the editor's preview.
 * The first image remains the cover; native scrolling enables iPhone swipes.
 */
export function createNewsCarousel(sources, title='Articolo'){
 const photos=[...new Set((sources||[]).filter(url=>typeof url==='string'&&url.length>0))];
 if(!photos.length)return null;
 const outer=document.createElement('section');outer.className='news-carousel';outer.setAttribute('aria-label','Galleria fotografie: '+title);
 const viewport=document.createElement('div');viewport.className='news-carousel-track';viewport.setAttribute('aria-label','Scorri le foto a destra o a sinistra');
 const slides=photos.map((src,index)=>{
  const slide=document.createElement('div');slide.className='news-carousel-slide';
  const image=document.createElement('img');image.src=src;image.alt=title+' — foto '+(index+1)+' di '+photos.length;
  image.loading=index===0?'eager':'lazy';image.decoding='async';
  slide.append(image);viewport.append(slide);return slide;
 });
 outer.append(viewport);
 if(photos.length===1)return outer;
 let position=0;
 const controls=document.createElement('div');controls.className='news-carousel-controls';
 const prev=document.createElement('button');prev.type='button';prev.className='news-carousel-arrow';prev.setAttribute('aria-label','Foto precedente');prev.textContent='‹';
 const count=document.createElement('span');count.className='news-carousel-count';count.setAttribute('aria-live','polite');
 const next=document.createElement('button');next.type='button';next.className='news-carousel-arrow';next.setAttribute('aria-label','Foto successiva');next.textContent='›';
 const dots=document.createElement('div');dots.className='news-carousel-dots';dots.setAttribute('aria-label','Seleziona una fotografia');
 const dotButtons=photos.map((_,index)=>{
  const dot=document.createElement('button');dot.type='button';dot.className='news-carousel-dot';dot.setAttribute('aria-label','Mostra foto '+(index+1));
  dot.onclick=()=>go(index);dots.append(dot);return dot;
 });
 function showStatus(){
  count.textContent=(position+1)+' / '+photos.length;
  prev.disabled=position===0;next.disabled=position===photos.length-1;
  dotButtons.forEach((dot,index)=>{dot.setAttribute('aria-current',String(index===position));dot.classList.toggle('active',index===position)});
 }
 function go(index){
  position=Math.max(0,Math.min(photos.length-1,index));
  const mode=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  viewport.scrollTo({left:slides[position].offsetLeft-slides[0].offsetLeft,behavior:mode});
  showStatus();
 }
 prev.onclick=()=>go(position-1);next.onclick=()=>go(position+1);
 let frame=0;
 viewport.addEventListener('scroll',()=>{
  cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{
   const width=slides[0]?.getBoundingClientRect().width||viewport.clientWidth;
   if(!width)return;
   position=Math.max(0,Math.min(photos.length-1,Math.round(viewport.scrollLeft/width)));
   showStatus();
  });
 },{passive:true});
 viewport.addEventListener('keydown',event=>{
  if(event.key==='ArrowRight'){event.preventDefault();go(position+1)}
  if(event.key==='ArrowLeft'){event.preventDefault();go(position-1)}
 });
 viewport.tabIndex=0;
 controls.append(prev,count,next);outer.append(controls,dots);
 showStatus();
 return outer;
}
