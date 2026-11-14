import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';
const db=createClient('https://ceitsxrbpabphfplahve.supabase.co',"sb_publishable_NVDBiMpRUshpXEEV8viKRg_pw6bVV8b");
const el=id=>document.getElementById(id);
const tell=s=>{el('msg').textContent=s};
let user=null,articles=[],currentImages=[];
function reset(){el('article').reset();el('articleid').value='';currentImages=[];renderThumbs();}
function renderThumbs(){el('thumbs').replaceChildren();for(const url of currentImages){const wrap=document.createElement('div'),img=document.createElement('img'),btn=document.createElement('button');img.src=url;img.alt='Foto articolo';btn.type='button';btn.textContent='Rimuovi';btn.className='mini';btn.onclick=()=>{currentImages=currentImages.filter(x=>x!==url);renderThumbs()};wrap.append(img,btn);el('thumbs').append(wrap)}}
function showPreview(item){
 const modal=el('article-preview'),body=el('article-preview-body');
 body.replaceChildren();
 const tag=(name,cls,value)=>{const node=document.createElement(name);if(cls)node.className=cls;node.textContent=value||'';return node};
 body.append(tag('div','date',item.published?'ARTICOLO PUBBLICATO':'ANTEPRIMA BOZZA'),tag('h2','news-preview-title',item.title||'Articolo senza titolo'));
 if(item.excerpt)body.append(tag('p','news-preview-lead',item.excerpt));
 const photos=[item.cover_url,...(item.image_urls||[])].filter(Boolean);
 if(photos.length){const cover=document.createElement('img');cover.src=photos[0];cover.alt=item.title||'Copertina';cover.className='news-preview-cover';body.append(cover)}
 body.append(tag('div','news-preview-text',item.content||''));
 if(photos.length>1){const gallery=document.createElement('div');gallery.className='gallery';for(const photo of photos.slice(1)){const image=document.createElement('img');image.src=photo;image.alt=item.title||'Fotografia';image.loading='lazy';gallery.append(image)}body.append(gallery)}
 modal.showModal();
}
el('article-preview-close').onclick=()=>el('article-preview').close();
el('article-preview').addEventListener('click',e=>{if(e.target===el('article-preview'))el('article-preview').close()});
async function load(){
 const {data,error}=await db.from('news_articles').select('*').order('created_at',{ascending:false});
 if(error)throw error;
 articles=data||[];
 const list=el('articlelist');list.replaceChildren();
 if(!articles.length){list.textContent='Nessun articolo.';return}
 for(const item of articles){
  const row=document.createElement('div');row.className='news-managed-item';
  const info=document.createElement('div');info.className='news-managed-info';
  const title=document.createElement('strong');title.textContent=item.title;
  const state=document.createElement('span');state.className='news-managed-status'+(item.published?' published':'');state.textContent=item.published?'Pubblicato':'Bozza';
  info.append(title,state);
  const actions=document.createElement('div');actions.className='news-managed-actions';
  const edit=document.createElement('button');edit.type='button';edit.className='news-action edit';edit.textContent='Modifica';
  edit.onclick=()=>{
   el('articleid').value=item.id;el('title').value=item.title;el('excerpt').value=item.excerpt;
   el('content').value=item.content;el('published').checked=item.published;
   currentImages=[item.cover_url,...(item.image_urls||[])].filter(Boolean);renderThumbs();
   el('images').value='';el('title').scrollIntoView({behavior:'smooth',block:'center'});el('title').focus({preventScroll:true});
   tell('Stai modificando: '+item.title);
  };
  const preview=document.createElement('button');preview.type='button';preview.className='news-action preview';preview.textContent='Anteprima';preview.onclick=()=>showPreview(item);
  const del=document.createElement('button');del.type='button';del.className='news-action delete';del.textContent='Elimina';
  del.onclick=async()=>{
   if(!confirm('Eliminare definitivamente l’articolo “'+item.title+'”?'))return;
   del.disabled=true;
   const {error}=await db.from('news_articles').delete().eq('id',item.id);
   if(error){tell('Errore eliminazione: '+error.message);del.disabled=false}
   else{if(el('articleid').value===item.id)reset();tell('Articolo eliminato');await load()}
  };
  actions.append(edit,preview,del);row.append(info,actions);list.append(row);
 }
}
async function verify(){const {data:{user:u}}=await db.auth.getUser();if(!u)return;const {data:p,error}=await db.from('profiles').select('role,active').eq('id',u.id).single();if(error||p?.role!=='admin'||!p.active){await db.auth.signOut();tell('Accesso riservato agli amministratori.');return}user=u;el('loginpanel').classList.add('hidden');el('editor').classList.remove('hidden');await load();}
el('login').onsubmit=async e=>{e.preventDefault();try{const name=el('username').value.trim().toLowerCase();const email=name.includes('@')?name:name+'@users.volla.invalid';const {error}=await db.auth.signInWithPassword({email,password:el('password').value});if(error)throw Error('Credenziali non valide');await verify()}catch(e){tell(e.message)}};
el('logout').onclick=async()=>{await db.auth.signOut();location.reload()};
el('new').onclick=reset;
el('preview').onclick=()=>showPreview({title:el('title').value,excerpt:el('excerpt').value,content:el('content').value,cover_url:currentImages[0]||null,image_urls:currentImages.slice(1),published:el('published').checked});
el('article').onsubmit=async e=>{e.preventDefault();if(!user)return;const save=e.submitter;save.disabled=true;try{
 const files=[...el('images').files];for(const file of files){if(file.size>10485760||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Formato o dimensione foto non consentiti');
 const path=user.id+'/'+crypto.randomUUID()+'-'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const {error}=await db.storage.from('volla-news').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(error)throw error;currentImages.push(db.storage.from('volla-news').getPublicUrl(path).data.publicUrl)}
 const title=el('title').value.trim();const published=el('published').checked;const id=el('articleid').value;
 const original=articles.find(x=>x.id===id);
 const entry={title,slug:original?.slug||'news-'+crypto.randomUUID(),excerpt:el('excerpt').value.trim(),content:el('content').value.trim(),cover_url:currentImages[0]||null,image_urls:currentImages.slice(1),published,author_id:original?.author_id||user.id,published_at:published?(original?.published_at||new Date().toISOString()):null,updated_at:new Date().toISOString()};
 const req=id?db.from('news_articles').update(entry).eq('id',id):db.from('news_articles').insert(entry);
 const {error}=await req;if(error)throw error;tell(published?'Articolo pubblicato sul sito.':'Bozza salvata.');reset();await load();
 }catch(e){tell('Errore: '+e.message)}finally{save.disabled=false}};
verify().catch(e=>tell(e.message));