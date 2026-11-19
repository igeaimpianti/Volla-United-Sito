// Genera pagine HTML SEO e sitemap dalle sole notizie pubblicate.
// Eseguire: node scripts/build-news-seo.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

// Social previews are generated as static HTML for WhatsApp and other crawlers.
const origin = 'https://www.vollaunitedacademy.com';
const api = 'https://ceitsxrbpabphfplahve.supabase.co';
const key = 'sb_publishable_NVDBiMpRUshpXEEV8viKRg_pw6bVV8b';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escapeXml = escapeHtml;
const jsonForScript = value => JSON.stringify(value).replace(/</g, '\\u003c');
const isSlug = s => /^[a-z0-9-]+$/i.test(s);
const iso = value => value ? new Date(value).toISOString() : undefined;
const dateOnly = value => iso(value)?.slice(0,10);
const articlePath = item => '/notizie/' + (item.slug || item.id) + '.html';

async function getPublishedNews() {
  const all = [];
  for(let offset=0; ; offset+=500) {
    const query = new URLSearchParams({
      select: 'id,slug,title,excerpt,content,cover_url,image_urls,published_at,created_at,updated_at',
      published: 'eq.true', order: 'published_at.desc', limit: '500', offset: String(offset)
    });
    const res = await fetch(api + '/rest/v1/news_articles?' + query, {
      headers: {'apikey': key, 'Authorization': 'Bearer ' + key}
    });
    if(!res.ok) throw new Error('Lettura notizie fallita: HTTP ' + res.status + ' ' + (await res.text()).slice(0,500));
    const page = await res.json();
    all.push(...page);
    if(page.length < 500) break;
  }
  return all.filter(item => isSlug(item.slug || item.id));
}

function metadata(item) {
  const url = origin + articlePath(item);
  const title = item.title + ' | Volla United Academy';
  const desc = (item.excerpt || item.content || '').replace(/\s+/g,' ').slice(0,155);
  const image = item.cover_url || item.image_urls?.[0] || origin + '/assets/volla-google-logo-1200.png';
  const date = iso(item.published_at || item.created_at);
  const modified = iso(item.updated_at || item.published_at || item.created_at);
  const structured = {
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: item.title, description: desc, mainEntityOfPage: url,
    image: [image], datePublished: date, dateModified: modified,
    author: {'@type':'Organization', name:'Volla United Academy', url:origin + '/'},
    publisher: {'@type':'Organization', name:'Volla United Academy', logo:{'@type':'ImageObject',url:origin+'/assets/volla-google-logo-1200.png'}}
  };
  return '<link rel="canonical" href="' + escapeHtml(url) + '">' +
    '<meta name="description" content="' + escapeHtml(desc) + '">' +
    '<meta name="googlebot" content="index,follow,max-image-preview:large">' +
    '<meta property="og:type" content="article">' +
    '<meta property="og:site_name" content="Volla United Academy">' +
    '<meta property="og:title" content="' + escapeHtml(item.title) + '">' +
    '<meta property="og:description" content="' + escapeHtml(desc) + '">' +
    '<meta property="og:url" content="' + escapeHtml(url) + '">' +
    '<meta property="og:image" content="' + escapeHtml(image) + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + escapeHtml(item.title) + '">' +
    '<meta name="twitter:description" content="' + escapeHtml(desc) + '">' +
    '<meta name="twitter:image" content="' + escapeHtml(image) + '">' +
    '<meta property="article:published_time" content="' + escapeHtml(date) + '">' +
    '<script type="application/ld+json">' + jsonForScript(structured) + '</script>' +
    '<title>' + escapeHtml(title) + '</title>';
}

function htmlArticle(item, template) {
  const date = new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'long',year:'numeric'})
    .format(new Date(item.published_at || item.created_at));
  const cover = item.cover_url || item.image_urls?.[0];
  const initialContent =
    '<article class="single">' +
    '<div class="date">' + escapeHtml(date) + '</div>' +
    '<h1>' + escapeHtml(item.title) + '</h1>' +
    (item.excerpt ? '<p class="lead">' + escapeHtml(item.excerpt) + '</p>' : '') +
    (cover ? '<img src="' + escapeHtml(cover) + '" alt="' + escapeHtml(item.title) + '" style="width:100%;height:auto;margin:25px 0">' : '') +
    '<div class="bodycopy" style="white-space:pre-line">' + escapeHtml(item.content) + '</div>' +
    '<p><a href="/news.html">Torna alle notizie</a></p></article>';
  // La pagina è leggibile senza JS; con JS mantiene le funzioni di condivisione/carousel esistenti.
  return template
    .replace(/<meta name="robots" content="index,follow">/, '<meta name="robots" content="index,follow">' + metadata(item))
    .replace('<div id="news" class="grid"><p>Caricamento notizie…</p></div>',
             '<div id="news" class="single">' + initialContent + '</div>')
    .replace('<body>', '<body class="article-view">');
}


// Pagine categorie indicizzabili: soltanto le rose autorizzate e pubblicate sul sito.
// Evita di mettere nella sitemap categorie che restituiscono una rosa vuota.
const publicCategories = [
  '2011 REGIONALI','2013 REGIONALI','2016 NERA','2016 ROSSA','2017','2019','2020'
];
const categorySlug = value => value.toLowerCase().replaceAll(' ','-');
async function generateCategoryPages(){
  const template = await fs.readFile('gruppo.html','utf8');
  await fs.mkdir('categorie',{recursive:true});
  for(const category of publicCategories){
    const url = origin+'/categorie/'+categorySlug(category)+'.html';
    const seoTitle = 'Volla United '+category+' – Rosa e Staff | Stagione 2026/27';
    const desc = 'Scopri la rosa ufficiale e lo staff tecnico della categoria '+category+
      ' della Volla United Academy di Volla (Napoli), stagione calcistica 2026/27.';
    const schema = {
      '@context':'https://schema.org','@type':'WebPage',name:seoTitle,url,
      description:desc,inLanguage:'it-IT',isPartOf:{'@type':'WebSite',name:'Volla United Academy',url:origin+'/'},
      about:{'@type':'SportsOrganization',name:'Volla United Academy',url:origin+'/'}
    };
    const head = '<title>'+escapeHtml(seoTitle)+'</title>'+
      '<meta name="description" content="'+escapeHtml(desc)+'">'+
      '<meta property="og:title" content="'+escapeHtml(seoTitle)+'">'+
      '<meta property="og:description" content="'+escapeHtml(desc)+'">'+
      '<meta property="og:type" content="website">'+
      '<meta property="og:url" content="'+escapeHtml(url)+'">'+
      '<meta property="og:image" content="'+origin+'/assets/volla-google-logo-1200.png">'+
      '<script type="application/ld+json">'+jsonForScript(schema)+'</script>'+
      '<meta name="robots" content="index,follow,max-image-preview:large">'+
      '<link rel="canonical" href="'+escapeHtml(url)+'">';
    const original = '<title>Rose e Staff delle Squadre | Volla United Academy</title>'+
      '<meta name="description" content="Consulta le rose e gli staff tecnici delle categorie Volla United Academy per la stagione 2026/27.">'+
      '<meta name="robots" content="index,follow,max-image-preview:large">'+
      '<link rel="canonical" href="https://www.vollaunitedacademy.com/squadre.html">';
    if(!template.includes(original)) { console.warn('Template categorie aggiornato: salto la rigenerazione delle categorie senza bloccare le notizie.'); return; }
    const page = template.replace(original,head)
      .replace('<h1 id="title">LE NOSTRE <span>SQUADRE</span></h1>',
        '<h1 id="title">'+escapeHtml(category)+'</h1>')
      .replace('<p class="sub" id="count"></p>',
        '<p class="sub" id="count">Rosa ufficiale e staff tecnico · Stagione 2026/27</p>');
    await fs.writeFile('categorie/'+categorySlug(category)+'.html',page);
  }
}
await generateCategoryPages();

const all = await getPublishedNews();
const template = await fs.readFile('news.html','utf8');
const directory = 'notizie';
await fs.mkdir(directory,{recursive:true});
const generated = new Set();
for(const item of all) {
  const filename = (item.slug || item.id) + '.html';
  generated.add(filename);
  await fs.writeFile(path.join(directory, filename),htmlArticle(item,template));
}
// Elimina esclusivamente le pagine marcate da questo generatore, non gli altri file.
for(const name of await fs.readdir(directory)){
  if(!generated.has(name) && name.endsWith('.html')){
    const contents = await fs.readFile(path.join(directory,name),'utf8');
    if(contents.includes('name="googlebot" content="index,follow,max-image-preview:large"') &&
       contents.includes('property="og:site_name" content="Volla United Academy"')){
      await fs.unlink(path.join(directory,name));
    }
  }
}
const oldSitemap = await fs.readFile('sitemap.xml','utf8');
const originalUrls = [...oldSitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1])
  .filter(u=>!u.includes('/notizie/') && !u.includes('/news.html?') && !u.includes('/gruppo.html?categoria=') && !u.includes('/categorie/'));
if(!originalUrls.includes(origin+'/news.html')) originalUrls.push(origin+'/news.html');
const entries = originalUrls.map(u=>'  <url><loc>'+escapeXml(u)+'</loc></url>');
for(const category of publicCategories){
  entries.push('  <url><loc>'+escapeXml(origin+'/categorie/'+categorySlug(category)+'.html')+'</loc></url>');
}
for(const item of all){
  const updated = dateOnly(item.updated_at || item.published_at || item.created_at);
  entries.push('  <url><loc>'+escapeXml(origin+articlePath(item))+'</loc>'+
    (updated?'<lastmod>'+updated+'</lastmod>':'')+'</url>');
}
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'+
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+
  entries.join('\n')+'\n</urlset>\n';
await fs.writeFile('sitemap.xml',xml);
console.log('SEO: generate '+all.length+' pagine notizie, sitemap aggiornata.');
