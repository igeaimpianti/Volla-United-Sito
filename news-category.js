import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient('https://ceitsxrbpabphfplahve.supabase.co',"sb_publishable_NVDBiMpRUshpXEEV8viKRg_pw6bVV8b");
const root=document.querySelector('[data-news-category]');
if(root){
 const category=root.dataset.newsCategory;
 const {data,error}=await db.from('news_articles').select('id,slug,title,excerpt,cover_url,category,published_at,created_at').eq('published',true).eq('category',category).order('published_at',{ascending:false}).limit(5);
 const list=root.querySelector('.vu-category-news-list');list.replaceChildren();
 if(error||!data?.length){const p=document.createElement('p');p.textContent=error?'Notizie temporaneamente non disponibili.':'Nessuna notizia pubblicata in questa sezione.';list.append(p)}
 else for(const item of data){const a=document.createElement('a');a.className='vu-category-news-card';a.href='/notizie/'+encodeURIComponent(item.slug||item.id)+'.html';const date=document.createElement('small');date.textContent=new Date(item.published_at||item.created_at).toLocaleDateString('it-IT');const h=document.createElement('h3');h.textContent=item.title;a.append(date,h);list.append(a)}
}