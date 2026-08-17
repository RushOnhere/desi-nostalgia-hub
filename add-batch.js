/* Adds a batch of newly found sites to the SITES array.
   mv:1 means the credit came from the site itself or the maker's own post.
   Left off, the card shows "पुष्टि बाकी" — the honest default for a listing
   we only saw on someone else's directory. */
const fs = require('fs');
const path = require('path');

const NEW = [
  { t:'यादों का आँगन', u:'https://90splaylist.wtf', d:'नब्बे की दोपहर वाला लो-फ़ाई रेडियो — जैसे बचपन के आँगन में बैठे हों।', c:'retro', g:'🌤️', h:38, p:'p-dots', k:'90s playlist yaadon aangan lofi summer afternoon', maker:'Nadeem Ali', handle:'nadeemali001', mv:1, te:'Yaadon Ka Aangan', de:'Lo-fi 90s summer-afternoon radio, framed as a childhood courtyard.' },
  { t:'ठेका', u:'https://theka.wtf', d:'देसी ठेका — तल्ली, ग़म, जश्न, इश्क़, यारी: हर मूड की अपनी बोतल।', c:'dukaan', g:'🍾', h:14, p:'p-stripe', k:'theka desi liquor shop drinking night songs talli gham jashn ishq yaari', maker:'Prathik Jain', handle:'undopizza', mv:1, te:'Theka', de:'A digital desi liquor shop — Hindi night songs across six moods.' },
  { t:'ट्रक ड्राइवर म्यूज़िक', u:'https://truckdrivermusic.in', d:'हाईवे पर ट्रक से बजने वाले पंजाबी, हिंदी और भोजपुरी गाने, बिना रुके।', c:'truck', g:'🚛', h:206, p:'p-stripe', k:'truck driver music highway punjabi bhojpuri', maker:'Harshit', handle:'itsharxit', mv:1, te:'Truck Driver Music', de:'Non-stop Punjabi, Hindi and Bhojpuri bangers that blast out of Indian trucks.' },
  { t:'ट्रक रेडियो', u:'https://truck-radio-seven.vercel.app', d:'हाथ से बना चार-कैसेट डेक, पीछे रात का हाईवे चलता रहता है।', c:'truck', g:'📼', h:186, p:'p-grid', k:'truck radio cassette deck night highway punjabi', maker:'Piyush Mahajan', handle:'bitcoins_hodler', mv:1, te:'Truck Radio', de:'A hand-built four-track cassette deck over a looping night-highway video.' },
  { t:'तमिल एफ़एम', u:'https://tamilfm.co', d:'दृश्य चुनिए — टी कड़ै, समुद्र की हवा, ट्रेन की खिड़की — रेडियो वैसा ही बजेगा।', c:'radio', g:'🌊', h:196, p:'p-wave', k:'tamilfm tamil scene tea kada beach train window', maker:'THISUX', handle:'spikeysanju', mv:1, te:'tamilfm', de:'Pick a Tamil scene — tea kada, beach wind, train window — and the radio matches it.' },
  { t:'अपणो धुन', u:'https://apnodhun.in', d:'राजस्थानी ब्याव के गाने — ढोलक, बन्ना-बन्नी, भजन।', c:'radio', g:'🪘', h:24, p:'p-rays', k:'apno dhun rajasthani wedding byaav dholak banna banni bhajan', maker:'Chethan P', handle:'chethxnnn', mv:1, te:'Apno Dhun', de:'Rajasthani wedding bangers — byaav songs, dholak, banna-banni, bhajans.' },
  { t:'श्री लक्ष्मी टी स्टॉल', u:'https://srilakshmi-teastall.vercel.app', d:'पाँच रुपये की चाय, तेलुगु पुराने गाने और नुक्कड़ की धूप।', c:'chai', g:'🫖', h:30, p:'p-dots', k:'srilakshmi tea stall telugu chai old songs', maker:'yaswanthveer.k', handle:'YaswanthVeer1', mv:1, te:'Sri Lakshmi Tea Stall', de:'A ₹5 Telugu tea-stall corner playing old Telugu songs.' },
  { t:'यात्रीगण कृपया ध्यान दें', u:'https://ykdd.vercel.app', d:'रेलवे की खटखट, चाय की दुकान की बारिश और नब्बे का बॉलीवुड।', c:'bus', g:'🚉', h:210, p:'p-grid', k:'ykdd yatrigan kripya dhyan dein railways bollywood rain soundboard', maker:'Subham Dey', handle:'subhamdartist', mv:1, te:'Yatrigan Kripya Dhyan Dein', de:'A 90s Bollywood station with Indian Railways clatter and a chai-shop rain soundboard.' },
  { t:'तीयां', u:'https://teej-festival-theta.vercel.app', d:'पंजाबी सावन का तीयां — हर रस्म पर उसका अपना लोकगीत।', c:'tyohar', g:'🌿', h:118, p:'p-rays', k:'teeyan teej punjabi monsoon festival folk women', maker:'Sania', handle:'decodedbysania', mv:1, te:'Teeyan', de:'A scrolling record of Teeyan, the Punjabi women’s monsoon festival, with folk music for each ritual.' },
  { t:'जोधपुर', u:'https://jodhpur.keshav-vibex.workers.dev', d:'किला, रेगिस्तान, नीली छतें — और पीछे बजता हुआ शहर।', c:'retro', g:'🏰', h:214, p:'p-check', k:'jodhpur blue heaven fort desert rajasthan city tribute', maker:'Keshav Vaishnav', handle:'keshavvais20352', mv:1, te:'Jodhpur — The Blue Heaven', de:'A single-screen tribute to Jodhpur: fort, desert, blue rooftops, music behind it.' },
  { t:'कारवाँ', u:'https://caravan.naveengumaste.me', d:'फ़िलिप्स वाला कैसेट रिकॉर्डर — बस, ट्रक, ऑटो और सैलून की प्लेलिस्ट।', c:'bus', g:'📻', h:32, p:'p-grid', k:'caravan cassette recorder philips bus truck auto barbershop', maker:'Naveen Gumaste', handle:'Z0D404', mv:1, te:'Caravan', de:'A Philips-style analog cassette recorder playing bus, truck, auto and barbershop playlists.' },
  { t:'मेरो पहाड़', u:'https://meropahaad.in', d:'पहाड़ चढ़ती बस में बजते उत्तराखंडी लोकगीत।', c:'bus', g:'⛰️', h:150, p:'p-wave', k:'mero pahaad uttarakhandi garhwali kumaoni folk hill bus', maker:'Himanshu Chandola', handle:'himanshuchandola', mv:1, te:'Mero Pahaad', de:'Uttarakhandi folk that plays on the bus ride up the hill.' },
  { t:'मने पड़े से दिन', u:'https://manepade-sedina.netlify.app', d:'पुराने ओड़िया गाने — ज़िंदगी के कुछ ख़ास दिनों की तरह।', c:'radio', g:'🎶', h:280, p:'p-dots', k:'manepade sedina odia odisha old songs memory', maker:'', handle:'zubun98', te:'Manepade Sedina', de:'An Odia memory room — old Odia songs as “certain days of our lives”.' },
  { t:'नाटिल बस', u:'https://naatil-bus.vercel.app', d:'केरल की प्राइवेट बस और पुराने मलयालम फ़िल्मी गाने।', c:'bus', g:'🚍', h:132, p:'p-stripe', k:'naatil bus kerala private malayalam film songs', maker:'', handle:'K4rthik14', te:'Naatil Bus', de:'A Kerala private-bus music experience with classic Malayalam film songs.' },
  { t:'लावणीचा फड', u:'https://lavanicha-fad.vercel.app', d:'रातभर चलणारा लावणीचा फड — बसा, ऐकत रहा।', c:'radio', g:'💃', h:346, p:'p-rays', k:'lavanicha fad marathi lavani all night', maker:'', handle:'AshwinKUlkarni4', te:'Lavanicha Fad', de:'An all-night Marathi Lavani fad — sit down, keep listening, the songs do not stop.' },
  { t:'शारद अड्डा', u:'https://sharod-adda.vercel.app', d:'दुर्गा पूजा की उलटी गिनती, बांग्ला गाने और ढाक।', c:'tyohar', g:'🥁', h:16, p:'p-rays', k:'sharod adda durga puja bengali dhaak countdown', maker:'', handle:'S4Sanjay_das', te:'Sharod Adda', de:'A Durga Puja countdown with Bengali songs and dhaak.' },
  { t:'इलैयाराजा की रात', u:'https://ilaya-raja.vercel.app', d:'इलैयाराजा की देर रात वाली प्लेलिस्ट — सूरज निकलने तक।', c:'radio', g:'🌙', h:258, p:'p-wave', k:'ilaiyaraaja late night tamil playlist', maker:'', handle:'meetlynnjoseph', te:'Ilaiyaraaja Late Night', de:'An Ilaiyaraaja late-night playlist that runs until the sun comes up.' },
  { t:'कंडक्टर एफ़एम', u:'https://conductor-fm.nikhilkumar007.com', d:'आख़िरी स्टॉप, सबसे अच्छा गाना — घर लौटती आख़िरी बस।', c:'bus', g:'🎫', h:44, p:'p-grid', k:'conductor fm last bus home bengaluru playlist', maker:'', handle:'Nikhilkdev007', te:'Conductor FM', de:'“Last stop, best song” — the last-bus-home conductor playlist.' },
  { t:'गली की धुन', u:'https://gully-cricket-radio.vercel.app', d:'गली क्रिकेट और गर्मी की छुट्टियाँ — हर छक्का पड़ोसी की दीवार पार।', c:'retro', g:'🏏', h:96, p:'p-check', k:'gully ki dhun cricket radio street summer holidays rec 2001', maker:'', handle:'', te:'Gully Ki Dhun', de:'Street-cricket and Indian-summer radio, for every six over the neighbour’s wall.' },
  { t:'टपरी एफ़एम', u:'https://taprifm.xyz', d:'रेट्रो रेडियो डायल घुमाइए — चाय, धुन, अड्डा।', c:'chai', g:'📻', h:20, p:'p-dots', k:'tapri fm retro radio dial chai dhun adda', maker:'Parth Kapoor', handle:'parth__kapoor', mv:1, te:'Tapri FM', de:'A retro radio dial you drag across chai-time classics — CHAI · DHUN · ADDA.' },
];

const file = path.join(__dirname, 'index.html');
let s = fs.readFileSync(file, 'utf8');

const fmt = e => '  { ' + Object.entries(e)
  .map(([k, v]) => k + ':' + (typeof v === 'number' ? v : JSON.stringify(v).replace(/^"|"$/g, "'").replace(/\\"/g, '"')))
  .join(', ') + ' },';

// SITES is grouped by category at render time, so appending is safe.
// Anchor on the last site entry — the first "];" in the file closes CATS.
const lastEntry = s.lastIndexOf("u:'https://");
const at = s.indexOf('];', lastEntry);
if (lastEntry === -1 || at === -1) throw new Error('end of SITES not found');

const existing = new Set([...s.matchAll(/u:'(https:\/\/[^']+)'/g)].map(m => m[1]));
const fresh = NEW.filter(e => !existing.has(e.u));
const dupes = NEW.length - fresh.length;

s = s.slice(0, at) + '\n' + fresh.map(fmt).join('\n') + s.slice(at);
fs.writeFileSync(file, s);

fs.writeFileSync(path.join(__dirname, 'new-batch.json'),
  JSON.stringify(fresh.map(e => e.u.replace(/^https?:\/\//, '')), null, 1));

console.log('added', fresh.length, 'sites' + (dupes ? ' (' + dupes + ' already present)' : ''));
console.log('confirmed credits:', fresh.filter(e => e.mv).length, '| unconfirmed:', fresh.filter(e => !e.mv).length);
console.log('SITES total:', (s.match(/\{ t:'/g) || []).length);
