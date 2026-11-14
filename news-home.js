import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient('https://ceitsxrbpabphfplahve.supabase.co',"sb_publishable_NVDBiMpRUshpXEEV8viKRg_pw6bVV8b");
const root=document.getElementById('vu-home-news-grid');
if(root){
 const {data,error}=await db.from('news_articles').select('id,title,excerpt,content,cover_url,published_at,created_at').eq('published',true).order('published_at',{ascending:false}).limit(5);
 root.replaceChildren();
 if(error){const p=document.createElement('p');p.textContent='Le notizie non sono disponibili in questo momento.';root.append(p);console.warn('News Volla United',error)}
 else if(!data?.length){const p=document.createElement('p');p.textContent='Le nuove notizie della società saranno pubblicate qui.';root.append(p)}
 else for(const item of data){
  const card=document.createElement('a');card.className='vu-home-news-card';card.href='/news.html?id='+encodeURIComponent(item.id);
  if(item.cover_url){const img=document.createElement('img');img.src=item.cover_url;img.alt='Fotografia: '+item.title;img.loading='lazy';card.append(img)}
  else{const image=document.createElement('div');image.className='vu-home-news-placeholder';image.textContent='VOLLA UNITED';card.append(image)}
  const copy=document.createElement('div');copy.className='vu-home-news-copy';
  const date=document.createElement('span');date.className='vu-home-news-date';date.textContent=new Date(item.published_at||item.created_at).toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'});
  const title=document.createElement('h3');title.textContent=item.title;
  const desc=document.createElement('p');desc.textContent=item.excerpt||item.content.slice(0,180);
  const more=document.createElement('span');more.className='vu-home-news-more';more.textContent='LEGGI LA NEWS →';
  copy.append(date,title,desc,more);card.append(copy);root.append(card);
 }
}