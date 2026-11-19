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
 // Fullscreen photo viewer; keep page zoom available outside the gallery.
 let viewer=null;
 let activePhoto=0;
 let lastFocus=null;
 let originalOverflow='';
 function closeViewer(){
  if(!viewer)return;
  viewer.remove();viewer=null;
  document.body.style.overflow=originalOverflow;
  document.removeEventListener('keydown',onViewerKeydown);
  lastFocus?.focus?.({preventScroll:true});
 }
 function onViewerKeydown(event){
  if(event.key==='Escape'){event.preventDefault();closeViewer()}
  if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(activePhoto-1)}
  if(event.key==='ArrowRight'){event.preventDefault();showPhoto(activePhoto+1)}
 }
 function showPhoto(index){
  if(!viewer)return;
  activePhoto=(index+photos.length)%photos.length;
  viewer.querySelector('.news-lightbox-image').src=photos[activePhoto];
  viewer.querySelector('.news-lightbox-image').alt=title+' — foto '+(activePhoto+1)+' di '+photos.length;
  viewer.querySelector('.news-lightbox-count').textContent=(activePhoto+1)+' / '+photos.length;
  viewer.querySelector('.news-lightbox-prev').hidden=photos.length<2;
  viewer.querySelector('.news-lightbox-next').hidden=photos.length<2;
 }
 async function downloadPhoto(){
  const url=photos[activePhoto];
  const name='volla-united-foto-'+String(activePhoto+1).padStart(2,'0')+'.jpg';
  const link=document.createElement('a');
  try{
   const response=await fetch(url,{mode:'cors'});
   if(!response.ok)throw new Error('Download non disponibile');
   const blob=await response.blob();
   const extension=blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg';
   const objectUrl=URL.createObjectURL(blob);
   link.href=objectUrl;link.download=name.replace(/\.jpg$/,'.'+extension);
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(objectUrl),30000);
  }catch{
   // Safari may block cross-origin download; open image for Save to Photos.
   window.open(url,'_blank','noopener');
   const hint=viewer?.querySelector('.news-lightbox-hint');
   if(hint)hint.textContent='Su iPhone, tieni premuta la foto e scegli “Salva in Foto”.';
  }
 }
 function openViewer(index){
  if(viewer)return;
  lastFocus=document.activeElement;originalOverflow=document.body.style.overflow;
  viewer=document.createElement('div');viewer.className='news-lightbox';viewer.setAttribute('role','dialog');
  viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label','Visualizzatore foto');
  viewer.tabIndex=-1;
  viewer.innerHTML='<div class="news-lightbox-top"><span class="news-lightbox-count"></span><div class="news-lightbox-actions"><button type="button" class="news-lightbox-download">↓ Scarica</button><button type="button" class="news-lightbox-close" aria-label="Chiudi foto">✕</button></div></div><button type="button" class="news-lightbox-prev" aria-label="Foto precedente">‹</button><img class="news-lightbox-image" alt=""><button type="button" class="news-lightbox-next" aria-label="Foto successiva">›</button><p class="news-lightbox-hint"></p>';
  document.body.append(viewer);document.body.style.overflow='hidden';
  viewer.querySelector('.news-lightbox-close').onclick=closeViewer;
  viewer.querySelector('.news-lightbox-download').onclick=downloadPhoto;
  viewer.querySelector('.news-lightbox-prev').onclick=()=>showPhoto(activePhoto-1);
  viewer.querySelector('.news-lightbox-next').onclick=()=>showPhoto(activePhoto+1);
  viewer.addEventListener('click',e=>{if(e.target===viewer)closeViewer()});
  let touchX=0,touchY=0;
  viewer.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY},{passive:true});
  viewer.addEventListener('touchend',e=>{
   const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;
   if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)showPhoto(activePhoto+(dx<0?1:-1));
  },{passive:true});
  document.addEventListener('keydown',onViewerKeydown);
  showPhoto(index);
  viewer.querySelector('.news-lightbox-close').focus({preventScroll:true});
 }
 slides.forEach((slide,index)=>{
  const img=slide.querySelector('img');
  img.setAttribute('role','button');img.tabIndex=0;img.title='Apri foto a schermo intero';
  img.setAttribute('aria-label','Apri foto '+(index+1)+' a schermo intero');
  let startX=0,startY=0,dragged=false;
  img.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;startY=e.touches[0].clientY;dragged=false},{passive:true});
  img.addEventListener('touchmove',e=>{if(Math.abs(e.touches[0].clientX-startX)>12||Math.abs(e.touches[0].clientY-startY)>12)dragged=true},{passive:true});
  img.addEventListener('click',e=>{if(dragged){e.preventDefault();dragged=false;return}openViewer(index)});
  img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openViewer(index)}});
 });
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
