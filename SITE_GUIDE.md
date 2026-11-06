# Volla United Academy — anteprima del sito

Prima versione del sito pubblico. Il dominio ufficiale mantiene la pagina di aggiornamento fino all'approvazione dell'utente.

## Contenuti

- Home, identità Academy e contatti pubblici dalla scheda Golee della società.
- 19 gruppi: filtri, ricerca per annata e schede accessibili; nessun dato personale dei minori pubblicato.
- Area prima squadra Promozione con schede Live, Calendario e Classifica.
- Collegamento alla PWA esistente: https://app.vollaunitedacademy.com/.
- Galleria con immagini di atmosfera da Unsplash, chiaramente indicate come illustrative.
- Tre concept SVG per lo store. Nessun prodotto ufficiale, prezzo, ordine o pagamento attivato.
- Font Barlow Condensed di Google Fonts incluso localmente; immagini locali senza richieste a CDN esterne.

## Attivare la prima squadra

Modificare `site-data.json` nella stessa cartella di `index.html`.

- `firstTeam.competition`, `group`, `season`: denominazione verificata del campionato.
- `sourceUrl`: link HTTPS alla fonte ufficiale dei dati.
- `updatedAt`: data di ultimo aggiornamento visibile all'utente.
- `live.youtubeId`: ID YouTube di 11 caratteri, senza URL. Il player si carica solo al clic.
- `live.title`: titolo della diretta, `status`: `scheduled` oppure `live`.
- `matches`: elenco di oggetti con `date`, `dateLabel`, `time`, `homeTeam`, `awayTeam`, `venue`, `score` (es. `2–1`; lasciare vuoto per gare non disputate).
- `standings`: elenco in ordine di classifica con `position`, `team`, `points`, `played`, `won`, `drawn`, `lost`, `isVolla` (booleano).

I dati non si aggiornano automaticamente da siti terzi. Collegare un'alimentazione ufficiale richiede la scelta della fonte e del girone. Finché gli elenchi sono vuoti, il sito mostra messaggi espliciti senza inventare risultati o classifiche.

## Prima del lancio

1. Approvare la grafica e verificare i recapiti.
2. Confermare le categorie attive e il girone Promozione.
3. Caricare fotografie originali e autorizzate, se disponibili.
4. Togliere etichetta anteprima e meta `noindex` solo al lancio approvato.
5. Per attivare ecommerce servono catalogo reale, prezzi, condizioni, gestione ordini e provider pagamenti: nessuno è implementato in questa anteprima.

## Asset

- Logo fornito dal repository `igeaimpianti/volla-united`, ottimizzato WebP.
- Immagini di atmosfera Unsplash: `photo-1522778119026-d647f0596c20`, `photo-1574629810360-7efbbe195018`, `photo-1518604666860-9ed391f76460`. Non sono foto della società.
- Font Barlow Condensed: Google Fonts, SIL Open Font License.

## Verifica

Aprire con un server HTTP statico, non tramite `file://`: i dati di campionato sono caricati con fetch da JSON. Controllare navigazione desktop/mobile, filtri, modali, tre schede Promozione, link area riservata e contatti. L'anteprima è distinta dalla PWA e non modifica Supabase.
