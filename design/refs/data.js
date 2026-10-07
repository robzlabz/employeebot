
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
  o:{d:'M-5 18 a5 6 0 1 0 10 0 a5 6 0 1 0 -10 0 Z',fill:'#1E1B2E',sw:0}
};
function mk(o){
  var s = SH[o.shape], m = MO[o.mouth || 'smile'], y = s.foot - 3;
  return Object.assign({}, o, {
    d:s.d, sw:s.sw, face:s.face, hasFeet:!!s.foot,
    feet:'M70 '+y+' a12 8 0 1 0 24 0 a12 8 0 1 0 -24 0 Z M106 '+y+' a12 8 0 1 0 24 0 a12 8 0 1 0 -24 0 Z',
    mouth:m.d, mouthFill:m.fill, mouthSw:m.sw, look:o.look || 'translate(0 0)', delay:o.delay || '0s'
  });
}
var CREW = [
  {name:'Oren', role:'Tukang invoice', shape:'kacang', color:'#F28C4E', feetColor:'#D9692A', tint:'#FDE7DA', mouth:'focus', look:'translate(2 3)', delay:'0s',
    bio:'Bikin invoice dari data pesanan, kirim ke pelanggan, lalu menagih dengan sopan kalau sudah lewat jatuh tempo.',
    acts:['Membuat invoice INV-0042','Menghitung diskon dan pajak','Mengirim invoice ke pelanggan']},
  {name:'Biru', role:'Penjaga WhatsApp', shape:'hantu', color:'#2E9BEF', feetColor:'#1B7AC7', tint:'#DCEEFD', mouth:'open', look:'translate(-2 2)', delay:'.4s',
    bio:'Membalas pertanyaan yang itu-itu saja: ongkir, status pesanan, stok, jam buka, dan nomor rekening.',
    acts:['Membalas “Kak, ongkir ke Bandung?”','Mengirim nomor resi ke pelanggan','Membalas “Masih ready, Kak?”']},
  {name:'Lila', role:'Pengatur jadwal', shape:'gumpal', color:'#A77DC9', feetColor:'#8459AB', tint:'#EEE5F7', mouth:'smile', look:'translate(3 -2)', delay:'.8s',
    bio:'Mencari slot kosong, mengirim undangan rapat, dan mengingatkan tenggat sehari sebelumnya.',
    acts:['Menjadwalkan rapat Kamis 10.00','Mengirim undangan kalender','Mengingatkan tenggat pembayaran']},
  {name:'Ijo', role:'Juru rekap', shape:'mochi', color:'#4DBB72', feetColor:'#34985A', tint:'#DFF3E6', mouth:'focus', look:'translate(0 3)', delay:'1.2s',
    bio:'Memindahkan data pesanan ke spreadsheet, memperbarui stok, dan menyusun rekap mingguan.',
    acts:['Mencatat pesanan baru','Memperbarui sisa stok','Menyusun rekap mingguan']},
  {name:'Pinky', role:'Pengarsip', shape:'awan', color:'#F59ABF', feetColor:'#E07199', tint:'#FDE6EF', mouth:'w', look:'translate(-3 1)', delay:'1.6s',
    bio:'Merapikan nama file, memilah dokumen, dan menyimpan bukti transfer ke folder yang benar.',
    acts:['Mengganti nama scan_0193.pdf','Memindahkan kuitansi ke folder Oktober','Menyimpan bukti transfer']},
  {name:'Kunyit', role:'Pembalas email', shape:'tetes', color:'#FFC21A', feetColor:'#DDA000', tint:'#FFF3CC', mouth:'smile', look:'translate(2 1)', delay:'2s',
    bio:'Memilah inbox, menandai email penting, dan menyiapkan draf balasan untuk kamu periksa.',
    acts:['Memilah email masuk','Menandai email penting','Menyiapkan draf balasan']}
].map(mk);
var BY = {}; CREW.forEach(function(b){ BY[b.name] = b; });
var FEED = ['Oren mengirim INV-0041','Biru membalas 8 chat','Pinky merapikan 14 file','Lila memasang pengingat rapat','Ijo memperbarui rekap','Kunyit menyiapkan 3 draf balasan'];
var TABS = [
  {id:'inv', label:'Bikin invoice', tint:'#FDE7DA', steps:[['Ijo','Mengambil data pesanan dari rekap'],['Oren','Mengisi invoice dan menghitung total'],['Lila','Memasang pengingat jatuh tempo'],['Kunyit','Menyiapkan email pengantar invoice']]},
  {id:'wa', label:'Balas WhatsApp', tint:'#DCEEFD', steps:[['Biru','Membaca pertanyaan dan menyiapkan balasan'],['Ijo','Mengecek status pesanan dan nomor resi'],['Biru','Mengirim balasan sesuai gaya bahasamu']]},
  {id:'rekap', label:'Rekap pesanan', tint:'#DFF3E6', steps:[['Biru','Meneruskan pesanan dari chat'],['Ijo','Mencatat ke spreadsheet dan menandai yang belum lunas'],['Oren','Menagih pesanan yang belum dibayar']]},
  {id:'arsip', label:'Rapikan file', tint:'#FDE6EF', steps:[['Pinky','Membaca isi dokumen yang baru masuk'],['Pinky','Memberi nama yang jelas dan memindahkan ke folder'],['Ijo','Menautkan bukti bayar ke baris rekap']]}
];
class Component extends DCLogic {
  componentDidMount() {
    var self = this;
    this.timer = setInterval(function(){ self.setState({ tick: (self.state && self.state.tick || 0) + 1 }); }, 2400);
  }
  componentWillUnmount() { clearInterval(this.timer); }
  renderVals() {
    var self = this, s = this.state || {}, tick = s.tick || 0, tab = s.tab || 'inv';
    var animate = this.props.animate !== false;
    var cur = TABS.filter(function(t){ return t.id === tab; })[0];
    var crew = CREW.map(function(b, i){ return Object.assign({}, b, { act: b.acts[(tick + i) % b.acts.length] }); });
    var feed = [0,1,2].map(function(k){ return { text: FEED[(tick + FEED.length - k) % FEED.length], when: ['baru saja','1 menit lalu','3 menit lalu'][k] }; });
    return {
      accent: this.props.accent || '#1F7FD6',
      rootClass: animate ? '' : 'still',
      logo: mk({shape:'kacang', color:'#F28C4E', feetColor:'#D9692A', mouth:'open'}),
      crew: crew, feed: feed,
      flow: [
        {n:1, isBot:true, isYou:false, bot:BY.Biru, title:'Pesanan masuk', text:'Biru membalas pelanggan di WhatsApp dan mengonfirmasi pesanan.'},
        {n:2, isBot:true, isYou:false, bot:BY.Ijo, title:'Dicatat', text:'Ijo memasukkan pesanan ke spreadsheet dan mengurangi stok.'},
        {n:3, isBot:true, isYou:false, bot:BY.Oren, title:'Invoice dibuat', text:'Oren menyusun invoice dari data yang dicatat Ijo.'},
        {n:4, isBot:false, isYou:true, bot:BY.Oren, title:'Kamu setujui', text:'Satu ketukan untuk memeriksa dan mengirim.'},
        {n:5, isBot:true, isYou:false, bot:BY.Lila, title:'Diingatkan', text:'Lila memasang pengingat sebelum jatuh tempo.'},
        {n:6, isBot:true, isYou:false, bot:BY.Pinky, title:'Diarsipkan', text:'Pinky menyimpan invoice dan bukti bayar ke foldernya.'}
      ],
      tabs: TABS.map(function(t){
        var on = t.id === tab;
        return { label: t.label, pick: function(){ self.setState({ tab: t.id }); },
          style: 'min-height: 44px; padding: 10px 20px; border-radius: 999px; font: inherit; font-weight: 600; cursor: pointer; border: 2px solid #1E1B2E; ' + (on ? 'background: #1E1B2E; color: #FFFFFF' : 'background: #FFFFFF; color: #1E1B2E') };
      }),
      panelTint: cur.tint,
      isInv: tab === 'inv', isWa: tab === 'wa', isRekap: tab === 'rekap', isArsip: tab === 'arsip',
      steps: cur.steps.map(function(p){ return { bot: BY[p[0]], who: p[0], text: p[1] }; }),
      rows: [
        ['6 Okt','Rina','Kaos hitam L ×2','Rp 170.000','Lunas'],
        ['6 Okt','Dimas','Hoodie abu M','Rp 245.000','Belum'],
        ['7 Okt','Toko Sari','Kaos polos ×10','Rp 1.124.000','Lunas'],
        ['7 Okt','Ayu','Totebag kanvas','Rp 65.000','Lunas'],
        ['7 Okt','Bagas','Kemeja flanel L','Rp 189.000','Belum']
      ].map(function(r){ return { tgl:r[0], nama:r[1], barang:r[2], total:r[3], status:r[4],
        style: r[4] === 'Lunas' ? 'color: #1E7A43; font-weight: 600' : 'color: #B4421F; font-weight: 600' }; }),
      files: [
        {from:'scan_0193.pdf', to:'2026-10-07_Invoice_INV-0042.pdf'},
        {from:'IMG_20261006_1422.jpg', to:'2026-10-06_BuktiTransfer_Rina.jpg'},
        {from:'Document (3).pdf', to:'2026-10-05_Kontrak_TokoSari.pdf'},
        {from:'WhatsApp Image 2026-10-07.jpeg', to:'2026-10-07_BuktiTransfer_Ayu.jpeg'}
      ]
    };
  }
}
