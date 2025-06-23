// public/admin.js - Versi Baru dengan Pengecekan Login

document.addEventListener('DOMContentLoaded', () => {
    // Fungsi utama yang akan dijalankan HANYA SETELAH admin terverifikasi
    function initializeAdminDashboard() {
        // Ambil elemen-elemen dashboard
        const dashboardContent = document.getElementById('dashboard-content');
        const bookingsToggle = document.getElementById('bookings-toggle');
        const verificationToggle = document.getElementById('verification-toggle');
        const bookingsView = document.getElementById('bookings-view');
        const verificationView = document.getElementById('verification-view');

        // Tampilkan konten dashboard
        dashboardContent.style.display = 'block';

        // Muat data awal
        fetchAllBookings();
        fetchPendingCars();

        // Pasang event listener untuk tombol toggle
        bookingsToggle.addEventListener('click', () => {
            bookingsToggle.classList.add('active');
            verificationToggle.classList.remove('active');
            bookingsView.classList.add('active');
            verificationView.classList.remove('active');
        });

        verificationToggle.addEventListener('click', () => {
            verificationToggle.classList.add('active');
            bookingsToggle.classList.remove('active');
            verificationView.classList.add('active');
            bookingsView.classList.remove('active');
        });
    }

    // Tunggu dan periksa status login dari auth.js
    const checkAuthInterval = setInterval(() => {
        // window.currentUser disediakan oleh auth.js
        if (window.currentUser) {
            clearInterval(checkAuthInterval);
            if (window.currentUser.role === 'admin') {
                // Jika yang login adalah admin, jalankan dashboard
                initializeAdminDashboard();
            } else {
                // Jika yang login bukan admin, tolak akses
                alert('Akses ditolak. Hanya admin yang dapat mengakses halaman ini.');
                window.location.href = '/index.html';
            }
        } else if (window.currentUser === null) {
            // Jika auth.js sudah selesai dan hasilnya tidak ada yang login
            clearInterval(checkAuthInterval);
            // Biarkan halaman menampilkan form login saja, jangan lakukan apa-apa
            console.log("Menunggu admin untuk login...");
        }
    }, 100); // Cek setiap 100ms
});


// === FUNGSI-FUNGSI API (TIDAK BERUBAH, HANYA DIPANGGIL SETELAH LOGIN) ===

async function fetchAllBookings() {
    const tbody = document.getElementById('bookings-tbody');
    tbody.innerHTML = '<tr><td colspan="8">Memuat data pesanan...</td></tr>';
    try {
        const response = await fetch('/api/bookings');
        if (!response.ok) throw new Error('Gagal mengambil data pesanan.');
        const bookings = await response.json();
        tbody.innerHTML = '';
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
            const proofCell = row.querySelector('.proof-cell');
            if (booking.bukti_pembayaran) {
                proofCell.innerHTML = `<a href="/${booking.bukti_pembayaran}" target="_blank">Lihat Bukti</a>`;
            } else {
                proofCell.textContent = '-';
            }
            const actionsCell = row.querySelector('.actions-cell');
            if (booking.status_booking === 'menunggu verifikasi') {
                const button = document.createElement('button');
                button.textContent = 'Verifikasi Bayar';
                button.className = 'btn btn-info btn-sm';
                button.onclick = () => confirmBooking(booking.id_booking, 'berlangsung', 'verifikasi pembayaran');
                actionsCell.appendChild(button);
            } else if (booking.status_booking === 'berlangsung') {
                const button = document.createElement('button');
                button.textContent = 'Selesaikan';
                button.className = 'btn btn-success btn-sm';
                button.onclick = () => confirmBooking(booking.id_booking, 'selesai', 'menyelesaikan pesanan');
                actionsCell.appendChild(button);
            }
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="8">Error: ${error.message}</td></tr>`;
    }
}

async function confirmBooking(bookingId, newStatus, actionType) {
    if (!confirm(`Anda yakin ingin ${actionType} untuk pesanan #${bookingId}?`)) return;
    try {
        const response = await fetch('/api/booking/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_booking: bookingId, status: newStatus })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        alert(result.message);
        fetchAllBookings();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function fetchPendingCars() {
    const tbody = document.getElementById('pending-cars-tbody');
    tbody.innerHTML = '<tr><td colspan="7">Memuat data verifikasi...</td></tr>';
    try {
        const response = await fetch('/api/pendaftaran-mobil/pending');
        if (!response.ok) throw new Error('Gagal memuat data verifikasi.');
        const cars = await response.json();
        tbody.innerHTML = '';
        if (cars.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Tidak ada pendaftaran mobil baru.</td></tr>';
            return;
        }
        cars.forEach(car => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${car.id_pendaftaran}</td>
                <td>${car.nama_supplier}</td>
                <td>${car.merk} ${car.tipe}</td>
                <td>${car.tahun}</td>
                <td>${new Intl.NumberFormat('id-ID').format(car.tarif_per_hari)}</td>
                <td><a href="/${car.foto}" target="_blank">Lihat Foto</a></td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="handleVerification(${car.id_pendaftaran}, 'diterima')">Setujui</button>
                    <button class="btn btn-danger btn-sm" onclick="handleVerification(${car.id_pendaftaran}, 'ditolak')">Tolak</button>
                </td>
            `;
        });
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">Error: ${error.message}</td></tr>`;
    }
}

async function handleVerification(pendaftaranId, action) {
    let catatan = 'Disetujui oleh admin.';
    if (action === 'ditolak') {
        catatan = prompt("Masukkan alasan penolakan:");
        if (catatan === null || catatan.trim() === "") return alert("Aksi dibatalkan.");
    } else {
        if (!confirm(`Anda yakin ingin MENYETUJUI pendaftaran #${pendaftaranId}?`)) return;
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
        fetchPendingCars();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}