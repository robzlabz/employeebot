<script type="text/x-dc" data-dc-script data-props='{"accent":{"editor":"color","default":"#1F7FD6","options":["#1F7FD6","#E2602B","#7A4FC0","#23915A"],"section":"Tampilan"},"startOn":{"editor":"enum","options":["Dasbor","Oren","Biru","Lila","Ijo","Pinky","Kunyit"],"default":"Dasbor","section":"Tampilan"},"$preview":{"width":1440,"height":1900}}'>
var SH = {
  kacang:{d:'M60 50 C100 30 160 40 165 90 C170 140 140 170 95 168 C50 166 28 140 32 100 C34 75 40 60 60 50 Z',sw:4,face:'translate(100 107) scale(1.1)',foot:168},
  hantu:{d:'M90 30 C130 26 150 60 146 100 C143 126 154 142 162 156 Q172 174 152 174 C130 174 112 168 100 160 C70 168 52 140 52 104 C52 60 60 34 90 30 Z',sw:6,face:'translate(98 89) scale(1)',foot:0},
  gumpal:{d:'M50 52 C80 36 130 38 158 52 C176 70 172 130 160 152 C140 172 70 174 46 154 C30 130 30 72 50 52 Z',sw:4,face:'translate(100 103) scale(1.15)',foot:166},
  awan:{d:'M50 162 Q20 162 22 132 Q24 106 50 102 Q50 64 88 60 Q112 36 140 58 Q176 60 172 100 Q190 114 182 140 Q176 164 150 162 Z',sw:4,face:'translate(102 119) scale(1.05)',foot:162},
  tetes:{d:'M88 42 Q100 22 112 42 Q150 92 160 120 Q166 172 100 172 Q34 172 40 120 Q50 92 88 42 Z',sw:6,face:'translate(100 129) scale(1.05)',foot:172},
  mochi:{d:'M28 142 Q24 72 100 68 Q176 72 172 142 Q172 172 100 172 Q28 172 28 142 Z',sw:4,face:'translate(100 127) scale(1.1)',foot:172}
};
var MO = {
  open:{d:'M-12 9 Q0 11 12 9 Q10 26 0 26 Q-10 26 -12 9 Z',fill:'#1E1B2E',sw:0},
  smile:{d:'M-9 12 Q0 20 9 12',fill:'none',sw:4.5},
  focus:{d:'M-7 16 Q0 13 7 16',fill:'none',sw:4.5},
  w:{d:'M-9 13 Q-4.5 19 0 13 Q4.5 19 9 13',fill:'none',sw:4},
  sleep:{d:'M-6 17 L6 17',fill:'none',sw:4},
  o:{d:'M-5 18 a5 6 0 1 0 10 0 a5 6 0 1 0 -10 0 Z',fill:'#1E1B2E',sw:0}
};
function mk(o){
  var s = SH[o.shape], m = MO[o.mouth || 'smile'], y = s.foot - 3;
  return Object.assign({}, o, {
    d:s.d, sw:s.sw, face:s.face, hasFeet:!!s.foot,
    feet:'M70 '+y+' a12 8 0 1 0 24 0 a12 8 0 1 0 -24 0 Z M106 '+y+' a12 8 0 1 0 24 0 a12 8 0 1 0 -24 0 Z',
    mouth:m.d, mouthFill:m.fill, mouthSw:m.sw, look:o.look || 'translate(0 0)', delay:o.delay || '0s',
    eyesOpen: !o.closed, eyesClosed: !!o.closed
  });
}
var BASE = [
  {name:'Oren', role:'Tukang invoice', shape:'kacang', color:'#F28C4E', feetColor:'#D9692A', tint:'#FDE7DA', mouth:'focus', look:'translate(2 3)', delay:'0s',
    kw:['invoice','tagih','bayar','faktur'], done:14,
    bio:'Aku bikin invoice dari data pesanan, mengirimnya ke pelanggan, dan menagih dengan sopan kalau sudah lewat jatuh tempo.',
    skills:['Membuat invoice dari rekap pesanan','Menghitung diskon, pajak, dan ongkir','Mengirim pengingat bayar bertahap'],
    chips:['Buat invoice untuk pesanan hari ini','Tagih invoice yang telat','Kirim ringkasan tagihan'],
    after:'Drafnya kutaruh di sini dan di Dasbor begitu siap.', team:'Mengambil data pesanan dari Ijo, lalu minta Lila memasang pengingat jatuh tempo.', mates:['Ijo','Lila'],
    acts:['membuat invoice INV-0044','menghitung pajak pesanan','menyiapkan pengingat bayar']},
  {name:'Biru', role:'Penjaga WhatsApp', shape:'hantu', color:'#2E9BEF', feetColor:'#1B7AC7', tint:'#DCEEFD', mouth:'open', look:'translate(-2 2)', delay:'.4s',
    kw:['wa','whatsapp','chat','balas','pelanggan','resi'], done:23,
    bio:'Aku menjawab chat pelanggan yang itu-itu saja: ongkir, status pesanan, stok, jam buka, dan nomor rekening.',
    skills:['Membalas pertanyaan umum dengan gaya bahasamu','Mengirim nomor resi dan status pesanan','Menahan chat sensitif untuk kamu baca dulu'],
    chips:['Balas semua chat soal ongkir','Kirim resi ke pelanggan hari ini','Pakai gaya bahasa lebih santai'],
    after:'Balasan yang sensitif tetap kutahan dulu untuk kamu cek.', team:'Mengecek status pesanan ke Ijo dan meneruskan permintaan invoice ke Oren.', mates:['Ijo','Oren'],
    acts:['membalas chat soal ongkir','mengirim nomor resi','membalas pertanyaan stok']},
  {name:'Lila', role:'Pengatur jadwal', shape:'gumpal', color:'#A77DC9', feetColor:'#8459AB', tint:'#EEE5F7', mouth:'smile', look:'translate(3 -2)', delay:'.8s',
    kw:['jadwal','rapat','meeting','ingat','kalender'], done:6,
    bio:'Aku mencarikan waktu rapat yang pas untuk semua orang, mengirim undangan, dan mengingatkan tenggat.',
    skills:['Mencari slot kosong semua peserta','Mengirim undangan kalender','Mengingatkan tenggat sehari sebelumnya'],
    chips:['Jadwalkan rapat tim minggu depan','Ingatkan tenggat pajak','Kosongkan Jumat sore'],
    after:'Kalau ada jadwal yang bentrok, aku kabari dulu sebelum mengirim undangan.', team:'Memasang pengingat jatuh tempo untuk invoice buatan Oren.', mates:['Oren','Kunyit'],
    acts:['mencari slot rapat','mengirim undangan kalender','memasang pengingat tenggat']},
  {name:'Ijo', role:'Juru rekap', shape:'mochi', color:'#4DBB72', feetColor:'#34985A', tint:'#DFF3E6', mouth:'focus', look:'translate(0 3)', delay:'1.2s',
    kw:['rekap','data','stok','laporan','spreadsheet','excel'], done:11,
    bio:'Aku memindahkan data pesanan ke spreadsheet, memperbarui stok, dan menyusun rekap mingguan.',
    skills:['Mencatat pesanan dari chat dan email','Memperbarui sisa stok','Menyusun rekap mingguan'],
    chips:['Rekap penjualan minggu ini','Cek stok yang hampir habis','Ekspor data ke Excel'],
    after:'Hasilnya kusimpan di sheet Rekap Oktober.', team:'Menerima pesanan dari Biru dan mengoper datanya ke Oren untuk dibuatkan invoice.', mates:['Biru','Oren'],
    acts:['mencatat pesanan baru','memperbarui sisa stok','menyusun rekap mingguan']},
  {name:'Pinky', role:'Pengarsip', shape:'awan', color:'#F59ABF', feetColor:'#E07199', tint:'#FDE6EF', mouth:'w', look:'translate(-3 1)', delay:'1.6s',
    kw:['file','arsip','folder','dokumen','scan','kontrak'], done:14,
    bio:'Aku merapikan nama file, memilah dokumen, dan menyimpan bukti transfer ke folder yang benar.',
    skills:['Memberi nama file yang jelas','Memindahkan dokumen ke folder yang tepat','Mencari dokumen lama dengan cepat'],
    chips:['Rapikan folder Unduhan','Arsipkan bukti transfer bulan ini','Cari kontrak Toko Sari'],
    after:'Nama file lamanya tetap kucatat, jadi gampang dicari lagi.', team:'Menyimpan invoice Oren dan menautkan bukti bayar ke rekap Ijo.', mates:['Oren','Ijo'],
    acts:['mengganti nama scan_0201.pdf','memindahkan kuitansi','menyimpan bukti transfer']},
  {name:'Kunyit', role:'Pembalas email', shape:'tetes', color:'#FFC21A', feetColor:'#DDA000', tint:'#FFF3CC', mouth:'smile', look:'translate(2 1)', delay:'2s',
    kw:['email','surel','inbox','surat'], done:9,
    bio:'Aku memilah inbox, menandai email penting, dan menyiapkan draf balasan untuk kamu periksa.',
    skills:['Memilah email masuk','Menandai yang butuh keputusanmu','Menyiapkan draf balasan'],
    chips:['Pilah email yang belum dibaca','Ringkas email minggu ini','Siapkan balasan untuk CV Maju'],
    after:'Email yang butuh keputusanmu kutandai merah.', team:'Mengirim invoice Oren lewat email dan meneruskan undangan rapat dari Lila.', mates:['Oren','Lila'],
    acts:['memilah email masuk','menandai email penting','menyiapkan draf balasan']}
];
var BY = {}, RAW = {}; BASE.forEach(function(b){ BY[b.name] = mk(b); RAW[b.name] = b; });
var DRAFTS = {
  a1:{bot:'Oren', kind:'Invoice', title:'INV-0043 untuk Toko Sari', meta:'Rp 1.124.000 · jatuh tempo 21 Okt', cta:'Setujui & kirim',
    fields:[['Pelanggan','Toko Sari'],['Isi','Kaos polos ×10, sablon, ongkir'],['Total','Rp 1.124.000']],
    draft:'Halo Bu Sari, terlampir invoice INV-0043 untuk pesanan kaos 10 pcs.\nMohon dibayar sebelum 21 Oktober. Terima kasih!'},
  a5:{bot:'Oren', kind:'Penagihan', title:'Pengingat bayar untuk Bagas', meta:'Telat 3 hari · Rp 189.000', cta:'Setujui & kirim',
    fields:[['Invoice','INV-0039'],['Jatuh tempo','4 Oktober'],['Pengingat ke-','1']],
    draft:'Halo Kak Bagas, sekadar mengingatkan invoice INV-0039 sebesar Rp 189.000 sudah lewat jatuh tempo. Kalau sudah transfer, abaikan pesan ini ya.'},
  a2:{bot:'Biru', kind:'Balasan WhatsApp', title:'Balasan untuk Dimas', meta:'Tanya status pesanan hoodie', cta:'Setujui & kirim',
    fields:[['Pesan masuk','“Kak, hoodie saya kapan dikirim?”'],['Data dari','Rekap Ijo · belum lunas']],
    draft:'Halo Kak Dimas! Hoodie abu ukuran M sudah siap. Pesanan dikirim setelah pembayaran Rp 245.000 kami terima ya, Kak.'},
  a4:{bot:'Lila', kind:'Undangan rapat', title:'Rapat evaluasi Kamis 10.00', meta:'4 peserta · 45 menit', cta:'Setujui & undang',
    fields:[['Waktu','Kamis, 8 Okt · 10.00–10.45'],['Peserta','4 orang, semua kosong'],['Tempat','Daring']],
    draft:'Agenda: evaluasi penjualan minggu ini dan rencana stok November.'},
  a3:{bot:'Kunyit', kind:'Email', title:'Balasan ke CV Maju', meta:'Permintaan penawaran harga', cta:'Setujui & kirim',
    fields:[['Dari','pengadaan@[DOMAIN]'],['Lampiran','Daftar harga Oktober.pdf']],
    draft:'Selamat siang, terima kasih atas minatnya. Kami lampirkan daftar harga terbaru.\nUntuk pesanan di atas 50 pcs, harga khusus bisa kita diskusikan.'}
};
var ORDER = ['a1','a2','a3','a4','a5'];
var SEED = {
  Oren:[['bot','Selamat pagi! Ada 3 pesanan baru dari rekap Ijo, invoice-nya sudah kusiapkan.'],['bot','INV-0043 untuk Toko Sari siap dikirim:','a1'],['bot','Bagas sudah telat bayar 3 hari. Boleh kukirim pengingat pertama?','a5']],
  Biru:[['you','Biru, kalau ada yang tanya ongkir pakai tarif terbaru ya'],['bot','Siap, tarif terbaru sudah kucatat. Pagi ini 6 chat sudah kubalas.'],['bot','Dimas tanya soal hoodie-nya. Ini draf balasanku:','a2']],
  Lila:[['bot','Semua peserta kosong di Kamis jam 10. Mau kukirim undangannya?','a4']],
  Ijo:[['bot','Rekap minggu ini sudah kuperbarui: 18 pesanan, 2 belum lunas. Datanya sudah kuoper ke Oren untuk penagihan.']],
  Pinky:[['bot','Folder Unduhan sudah rapi! 14 file kuganti namanya dan kupindahkan ke Arsip/2026/Oktober.']],
  Kunyit:[['bot','Ada 30 email masuk sejak kemarin, 3 kutandai penting.'],['bot','Ini draf balasan untuk CV Maju:','a3']]
};
var INIT_FEED = [['Ijo','memperbarui rekap pesanan','10.28'],['Pinky','merapikan 14 file di Unduhan','10.24'],['Biru','membalas 6 chat pelanggan','10.19'],['Oren','mengirim INV-0042 ke Rina','10.12'],['Kunyit','menandai 3 email penting','10.05']];

class Component extends DCLogic {
  componentDidMount() {
    var self = this, threads = {};
    Object.keys(SEED).forEach(function(n){ threads[n] = SEED[n].map(function(m){ return {from:m[0], text:m[1], draft:m[2] || null, cls:''}; }); });
    var start = this.props.startOn && this.props.startOn !== 'Dasbor' ? this.props.startOn : 'dash';
    var unread = {Oren:2, Biru:1, Lila:1, Kunyit:1}; if (start !== 'dash') unread[start] = 0;
    this.setState({ tick:0, view:start, threads:threads, verdict:{}, paused:{}, typing:{}, unread:unread, chatMsg:'', dashMsg:'',
      feed: INIT_FEED.map(function(f){ return {who:f[0], text:f[1], time:f[2], cls:''}; }), toast:'', toastBot:'Oren' });
    this.timer = setInterval(function(){
      var s = self.state, t = (s.tick || 0) + 1, upd = { tick:t };
      var active = BASE.filter(function(b){ return !(s.paused || {})[b.name]; });
      if (t % 2 === 0 && active.length) {
        var b = active[(t / 2) % active.length];
        upd.feed = self.pushFeed(s.feed, { who:b.name, text:'selesai ' + b.acts[(t / 2) % b.acts.length] }, t);
      }
      self.setState(upd);
    }, 3000);
  }
  componentWillUnmount() { clearInterval(this.timer); clearTimeout(this.tt); (this.rt || []).forEach(clearTimeout); }
  clock(t) { var m = 30 + Math.floor((t || 0) / 2); return '10.' + (m < 60 ? m : 59); }
  pushFeed(feed, item, t) { item.time = this.clock(t === undefined ? this.state.tick : t); item.cls = 'pop'; return [item].concat(feed || []).slice(0, 7); }
  say(text, bot) { var self = this; clearTimeout(this.tt); this.setState({ toast:text, toastBot:bot || 'Oren' }); this.tt = setTimeout(function(){ self.setState({ toast:'' }); }, 2600); }
  addMsg(threads, name, msg) { var t = Object.assign({}, threads); msg.cls = 'pop'; t[name] = (t[name] || []).concat([msg]); return t; }
  open(name) { var u = Object.assign({}, this.state.unread); u[name] = 0; this.setState({ view:name, unread:u, chatMsg:'' }); }
  decide(id, ok) {
    var s = this.state, d = DRAFTS[id], v = Object.assign({}, s.verdict); v[id] = ok ? 'ok' : 'rev';
    var reply = ok ? 'Beres, sudah kukirim. Terima kasih!' : 'Oke, aku revisi dulu ya. Nanti kukabari lagi di sini.';
    this.setState({ verdict:v, threads:this.addMsg(s.threads, d.bot, {from:'bot', text:reply}),
      feed: this.pushFeed(s.feed, ok ? {who:'Kamu', you:true, text:'menyetujui ' + d.title} : {who:'Kamu', you:true, text:'minta ' + d.bot + ' merevisi ' + d.title}) });
    this.say(ok ? d.title + ' terkirim' : d.bot + ' akan merevisi drafnya', d.bot);
  }
  talk(name, txt) {
    var self = this, s = this.state; txt = (txt || '').trim(); if (!txt) return;
    var ty = Object.assign({}, s.typing); ty[name] = true;
    this.setState({ threads:this.addMsg(s.threads, name, {from:'you', text:txt}), typing:ty, chatMsg:'' });
    this.rt = (this.rt || []).concat([setTimeout(function(){
      var s2 = self.state, b = RAW[name], asleep = (s2.paused || {})[name];
      var reply = asleep ? 'Zzz… aku lagi istirahat. Nyalakan aku dulu dari tombol di atas, ya.' : 'Oke! Aku kerjakan: “' + txt + '”. ' + b.after;
      var ty2 = Object.assign({}, s2.typing); ty2[name] = false;
      var u = Object.assign({}, s2.unread); if (s2.view !== name) u[name] = (u[name] || 0) + 1;
      var upd = { threads:self.addMsg(s2.threads, name, {from:'bot', text:reply}), typing:ty2, unread:u };
      if (!asleep) upd.feed = self.pushFeed(s2.feed, {who:name, text:'menerima tugas: “' + txt + '”'});
      self.setState(upd);
    }, 1400)]);
  }
  route(txt) {
    var low = (txt || '').toLowerCase();
    return (BASE.filter(function(b){ return b.kw.some(function(k){ return low.indexOf(k) >= 0; }); })[0] || BASE[2]).name;
  }
  renderVals() {
    var self = this, s = this.state || {}, tick = s.tick || 0, view = s.view || 'dash';
    var verdict = s.verdict || {}, paused = s.paused || {}, typing = s.typing || {}, unread = s.unread || {}, threads = s.threads || {};
    var accent = this.props.accent || '#1F7FD6';
    var pend = ORDER.filter(function(id){ return !verdict[id]; });
    var waitBy = {}; pend.forEach(function(id){ waitBy[DRAFTS[id].bot] = (waitBy[DRAFTS[id].bot] || 0) + 1; });
    function face(b){
      var n = b.name;
      if (paused[n]) return mk(Object.assign({}, RAW[n], {closed:true, mouth:'sleep'}));
      if (typing[n]) return mk(Object.assign({}, RAW[n], {mouth:'focus', look:'translate(3 -3)'}));
      return BY[n];
    }
    function status(n){
      if (paused[n]) return ['Istirahat', '#8B88A0', 'Istirahat'];
      if (typing[n]) return ['Sedang mengetik…', '#1E7A43', 'Sedang mengetik…'];
      if (waitBy[n]) return ['Menunggu kamu', '#E2602B', 'Draf menunggu kamu'];
      var b = RAW[n]; return ['Sedang bekerja', '#2FA65A', 'Sedang ' + b.acts[(Math.floor(tick / 2) + BASE.indexOf(b)) % b.acts.length]];
    }
    var cardFor = function(id){
      var d = DRAFTS[id], v = verdict[id], b = RAW[d.bot];
      return { kind:d.kind, title:d.title, draft:d.draft, cta:d.cta, tint:b.tint,
        fields:d.fields.map(function(f){ return {k:f[0], v:f[1]}; }),
        isPending:!v, isDone:!!v, doneLabel: v === 'ok' ? 'Disetujui dan terkirim' : 'Diminta revisi', doneBg: v === 'ok' ? '#1E7A43' : '#B4421F',
        approve:function(){ self.decide(id, true); }, reject:function(){ self.decide(id, false); } };
    };
    var out = {
      accent: accent, logo: BY.Oren,
      happy: mk(Object.assign({}, RAW.Pinky, {mouth:'open'})),
      isDash: view === 'dash', isBot: view !== 'dash',
      openDash: function(){ self.setState({ view:'dash' }); },
      dashStyle: 'display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 14px; border-radius: 16px; font: inherit; font-weight: 700; font-size: 17px; cursor: pointer; ' + (view === 'dash' ? 'background: #1E1B2E; color: #FFFFFF; border: 0' : 'background: #F5F6FB; color: #1E1B2E; border: 0'),
      hasPending: pend.length > 0, noPending: pend.length === 0, pendingCount: pend.length, pendingLabel: pend.length ? pend.length + ' draf' : '',
      activeLabel: (BASE.length - Object.keys(paused).filter(function(k){ return paused[k]; }).length) + ' aktif',
      side: BASE.map(function(b){
        var st = status(b.name), on = view === b.name, n = unread[b.name] || 0;
        return Object.assign({}, face(b), {
          line: st[2], statusColor: st[1], hasUnread: n > 0 && !on, unread: n,
          anim: paused[b.name] ? '' : 'bob', opacity: paused[b.name] ? 0.5 : 1,
          pick: function(){ self.open(b.name); },
          style: 'display: flex; align-items: center; gap: 12px; flex: 1 1 220px; min-width: 0; min-height: 60px; padding: 8px 10px; border-radius: 16px; font: inherit; color: #1E1B2E; cursor: pointer; ' + (on ? 'background: ' + b.tint + '; border: 2px solid #1E1B2E' : 'background: transparent; border: 2px solid transparent')
        });
      }),
      toast: s.toast || '', hasToast: !!s.toast, toastBot: BY[s.toastBot] || BY.Oren
    };
    if (view === 'dash') {
      var doneCount = Object.keys(verdict).length;
      Object.assign(out, {
        dashMsg: s.dashMsg || '',
        onDashMsg: function(e){ self.setState({ dashMsg:e.target.value }); },
        onDashKey: function(e){ if (e.key === 'Enter') out.sendDash(); },
        sendDash: function(){ var t = (self.state.dashMsg || '').trim(); if (!t) return; var who = self.route(t); self.setState({ dashMsg:'' }); self.talk(who, t); self.say('Diteruskan ke ' + who, who); },
        stats: [
          {label:'Menunggu persetujuanmu', value:String(pend.length), note: pend.length ? 'paling lama 12 menit' : 'semua sudah beres'},
          {label:'Tugas selesai hari ini', value:String(77 + Math.floor(tick / 2) + doneCount), note:'oleh 6 anggota tim'},
          {label:'Perkiraan waktu dihemat', value:'± 3 jam', note:'dibanding dikerjakan manual'},
          {label:'Tagihan belum dibayar', value:'Rp 2,4 jt', note:'5 invoice · 2 lewat tempo'}
        ],
        pending: pend.map(function(id){ var d = DRAFTS[id];
          return { bot:BY[d.bot], botName:d.bot, kind:d.kind, title:d.title, meta:d.meta,
            open:function(){ self.open(d.bot); }, approve:function(){ self.decide(id, true); } }; }),
        feed: (s.feed || []).map(function(f){ return { who:f.who, text:f.text, time:f.time, cls:f.cls, isYou:!!f.you, isBot:!f.you, bot:BY[f.who] || BY.Oren }; }),
        week: [['Sen',86],['Sel',94],['Rab',77 + Math.floor(tick / 2) + doneCount],['Kam',0],['Jum',0],['Sab',0],['Min',0]].map(function(w, i){
          return { day:w[0], label:w[1] ? String(w[1]) : '', h: w[1] ? Math.round(Math.min(1, w[1] / 110) * 140) + 'px' : '6px',
            bg: i === 2 ? accent : w[1] ? '#1E1B2E' : '#E3E5EF', weight: i === 2 ? 700 : 500 }; }),
        bills: [
          {name:'Toko Sari', no:'INV-0043', amt:'Rp 1.124.000', status: verdict.a1 === 'ok' ? 'Terkirim' : 'Menunggu kamu', color: verdict.a1 === 'ok' ? '#5E5B70' : '#B4421F'},
          {name:'Dimas', no:'INV-0041', amt:'Rp 245.000', status:'Belum dibayar', color:'#5E5B70'},
          {name:'Bagas', no:'INV-0039', amt:'Rp 189.000', status:'Lewat 3 hari', color:'#B4421F'},
          {name:'Rina', no:'INV-0042', amt:'Rp 170.000', status:'Lunas', color:'#1E7A43'}
        ]
      });
    } else {
      var b = RAW[view], off = !!paused[view], st = status(view), big;
      if (off) big = mk(Object.assign({}, b, {closed:true, mouth:'sleep'}));
      else if (typing[view]) big = mk(Object.assign({}, b, {mouth:'focus', look:'translate(4 -4)'}));
      else big = mk(Object.assign({}, b, {mouth:'open', look:'translate(0 2)'}));
      Object.assign(out, {
        big: big,
        cur: Object.assign({}, face(b), {
          bio:b.bio, status:st[0], statusColor:st[1], anim: off ? '' : 'bob',
          doneToday:String(b.done + Object.keys(verdict).filter(function(id){ return DRAFTS[id].bot === view && verdict[id] === 'ok'; }).length),
          pendingN:String(waitBy[view] || 0), skills:b.skills, team:b.team,
          mates: b.mates.map(function(n){ return Object.assign({}, BY[n], { pick:function(){ self.open(n); } }); }),
          onStr: off ? 'false' : 'true', toggleLabel: (off ? 'Nyalakan ' : 'Hentikan sementara ') + view,
          toggleText: off ? 'Istirahat' : 'Aktif', trackColor: off ? '#C9CDE0' : '#1E1B2E', knobSide: off ? 'flex-start' : 'flex-end',
          toggle: function(){ var p = Object.assign({}, paused); p[view] = !off; self.setState({ paused:p }); self.say(off ? view + ' kembali bekerja' : view + ' istirahat dulu', view); }
        }),
        chips: b.chips.map(function(c){ return { label:c, pick:function(){ self.talk(view, c); } }; }),
        thread: (threads[view] || []).map(function(m){
          return { mine:m.from === 'you', theirs:m.from === 'bot', text:m.text, cls:m.cls, hasDraft:!!m.draft, card: m.draft ? cardFor(m.draft) : {fields:[]} };
        }),
        isTyping: !!typing[view],
        chatMsg: s.chatMsg || '',
        placeholder: 'Suruh atau tanya ' + view + '…',
        onChatMsg: function(e){ self.setState({ chatMsg:e.target.value }); },
        onChatKey: function(e){ if (e.key === 'Enter') self.talk(view, self.state.chatMsg); },
        sendChat: function(){ self.talk(view, self.state.chatMsg); }
      });
    }
    return out;
  }
}

</script>