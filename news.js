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
  if(item.cover_url){const img=document.createElement('img');img.src=item.cover_url;img.alt=item.title;img.className='cover';root.append(img);}
  const text=document.createElement('div');text.className='bodycopy';text.textContent=item.content;root.append(text);
  if(item.image_urls?.length){const gal=document.createElement('div');gal.className='gallery';item.image_urls.forEach(src=>{const i=document.createElement('img');i.src=src;i.alt=item.title;i.loading='lazy';gal.append(i)});root.append(gal);}
  const back=document.createElement('p');back.style.marginTop='35px';const a=document.createElement('a');a.href='/news.html';a.textContent='← Torna alle news';a.style.color='#db153b';back.append(a);root.append(back);document.title=item.title+' | Volla United Academy';
 }
}else{
 for(const item of data){const box=document.createElement('article');box.className='article';
 if(item.cover_url){const img=document.createElement('img');img.src=item.cover_url;img.alt=item.title;img.loading='lazy';box.append(img);}
 const copy=document.createElement('div');copy.className='copy';
 const dt=document.createElement('span');dt.className='date';dt.textContent=fmt(item.published_at||item.created_at);
 const title=document.createElement('h2');title.textContent=item.title;
 const descr=document.createElement('p');descr.textContent=item.excerpt||item.content.slice(0,145)+'…';
 const link=document.createElement('a');link.href='/news.html?id='+encodeURIComponent(item.id);link.textContent='Leggi l’articolo →';
 copy.append(dt,title,descr,link);box.append(copy);root.append(box);}
}