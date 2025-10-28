import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, TrendingUp, Download, Trash2 } from "lucide-react";

interface ChipInfo {
  nama: string;
  chip: string;
  disc: number;
}

interface Laporan {
  tanggal: string;
  shift: string;
  petugas: string;
  produk: string;
  nama: string;
  chip: string;
  tipe: string;
  saldoAwal: number;
  penambahan: number;
  saldoAkhir: number;
  saldoAct: number;
  pemakaian: number;
  laba: number;
}

const teamData = [
  { nama: "Savitri", shift: "Shift 1" },
  { nama: "Rizal", shift: "Shift 1" },
  { nama: "Dira", shift: "Shift 1" },
  { nama: "Khodam", shift: "Shift 2" },
  { nama: "Rani", shift: "Shift 2" },
  { nama: "Ghinta", shift: "Shift 2" },
  { nama: "Imron", shift: "Shift 2" }
];

const chipData: Record<string, ChipInfo[]> = {
  ISAT: [
    { nama: "Jaya Cell 1", chip: "08561048630", disc: 2.2 },
    { nama: "Jaya Cell 2", chip: "085591101748", disc: 2.0 }
  ],
  THREE: [
    { nama: "Yukee Cell", chip: "89524324270", disc: 2.0 },
    { nama: "Abadi Cell", chip: "895338232420", disc: 1.8 }
  ],
  SMART: [
    { nama: "COR36RET31452", chip: "08811621764", disc: 1.0 },
    { nama: "JBE11812", chip: "628812138611", disc: 1.0 },
    { nama: "COR36RET29465", chip: "6288973797468", disc: 1.0 }
  ],
  AXIS: [
    { nama: "KBTG", chip: "083838900009", disc: 0.2 }
  ]
};

const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbx7kh9P9VhQxUc5qtURXUq-6ut7vwjV_pl619gAMmDzCvOMayy0Q-pDx2yeIQFoAX-8/exec";

const Index = () => {
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState("");
  const [petugas, setPetugas] = useState("");
  const [produk, setProduk] = useState("");
  const [selectedChip, setSelectedChip] = useState<ChipInfo | null>(null);
  const [tipe, setTipe] = useState("Saldo");
  const [saldoAwal, setSaldoAwal] = useState("");
  const [penambahan, setPenambahan] = useState("");
  const [saldoAkhir, setSaldoAkhir] = useState("");
  const [saldoAct, setSaldoAct] = useState("");
  const [filterProduk, setFilterProduk] = useState("all");
  const [isSaving, setIsSaving] = useState(false);

  const formatRupiah = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    return numeric ? parseInt(numeric).toLocaleString('id-ID') : '';
  };

  const getNumeric = (value: string) => {
    return parseInt(value.replace(/\D/g, '')) || 0;
  };

  const tampilRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const hitungPemakaianDanLaba = () => {
    const awal = getNumeric(saldoAwal);
    const tambah = getNumeric(penambahan);
    const akhir = getNumeric(saldoAkhir);
    
    const pemakaian = awal + tambah - akhir;
    let laba = 0;
    
    if (tipe === "Saldo") {
      if (produk === 'AXIS') {
        laba = (pemakaian * 0.2) / 100;
      } else if (selectedChip) {
        laba = (pemakaian * selectedChip.disc) / 100;
      }
    }
    
    return { pemakaian, laba };
  };

  const { pemakaian, laba } = hitungPemakaianDanLaba();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChip && produk) {
      toast.error("Pilih Nama & Chip terlebih dahulu");
      return;
    }

    setIsSaving(true);

    const laporan: Laporan = {
      tanggal,
      shift,
      petugas,
      produk,
      nama: selectedChip?.nama || '',
      chip: selectedChip?.chip || '',
      tipe,
      saldoAwal: getNumeric(saldoAwal),
      penambahan: getNumeric(penambahan),
      saldoAkhir: getNumeric(saldoAkhir),
      saldoAct: getNumeric(saldoAct),
      pemakaian,
      laba
    };
    
    try {
      const response = await fetch(GOOGLE_SHEETS_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(laporan)
      });

      // Dengan mode no-cors, response akan opaque, jadi kita anggap berhasil
      setLaporanList([...laporanList, laporan]);
      
      // Reset form
      setShift("");
      setPetugas("");
      setProduk("");
      setSelectedChip(null);
      setTipe("Saldo");
      setSaldoAwal("");
      setPenambahan("");
      setSaldoAkhir("");
      setSaldoAct("");
      setTanggal(new Date().toISOString().split('T')[0]);
      
      toast.success("Laporan berhasil disimpan!");
    } catch (err) {
      toast.error("Gagal menyimpan ke Google Spreadsheet");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const hapusLaporan = (index: number) => {
    const newList = [...laporanList];
    newList.splice(index, 1);
    setLaporanList(newList);
    toast.success("Laporan berhasil dihapus");
  };

  const exportCSV = () => {
    if (laporanList.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }
    
    let csv = 'Tanggal,Petugas,Shift,Produk,Nama,Chip,Tipe,Saldo Awal,Penambahan,Saldo Akhir,Saldo ACT,Pemakaian,Laba\n';
    laporanList.forEach(item => {
      csv += `${item.tanggal},${item.petugas},${item.shift},${item.produk},${item.nama},${item.chip},${item.tipe},${item.saldoAwal},${item.penambahan},${item.saldoAkhir},${item.saldoAct},${item.pemakaian},${item.laba}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-chip-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("File CSV berhasil diexport");
  };

  const filteredData = filterProduk && filterProduk !== "all"
    ? laporanList.filter(item => item.produk === filterProduk)
    : laporanList;

  const totalPemakaian = laporanList.reduce((sum, item) => sum + item.pemakaian, 0);
  const totalLaba = laporanList.reduce((sum, item) => sum + item.laba, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-primary/80 p-4 md:p-8">
      <div className="container max-w-7xl mx-auto">
        <header className="text-center text-white mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center gap-2">
            <ClipboardList className="w-8 h-8" />
            Sistem Laporan Chip
          </h1>
          <p className="text-white/90">Kelola laporan chip dengan mudah dan terorganisir</p>
        </header>
        
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form Input */}
          <Card className="lg:col-span-2 p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Laporan Chip
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input 
                  type="date" 
                  id="tanggal" 
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required 
                />
              </div>

              <div>
                <Label htmlFor="shift">Shift</Label>
                <Select value={shift} onValueChange={setShift} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shift 1">🌅 Shift 1</SelectItem>
                    <SelectItem value="Shift 2">🌙 Shift 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="petugas">Petugas</Label>
                <Select value={petugas} onValueChange={setPetugas} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Petugas" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamData.map((team) => (
                      <SelectItem key={team.nama} value={team.nama}>
                        {team.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="produk">Produk</Label>
                <Select value={produk} onValueChange={(value) => {
                  setProduk(value);
                  setSelectedChip(null);
                }} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Produk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ISAT">PRODUK ISAT</SelectItem>
                    <SelectItem value="THREE">PRODUK THREE</SelectItem>
                    <SelectItem value="SMART">PRODUK SMART</SelectItem>
                    <SelectItem value="AXIS">PRODUK AXIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {produk && (
                <div>
                  <Label htmlFor="namaChip">Nama & CHIP</Label>
                  <Select 
                    value={selectedChip ? JSON.stringify(selectedChip) : ""} 
                    onValueChange={(value) => setSelectedChip(JSON.parse(value))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Nama & Chip" />
                    </SelectTrigger>
                    <SelectContent>
                      {chipData[produk]?.map((chip) => (
                        <SelectItem key={chip.chip} value={JSON.stringify(chip)}>
                          {chip.nama} ({chip.chip})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedChip && (
                    <div className="mt-2 text-sm bg-yellow-50 text-yellow-800 px-3 py-1 rounded-full inline-block">
                      Discount: {selectedChip.disc}%
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <Label htmlFor="tipe">Tipe</Label>
                <Select value={tipe} onValueChange={setTipe} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Saldo">Saldo</SelectItem>
                    <SelectItem value="Komisi">Komisi</SelectItem>
                  </SelectContent>
                </Select>
                {tipe === "Komisi" && (
                  <div className="mt-2 text-xs bg-blue-50 text-blue-800 px-3 py-2 rounded-md border-l-4 border-blue-500">
                    ℹ️ Untuk tipe <strong>Komisi</strong>, tidak ada diskon. Laba akan selalu <strong>Rp 0</strong>.
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="saldoAwal">Saldo Awal (Rp)</Label>
                <Input 
                  type="text" 
                  id="saldoAwal" 
                  value={saldoAwal}
                  onChange={(e) => setSaldoAwal(formatRupiah(e.target.value))}
                  placeholder="Contoh: 1.000.000" 
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="penambahan">Penambahan (Rp)</Label>
                <Input 
                  type="text" 
                  id="penambahan" 
                  value={penambahan}
                  onChange={(e) => setPenambahan(formatRupiah(e.target.value))}
                  placeholder="Contoh: 500.000" 
                />
              </div>
              
              <div>
                <Label htmlFor="saldoAkhir">Saldo Akhir (Rp)</Label>
                <Input 
                  type="text" 
                  id="saldoAkhir" 
                  value={saldoAkhir}
                  onChange={(e) => setSaldoAkhir(formatRupiah(e.target.value))}
                  placeholder="Contoh: 300.000" 
                  required 
                />
              </div>
              
              {produk === 'AXIS' && (
                <div>
                  <Label htmlFor="saldoAct">Saldo ACT (Rp)</Label>
                  <Input 
                    type="text" 
                    id="saldoAct" 
                    value={saldoAct}
                    onChange={(e) => setSaldoAct(formatRupiah(e.target.value))}
                    placeholder="Contoh: 100.000" 
                  />
                </div>
              )}
              
              <Card className="bg-accent/20 border-accent p-4">
                <p className="text-sm font-medium text-foreground">Pemakaian: <span className="font-bold text-accent">{tampilRupiah(pemakaian)}</span></p>
                <p className="text-sm font-medium text-foreground">Laba: <span className="font-bold text-accent">{tampilRupiah(laba)}</span></p>
              </Card>
              
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "💾 Simpan Laporan"}
              </Button>
            </form>
          </Card>
          
          {/* Stats & History */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-accent to-accent/80 text-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Total Pemakaian</p>
                    <p className="text-2xl font-bold">{tampilRupiah(totalPemakaian)}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 opacity-80" />
                </div>
              </Card>
              
              <Card className="bg-gradient-to-br from-accent to-accent/80 text-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Total Laba</p>
                    <p className="text-2xl font-bold">{tampilRupiah(totalLaba)}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 opacity-80" />
                </div>
              </Card>
            </div>
            
            {/* History */}
            <Card className="p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">📊 History Laporan</h2>
                <div className="flex gap-2">
                  <Select value={filterProduk} onValueChange={setFilterProduk}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Semua Produk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Produk</SelectItem>
                      <SelectItem value="ISAT">PRODUK ISAT</SelectItem>
                      <SelectItem value="THREE">PRODUK THREE</SelectItem>
                      <SelectItem value="SMART">PRODUK SMART</SelectItem>
                      <SelectItem value="AXIS">PRODUK AXIS</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={exportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Tanggal</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Petugas</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Shift</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Produk</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Nama</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Tipe</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Pemakaian</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Laba</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-muted-foreground">
                          <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Belum ada laporan</p>
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3 text-sm">{item.petugas}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${item.shift === 'Shift 1' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                              {item.shift}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{item.produk}</td>
                          <td className="px-4 py-3 text-sm">{item.nama}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${item.tipe === 'Saldo' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                              {item.tipe}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{tampilRupiah(item.pemakaian)}</td>
                          <td className="px-4 py-3 text-sm font-medium">{tampilRupiah(item.laba)}</td>
                          <td className="px-4 py-3 text-sm">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => hapusLaporan(laporanList.indexOf(item))}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;