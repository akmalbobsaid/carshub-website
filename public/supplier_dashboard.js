document.addEventListener('DOMContentLoaded', () => {
    // PENTING: Karena belum ada sistem session, kita hardcode ID supplier.
    // Di aplikasi nyata, ID ini akan didapat dari data login dan disimpan.
    const supplierId = 1; // Ganti dengan ID supplier yang valid dari database Anda (contoh: Rental A)

    // Muat data awal saat halaman dibuka
    fetchMyCars(supplierId);

    // Event listener untuk form pendaftaran mobil
    const carForm = document.getElementById('car-registration-form');
    carForm.addEventListener('submit', (e) => handleCarRegistration(e, supplierId));

    // Event listener untuk form laporan komisi
    const reportForm = document.getElementById('report-form');
    reportForm.addEventListener('submit', (e) => handleReportGeneration(e, supplierId));
});

async function fetchMyCars(supplierId) {
    const tbody = document.getElementById('my-cars-tbody');
    try {
        const response = await fetch(`/api/supplier/mobil?supplierId=${supplierId}`);
        const cars = await response.json();
        
        tbody.innerHTML = '';
        if (cars.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Anda belum memiliki mobil terdaftar.</td></tr>';
            return;
        }

        cars.forEach(car => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${car.merk} ${car.tipe}</td>
                <td>${car.tahun}</td>
                <td>${new Intl.NumberFormat('id-ID').format(car.tarif_per_hari)}</td>
                <td>${car.status_mobil}</td>
                <td class="action-btn-group">
                    <button class="btn-edit" onclick="handleUpdateCar(${car.id_mobil})">Edit</button>
                    <button class="btn-delete" onclick="handleDeleteCar(${car.id_mobil}, '${car.merk} ${car.tipe}')">Hapus</button>
                </td>
            `;
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5">Gagal memuat data mobil: ${error.message}</td></tr>`;
    }
}

function handleUpdateCar(carId) {
    const newTariff = prompt("Masukkan tarif per hari yang baru (hanya angka):");
    if (newTariff && !isNaN(newTariff)) {
        fetch(`/api/mobil/${carId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tarif_per_hari: parseFloat(newTariff) })
        })
        .then(res => {
            if (!res.ok) throw new Error('Gagal memperbarui tarif.');
            return res.json();
        })
        .then(result => {
            alert(result.message);
            fetchMyCars(1); // Muat ulang daftar mobil (gunakan ID supplier yang sama)
        })
        .catch(error => alert(`Error: ${error.message}`));
    } else if (newTariff !== null) {
        alert("Harap masukkan angka yang valid.");
    }
}

function handleDeleteCar(carId, carName) {
    if (confirm(`Anda yakin ingin menghapus mobil ${carName}? Aksi ini tidak dapat dibatalkan.`)) {
        fetch(`/api/mobil/${carId}`, {
            method: 'DELETE'
        })
        .then(res => {
            if (!res.ok) throw new Error('Gagal menghapus mobil.');
            return res.json();
        })
        .then(result => {
            alert(result.message);
            fetchMyCars(1); // Muat ulang daftar mobil (gunakan ID supplier yang sama)
        })
        .catch(error => alert(`Error: ${error.message}`));
    }
}

// Fungsi untuk menangani pendaftaran mobil baru
async function handleCarRegistration(e) {
    e.preventDefault();
    
    // PENTING: Karena belum ada sistem session, kita hardcode ID supplier.
    // Di aplikasi nyata, ID ini akan didapat dari data login.
    const supplierId = 1; // Ganti dengan ID supplier yang valid dari database Anda (contoh: Rental A)

    const formData = new FormData();
    formData.append('id_supplier', supplierId);
    formData.append('merk', document.getElementById('merk').value);
    formData.append('tipe', document.getElementById('tipe').value);
    formData.append('tahun', document.getElementById('tahun').value);
    formData.append('tarif_per_hari', document.getElementById('tarif_per_hari').value);
    formData.append('foto', document.getElementById('foto').files[0]);

    try {
        const response = await fetch('/api/pendaftaran-mobil', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert('Mobil berhasil diajukan untuk verifikasi oleh admin!');
        e.target.reset(); // Kosongkan form setelah berhasil
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Fungsi untuk menangani pembuatan laporan
async function handleReportGeneration(e) {
    e.preventDefault();
    const year = document.getElementById('tahun-laporan').value;
    const tbody = document.getElementById('report-tbody');

    // Sama seperti di atas, ID supplier masih di-hardcode
    const supplierId = 1;

    try {
        const response = await fetch(`/api/laporan-komisi?year=${year}&supplierId=${supplierId}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        tbody.innerHTML = ''; // Kosongkan tabel
        if (result.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3">Tidak ada data komisi untuk tahun ${year}.</td></tr>`;
            return;
        }

        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        
        result.forEach(row => {
            const tableRow = tbody.insertRow();
            tableRow.innerHTML = `
                <td>${monthNames[row.bulan - 1]}</td>
                <td>${new Intl.NumberFormat('id-ID').format(row.total_komisi)}</td>
                <td>${row.jumlah_transaksi}</td>
            `;
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="3">Error: ${error.message}</td></tr>`;
    }
}
