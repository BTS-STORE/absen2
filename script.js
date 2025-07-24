// Menunggu DOM siap sebelum menjalankan skrip
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi awal
    updateWaktu();
    setInterval(updateWaktu, 1000); // Update waktu setiap detik
    muatData(); // Muat data dari Local Storage
    tampilkanSiswa();
    tampilkanHalaman('beranda');
});

// State aplikasi (data utama)
let state = {
    siswa: [],
    absensi: []
};

// =================================
// PENGELOLAAN DATA (LOCAL STORAGE)
// =================================
function simpanData() {
    localStorage.setItem('absensiData', JSON.stringify(state));
}

function muatData() {
    const data = localStorage.getItem('absensiData');
    if (data) {
        state = JSON.parse(data);
    }
}

// =================================
// FUNGSI UTAMA & TAMPILAN
// =================================

// Update jam, hari, tanggal
function updateWaktu() {
    const el = document.getElementById('waktu-sekarang');
    const now = new Date();
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const namaHari = hari[now.getDay()];
    const tanggal = now.toLocaleDateString('id-ID');
    const waktu = now.toLocaleTimeString('id-ID');
    el.innerHTML = `${namaHari}, ${tanggal} | ${waktu}`;
}

// Navigasi halaman
function tampilkanHalaman(idHalaman) {
    document.querySelectorAll('.halaman').forEach(h => h.style.display = 'none');
    document.getElementById(idHalaman).style.display = 'block';

    // Refresh data saat halaman ditampilkan
    if (idHalaman === 'data-siswa') tampilkanSiswa();
    if (idHalaman === 'absensi') perbaruiPilihanKelas('pilih-kelas-absen', tampilkanSiswaUntukAbsen);
    if (idHalaman === 'rekap') perbaruiPilihanKelas('pilih-kelas-rekap', tampilkanRekap);
}

// =================================
// MENU DATA SISWA
// =================================

function tampilkanSiswa() {
    const tbody = document.getElementById('tabel-siswa');
    tbody.innerHTML = ''; // Kosongkan tabel
    state.siswa.forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${s.nama}</td>
            <td>${s.nis}</td>
            <td>${s.kelas}</td>
            <td>
                <button onclick="editSiswa(${s.id})">✏️</button>
                <button onclick="hapusSiswa(${s.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function tampilkanFormSiswa(id = null) {
    const siswa = id ? state.siswa.find(s => s.id === id) : null;
    const nama = siswa ? siswa.nama : '';
    const nis = siswa ? siswa.nis : '';
    const kelas = siswa ? siswa.kelas : '';

    const namaBaru = prompt(`Masukkan Nama Siswa:`, nama);
    if (namaBaru === null) return; // Batal
    const nisBaru = prompt(`Masukkan NIS Siswa:`, nis);
    if (nisBaru === null) return;
    const kelasBaru = prompt(`Masukkan Kelas Siswa:`, kelas);
    if (kelasBaru === null) return;

    if (namaBaru && nisBaru && kelasBaru) {
        if (id) { // Edit
            const index = state.siswa.findIndex(s => s.id === id);
            state.siswa[index] = { ...state.siswa[index], nama: namaBaru, nis: nisBaru, kelas: kelasBaru };
        } else { // Tambah baru
            const idBaru = Date.now();
            state.siswa.push({ id: idBaru, nama: namaBaru, nis: nisBaru, kelas: kelasBaru });
        }
        simpanData();
        tampilkanSiswa();
    } else {
        alert('Semua data harus diisi!');
    }
}

function editSiswa(id) {
    tampilkanFormSiswa(id);
}

function hapusSiswa(id) {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
        state.siswa = state.siswa.filter(s => s.id !== id);
        simpanData();
        tampilkanSiswa();
    }
}

// =================================
// MENU ABSENSI
// =================================

function perbaruiPilihanKelas(selectId, callback) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="semua">Semua Kelas</option>';
    const kelasUnik = [...new Set(state.siswa.map(s => s.kelas))];
    kelasUnik.sort().forEach(k => {
        const option = document.createElement('option');
        option.value = k;
        option.textContent = k;
        select.appendChild(option);
    });
    if (callback) callback();
}

function tampilkanSiswaUntukAbsen() {
    const kelasTerpilih = document.getElementById('pilih-kelas-absen').value;
    const container = document.getElementById('daftar-absen-siswa');
    container.innerHTML = '';

    if (kelasTerpilih === "semua") return;

    const siswaDiKelas = state.siswa.filter(s => s.kelas === kelasTerpilih);
    siswaDiKelas.forEach(s => {
        const div = document.createElement('div');
        div.className = 'item-absen';
        div.innerHTML = `
            <span>${s.nama}</span>
            <div>
                <input type="radio" name="status-${s.id}" value="Hadir" id="hadir-${s.id}" checked> <label for="hadir-${s.id}">Hadir</label>
                <input type="radio" name="status-${s.id}" value="Izin" id="izin-${s.id}"> <label for="izin-${s.id}">Izin</label>
                <input type="radio" name="status-${s.id}" value="Sakit" id="sakit-${s.id}"> <label for="sakit-${s.id}">Sakit</label>
                <input type="radio" name="status-${s.id}" value="Alfa" id="alfa-${s.id}"> <label for="alfa-${s.id}">Alfa</label>
            </div>
        `;
        container.appendChild(div);
    });
}

function simpanAbsensi() {
    const tanggal = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const radios = document.querySelectorAll('#daftar-absen-siswa input[type="radio"]:checked');

    radios.forEach(radio => {
        const idSiswa = parseInt(radio.name.split('-')[1]);
        const status = radio.value;
        const siswa = state.siswa.find(s => s.id === idSiswa);

        // Hapus absensi hari ini untuk siswa ini jika sudah ada (mencegah duplikat)
        state.absensi = state.absensi.filter(a => !(a.idSiswa === idSiswa && a.tanggal === tanggal));

        // Tambahkan data absensi baru
        state.absensi.push({
            idSiswa: idSiswa,
            nama: siswa.nama,
            kelas: siswa.kelas,
            tanggal: tanggal,
            status: status
        });
    });

    simpanData();
    alert('Absensi berhasil disimpan!');
    tampilkanHalaman('rekap');
}

// =================================
// MENU REKAP & EKSPOR
// =================================

function tampilkanRekap() {
    const kelasFilter = document.getElementById('pilih-kelas-rekap').value;
    const tbody = document.getElementById('data-rekap');
    tbody.innerHTML = '';

    let dataFilter = state.absensi;
    if (kelasFilter !== 'semua') {
        dataFilter = state.absensi.filter(a => a.kelas === kelasFilter);
    }

    dataFilter.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)).forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(a.tanggal).toLocaleDateString('id-ID')}</td>
            <td>${a.nama}</td>
            <td>${a.kelas}</td>
            <td>${a.status}</td>
        `;
        tbody.appendChild(tr);
    });
}

function eksporKeExcel() {
    const ws = XLSX.utils.table_to_sheet(document.getElementById('tabel-rekap'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');
    XLSX.writeFile(wb, 'rekap_absensi.xlsx');
}

function eksporKePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.autoTable({ html: '#tabel-rekap' });
    doc.save('rekap_absensi.pdf');
}