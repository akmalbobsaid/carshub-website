// public/admin.js - Versi Lengkap dengan Toggle

document.addEventListener('DOMContentLoaded', () => {
    // Ambil elemen-elemen untuk toggle
    const bookingsToggle = document.getElementById('bookings-toggle');
    const verificationToggle = document.getElementById('verification-toggle');
    const bookingsView = document.getElementById('bookings-view');
    const verificationView = document.getElementById('verification-view');
    
    // Muat semua data saat halaman pertama kali dibuka, agar siap saat di-toggle
    fetchAllBookings();
    fetchPendingCars();

    // Event listener untuk tombol "Manajemen Pesanan"
    bookingsToggle.addEventListener('click', () => {
        // Atur kelas 'active' pada tombol
        bookingsToggle.classList.add('active');
        verificationToggle.classList.remove('active');

        // Tampilkan tabel pesanan dan sembunyikan tabel verifikasi
        bookingsView.classList.add('active');
        verificationView.classList.remove('active');
    });

    // Event listener untuk tombol "Verifikasi Mobil"
    verificationToggle.addEventListener('click', () => {
        // Atur kelas 'active' pada tombol
        verificationToggle.classList.add('active');
        bookingsToggle.classList.remove('active');

        // Tampilkan tabel verifikasi dan sembunyikan tabel pesanan
        verificationView.classList.add('active');
        bookingsView.classList.remove('active');
    });
});


// === FUNGSI-FUNGSI UNTUK MANAJEMEN PESANAN ===

// Fungsi untuk mengambil SEMUA data booking dari server
async function fetchAllBookings() {
    const tbody = document.getElementById('bookings-tbody');
    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) throw new Error('Gagal mengambil data pesanan.');
        
        const bookings = await response.json();
        tbody.innerHTML = ''; // Kosongkan tabel sebelum diisi
        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">Belum ada data pesanan.</td></tr>';
            return;
        }

        bookings.forEach(booking => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${booking.id_booking}</td>
                <td>${booking.nama_pelanggan}</td>
                <td>${booking.merk} ${booking.tipe}</td>
                <td>${new Date(booking.tanggal_mulai).toLocaleDateString('id-ID')}</td>
                <td>${new Date(booking.tanggal_selesai).toLocaleDateString('id-ID')}</td>
                <td>${booking.status_booking}</td>
                <td class="proof-cell"></td>
                <td class="actions-cell"></td>
            `;

            // Tampilkan link bukti pembayaran jika ada
            const proofCell = row.querySelector('.proof-cell');
            if (booking.bukti_pembayaran) {
                const correctedPath = booking.bukti_pembayaran.replace('public/', '');
                proofCell.innerHTML = `<a href="/${correctedPath}" target="_blank">Lihat Bukti</a>`;
            } else {
                proofCell.textContent = '-';
            }

            // Tambahkan tombol aksi berdasarkan status booking
            const actionsCell = row.querySelector('.actions-cell');
            if (booking.status_booking === 'menunggu pembayaran' && booking.bukti_pembayaran) {
                const verifyButton = document.createElement('button');
                verifyButton.textContent = 'Verifikasi Pembayaran';
                verifyButton.className = 'action-button btn-verify';
                verifyButton.onclick = () => confirmBooking(booking.id_booking, 'berlangsung', 'verifikasi pembayaran');
                actionsCell.appendChild(verifyButton);
            } else if (booking.status_booking === 'berlangsung') {
                const completeButton = document.createElement('button');
                completeButton.textContent = 'Selesaikan Pesanan';
                completeButton.className = 'action-button btn-complete';
                completeButton.onclick = () => confirmBooking(booking.id_booking, 'selesai', 'menyelesaikan pesanan');
                actionsCell.appendChild(completeButton);
            } else {
                actionsCell.textContent = '-';
            }
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8">Error: ${error.message}</td></tr>`;
    }
}

// Fungsi untuk menangani aksi konfirmasi booking (Berlangsung/Selesai)
async function confirmBooking(bookingId, newStatus, actionType) {
    if (!confirm(`Anda yakin ingin ${actionType} untuk pesanan #${bookingId}?`)) {
        return;
    }
    try {
        const response = await fetch('/api/booking/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_booking: bookingId, status: newStatus })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        alert(result.message);
        fetchAllBookings(); // Muat ulang data tabel pesanan
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}


// === FUNGSI-FUNGSI UNTUK VERIFIKASI MOBIL ===

// Fungsi untuk mengambil mobil yang menunggu verifikasi dari server
async function fetchPendingCars() {
    const tbody = document.getElementById('pending-cars-tbody');
    try {
        const response = await fetch('/api/pendaftaran-mobil/pending');
        const cars = await response.json();
        tbody.innerHTML = '';
        if (cars.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Tidak ada pendaftaran mobil baru yang menunggu verifikasi.</td></tr>';
            return;
        }

        cars.forEach(car => {
            const row = tbody.insertRow();
            const correctedPath = car.foto.replace('public/', '');
            row.innerHTML = `
                <td>${car.id_pendaftaran}</td>
                <td>${car.nama_supplier}</td>
                <td>${car.merk} ${car.tipe}</td>
                <td>${car.tahun}</td>
                <td>${new Intl.NumberFormat('id-ID').format(car.tarif_per_hari)}</td>
                <td><a href="/${correctedPath}" target="_blank">Lihat Foto</a></td>
                <td>
                    <button class="action-button btn-approve" onclick="handleVerification(${car.id_pendaftaran}, 'diterima')">Setujui</button>
                    <button class="action-button btn-reject" onclick="handleVerification(${car.id_pendaftaran}, 'ditolak')">Tolak</button>
                </td>
            `;
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">Gagal memuat data verifikasi: ${error.message}</td></tr>`;
    }
}

// Fungsi untuk menangani aksi verifikasi (Setujui/Tolak)
async function handleVerification(pendaftaranId, action) {
    let catatan = 'Disetujui oleh admin.';
    
    if (action === 'ditolak') {
        catatan = prompt("Harap masukkan alasan penolakan:");
        if (catatan === null || catatan.trim() === "") {
            alert("Aksi dibatalkan. Alasan penolakan tidak boleh kosong.");
            return;
        }
    } else {
        if (!confirm(`Anda yakin ingin MENYETUJUI pendaftaran mobil #${pendaftaranId}? Mobil akan langsung tersedia untuk disewa.`)) {
            return;
        }
    }

    try {
        const response = await fetch('/api/pendaftaran-mobil/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pendaftaran_id: pendaftaranId, action: action, catatan: catatan })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        alert(result.message);
        fetchPendingCars(); // Muat ulang daftar verifikasi
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
