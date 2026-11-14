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
  const makeLink=(label,url,kind)=>{
   const link=document.createElement('a');link.className='news-share-link '+kind;link.href=url;
   link.target='_blank';link.rel='noopener noreferrer';link.textContent=label;return link;
  };
  links.append(
   makeLink('WhatsApp','https://api.whatsapp.com/send?text='+encodeURIComponent(shareText+'\n'+articleUrl),'whatsapp'),
   makeLink('Facebook','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(articleUrl),'facebook')
  );
  const moreShare=document.createElement('button');moreShare.type='button';moreShare.className='news-share-link more';moreShare.textContent='Condividi';
  moreShare.onclick=async()=>{
   if(navigator.share){
    try{await navigator.share({title:item.title,text:shareText,url:articleUrl})}catch(err){if(err.name!=='AbortError')console.warn('Condivisione non riuscita',err)}
   }else{
    try{await navigator.clipboard.writeText(articleUrl);moreShare.textContent='Link copiato'}catch{window.prompt('Copia il link',articleUrl)}
   }
  };
  links.append(moreShare);sharing.append(links);
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