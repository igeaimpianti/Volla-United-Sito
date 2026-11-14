import {createNewsCarousel} from './news-carousel.js?v=1';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient('https://ceitsxrbpabphfplahve.supabase.co',"sb_publishable_NVDBiMpRUshpXEEV8viKRg_pw6bVV8b");
const root=document.getElementById('news');
const fmt=d=>new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'});
const query=new URLSearchParams(location.search).get('id');
const {data,error}=await db.from('news_articles').select('id,title,excerpt,content,cover_url,image_urls,published_at,created_at').eq('published',true).order('published_at',{ascending:false}).limit(100);
root.replaceChildren();
if(error){root.textContent='Impossibile caricare le notizie al momento.';}
else if(!data?.length){root.textContent='Le notizie ufficiali saranno pubblicate qui a breve.';}
else if(query){
 const item=data.find(x=>x.id===query);
 if(!item){root.textContent='Articolo non disponibile.';}
 else {
  root.className='single';const date=document.createElement('div');date.className='date';date.textContent=fmt(item.published_at||item.created_at);
  const title=document.createElement('h1');title.textContent=item.title;
  const lead=document.createElement('p');lead.className='lead';lead.textContent=item.excerpt||'';
  root.append(date,title,lead);
  const carousel=createNewsCarousel([item.cover_url,...(item.image_urls||[])],item.title);
  if(carousel)root.append(carousel);
  const text=document.createElement('div');text.className='bodycopy';text.textContent=item.content;root.append(text);
  const back=document.createElement('p');back.style.marginTop='35px';const a=document.createElement('a');a.href='/news.html';a.textContent='← Torna alle news';a.style.color='#db153b';back.append(a);root.append(back);document.title=item.title+' | Volla United Academy';
 }
}else{
 root.className='grid news-list';
 for(const item of data){
  const card=document.createElement('a');
  card.className='vu-home-news-card';
  card.href='/news.html?id='+encodeURIComponent(item.id);
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