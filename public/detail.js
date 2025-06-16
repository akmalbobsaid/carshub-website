// public/detail.js

document.addEventListener('DOMContentLoaded', () => {
    // Ambil ID mobil dari URL
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (carId) {
        fetchCarDetails(carId);
    }

    // Tambahkan event listener untuk form booking
    const bookingForm = document.getElementById('booking-form');
    bookingForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Mencegah form reload halaman
        handleBooking(carId);
    });
});

// FUNGSI UNTUK MENGAMBIL DETAIL MOBIL
async function fetchCarDetails(id) {
    const container = document.getElementById('car-detail-container');
    try {
        const response = await fetch(`/api/mobil/${id}`); // Panggil API baru yang akan kita buat
        if (!response.ok) {
            throw new Error('Mobil tidak ditemukan');
        }
        const car = await response.json();

        container.innerHTML = `
            <div class="car-card" style="max-width: 600px; margin: auto;">
                <img src="${car.foto || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${car.merk} ${car.tipe}">
                <div class="car-card-content">
                    <h3>${car.merk} ${car.tipe}</h3>
                    <p><strong>Tahun:</strong> ${car.tahun}</p>
                    <p><strong>Status:</strong> ${car.status_mobil}</p>
                </div>
                <div class="car-card-footer">
                    <span>Rp ${new Intl.NumberFormat('id-ID').format(car.tarif_per_hari)} / hari</span>
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// FUNGSI UNTUK MENGIRIM DATA BOOKING
// public/detail.js (versi BARU)
async function handleBooking(carId) {
    const tanggal_mulai = document.getElementById('tanggal_mulai').value;
    const tanggal_selesai = document.getElementById('tanggal_selesai').value;
    const nik_pelanggan = '1234567890123456';

    if (!tanggal_mulai || !tanggal_selesai) {
        alert('Harap isi kedua tanggal!');
        return;
    }

    try {
        const response = await fetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nik: nik_pelanggan, id_mobil: carId, tanggal_mulai: tanggal_mulai, tanggal_selesai: tanggal_selesai }),
        });
        const result = await response.json();

        if (response.ok) {
            // Arahkan ke halaman pembayaran dengan ID booking yang baru
            alert("Booking berhasil! Anda akan diarahkan ke halaman pembayaran.");
            window.location.href = `pembayaran.html?bookingId=${result.bookingId}`;
        } else {
            throw new Error(result.message || 'Gagal melakukan booking.');
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}