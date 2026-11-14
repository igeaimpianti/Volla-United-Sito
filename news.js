import {createNewsCarousel} from './news-carousel.js?v=1';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient('https://ceitsxrbpabphfplahve.supabase.co',"sb_publishable_NVDBiMpRUshpXEEV8viKRg_pw6bVV8b");
const root=document.getElementById('news');
const fmt=d=>new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'});
const params=new URLSearchParams(location.search);
const query=params.get('articolo')||params.get('id');
const {data,error}=await db.from('news_articles').select('id,slug,title,excerpt,content,cover_url,image_urls,published_at,created_at').eq('published',true).order('published_at',{ascending:false}).limit(100);
root.replaceChildren();
if(error){root.textContent='Impossibile caricare le notizie al momento.';}
else if(!data?.length){root.textContent='Le notizie ufficiali saranno pubblicate qui a breve.';}
else if(query){
 const item=data.find(x=>x.slug===query||x.id===query);
 if(!item){root.textContent='Articolo non disponibile.';}
 else {
  root.className='single';const date=document.createElement('div');date.className='date';date.textContent=fmt(item.published_at||item.created_at);
  const title=document.createElement('h1');title.textContent=item.title;
  const lead=document.createElement('p');lead.className='lead';lead.textContent=item.excerpt||'';
  root.append(date,title,lead);
  const carousel=createNewsCarousel([item.cover_url,...(item.image_urls||[])],item.title);
  if(carousel)root.append(carousel);
  const text=document.createElement('div');text.className='bodycopy';text.textContent=item.content;root.append(text);
  const sharing=document.createElement('section');sharing.className='news-share';sharing.setAttribute('aria-label','Condividi questo articolo');
  const shareTitle=document.createElement('h2');shareTitle.textContent='CONDIVIDI LA NOTIZIA';sharing.append(shareTitle);
  const links=document.createElement('div');links.className='news-share-actions';
  const articleUrl=new URL('/news.html?articolo='+encodeURIComponent(item.slug||item.id),location.origin).href;
  const shareText=item.title+' — Volla United Academy';
  const iconSvg=(kind)=>{
   const paths={
    whatsapp:'<path d="M20.5 11.8a8.5 8.5 0 0 1-12.3 7.6L3 21l1.7-5.1a8.5 8.5 0 1 1 15.8-4.1Z"/><path d="M8.6 8.3c-.3-.5-.6-.5-.9-.5-.4 0-.9.3-1.1.7-.4.5-.5 1.2.1 2.3 1 2 2.5 3.5 4.5 4.4 1 .5 1.8.5 2.4.1l.8-1.2c.1-.3 0-.5-.2-.6l-1.8-.8c-.2-.1-.4 0-.5.2l-.6.7c-1.2-.5-2.2-1.5-2.8-2.8l.6-.6c.2-.2.2-.4.1-.6Z"/>',
    facebook:'<path d="M14.1 21v-8.2h2.7l.4-3.2h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.2c-.3 0-1.3-.2-2.4-.2-2.7 0-4.3 1.6-4.3 4.5v2.1H8v3.2h2.7V21Z"/>',
    more:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M12 15V3m0 0L8 7m4-4 4 4"/>',
    instagram:'<defs><linearGradient id="vu-share-instagram" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#FEDA75"/><stop offset=".35" stop-color="#FA7E1E"/><stop offset=".68" stop-color="#D62976"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="url(#vu-share-instagram)" stroke="none"/>',
    tiktok:'<path d="M16.7 2h-3.2v13.1a3.1 3.1 0 1 1-2.7-3.1V8.8a6.5 6.5 0 1 0 6 6.5V8.6a8.2 8.2 0 0 0 4.7 1.5V6.9a4.8 4.8 0 0 1-4.8-4.9z"/>'
   };
   return '<svg viewBox="0 0 24 24" aria-hidden="true" '+(kind==='facebook'||kind==='tiktok'?'fill="currentColor"':kind==='instagram'?'fill="none" stroke="url(#vu-share-instagram)" stroke-width="1.9"':'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"')+'>'+paths[kind]+'</svg>';
  };
  const makeLink=(label,url,kind)=>{
   const link=document.createElement('a');link.className='news-share-link '+kind;link.href=url;
   link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Condividi su '+label);link.title=label;
   link.innerHTML=iconSvg(kind);return link;
  };
  links.append(
   makeLink('WhatsApp','https://api.whatsapp.com/send?text='+encodeURIComponent(shareText+'\n'+articleUrl),'whatsapp'),
   makeLink('Facebook','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(articleUrl),'facebook')
  );
  // Carica in anticipo la copertina così iOS può condividere un vero file
  // quando il lettore tocca Instagram/TikTok (la condivisione richiede un gesto utente).
  const photoUrl=item.cover_url||(item.image_urls||[])[0]||null;
  let preparedPhoto=null;
  let photoError=null;
  const photoReady=photoUrl?fetch(photoUrl,{mode:'cors'}).then(async response=>{
   if(!response.ok)throw Error('Immagine non disponibile');
   const blob=await response.blob();
   if(!blob.type.startsWith('image/'))throw Error('Il file non è una fotografia');
   // Instagram è più interoperabile con JPEG e PNG; converte WEBP ove possibile.
   let finalBlob=blob;
   if(!['image/jpeg','image/png'].includes(blob.type)){
    const bitmap=await createImageBitmap(blob);
    try{
     const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
     const ctx=canvas.getContext('2d');if(!ctx)throw Error('Conversione non disponibile');
     ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0);
     finalBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));
     if(!finalBlob)throw Error('Conversione non disponibile');
    }finally{bitmap.close()}
   }
   const extension=finalBlob.type==='image/png'?'png':'jpg';
   preparedPhoto=new File([finalBlob],'volla-united-'+(item.slug||'news')+'.'+extension,{type:finalBlob.type});
   return preparedPhoto;
  }).catch(err=>{photoError=err;return null}):Promise.resolve(null);
  const photoHint=document.createElement('p');photoHint.className='news-share-hint';photoHint.hidden=true;
  const showPhotoHint=message=>{photoHint.textContent=message;photoHint.hidden=false};
  const sharePhoto=async()=>{
   if(!photoUrl){showPhotoHint('Questo articolo non contiene fotografie da condividere.');return}
   if(!preparedPhoto){
    if(!photoError){showPhotoHint('La fotografia si sta caricando: riprova tra qualche istante.');return}
    showPhotoHint('Non è possibile condividere direttamente questa foto. Aprila e salvala nelle Foto, poi pubblicala come Storia Instagram.');
    window.open(photoUrl,'_blank','noopener');return;
   }
   if(navigator.share&&navigator.canShare?.({files:[preparedPhoto]})){
    try{
     // Invio immagine + testo + URL. L'app destinataria può ignorare il link.
     await navigator.share({
      files:[preparedPhoto],
      title:item.title,
      text:'Leggi la notizia sul sito Volla United Academy: '+articleUrl,
      url:articleUrl
     });
     showPhotoHint('Foto e link inviati al menu di condivisione. Se Instagram non inserisce il link nella Storia, usa l’icona Copia link e aggiungilo con l’adesivo Link.');
    }catch(err){
     if(err.name!=='AbortError')showPhotoHint('Il dispositivo non è riuscito a condividere foto e link insieme. Puoi copiare il link e inserirlo nella Storia con l’adesivo Link.');
    }
   }else{
    showPhotoHint('Il browser non supporta la condivisione delle foto. Apri l’immagine e salvala; copia il link dall’icona accanto e inseriscilo nella Storia.');
    window.open(photoUrl,'_blank','noopener');
   }
  };
  // Non bloccare l'interfaccia: il caricamento procede durante la lettura.
  void photoReady;
  const shareNative=async(control)=>{
   if(navigator.share){
    try{await navigator.share({title:item.title,text:shareText,url:articleUrl})}
    catch(err){if(err.name!=='AbortError')console.warn('Condivisione non riuscita',err)}
   }else{
    try{await navigator.clipboard.writeText(articleUrl);control.title='Link copiato: incollalo nell’app scelta'}
    catch{window.prompt('Copia il link per condividerlo',articleUrl)}
   }
  };
  // Instagram e TikTok non offrono un link web per pubblicare direttamente un URL.
  // Il pulsante apre il menu di condivisione nativo: la scelta dell’app spetta all’utente.
  for(const platform of ['Instagram','TikTok']){
   const kind=platform.toLowerCase();
   const button=document.createElement('button');button.type='button';button.className='news-share-link '+kind;
   button.setAttribute('aria-label','Condividi tramite '+platform);button.title='Condividi tramite '+platform;
   button.innerHTML=iconSvg(kind);button.onclick=sharePhoto;links.append(button);
  }
  const copyLink=document.createElement('button');
  copyLink.type='button';copyLink.className='news-share-link copy-link';
  copyLink.setAttribute('aria-label','Copia il link per la Storia Instagram');copyLink.title='Copia link';
  copyLink.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  copyLink.onclick=async()=>{
   try{await navigator.clipboard.writeText(articleUrl);showPhotoHint('Link copiato. Su Instagram, nella Storia, aggiungi l’adesivo Link e incollalo.');}
   catch{window.prompt('Copia il link dell’articolo',articleUrl)}
  };
  links.append(copyLink);sharing.append(links,photoHint);
  const signature=document.createElement('p');signature.className='news-share-signature';signature.textContent='#𝚠𝚎𝙻⚽️𝚟𝚎 VOLLAUNITED🔥';
  sharing.append(signature);root.append(sharing);
  const back=document.createElement('p');back.style.marginTop='35px';const a=document.createElement('a');a.href='/news.html';a.textContent='← Torna alle news';a.style.color='#db153b';back.append(a);root.append(back);document.title=item.title+' | Volla United Academy';
 }
}else{
 root.className='grid news-list';
 for(const item of data){
  const card=document.createElement('a');
  card.className='vu-home-news-card';
  card.href='/news.html?articolo='+encodeURIComponent(item.slug||item.id);
  if(item.cover_url){
   const img=document.createElement('img');
   img.src=item.cover_url;img.alt='Fotografia: '+item.title;img.loading='lazy';
   card.append(img);
  }else{
   const placeholder=document.createElement('div');placeholder.className='vu-home-news-placeholder';
   placeholder.textContent='VOLLA UNITED';card.append(placeholder);
  }
  const copy=document.createElement('div');copy.className='vu-home-news-copy';
  const date=document.createElement('span');date.className='vu-home-news-date';date.textContent=fmt(item.published_at||item.created_at);
  const title=document.createElement('h2');title.textContent=item.title;
  const excerpt=document.createElement('p');excerpt.textContent=item.excerpt||item.content.slice(0,180);
  const more=document.createElement('span');more.className='vu-home-news-more';more.textContent='LEGGI LA NEWS →';
  copy.append(date,title,excerpt,more);card.append(copy);root.append(card);
 }
}