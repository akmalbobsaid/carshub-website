// public/pembayaran.js
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');

    if (!bookingId) {
        document.getElementById('payment-details').innerHTML = '<h2>Error: ID Booking tidak ditemukan.</h2>';
        return;
    }

    fetchBookingDetails(bookingId);

    const paymentForm = document.getElementById('payment-form');
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handlePayment(bookingId);
    });
});

async function fetchBookingDetails(id) {
    const summaryContainer = document.getElementById('booking-summary');
    try {
        const response = await fetch(`/api/booking/${id}`);
        if (!response.ok) throw new Error('Gagal memuat detail booking.');
        const booking = await response.json();

        summaryContainer.innerHTML = `
            <p><strong>ID Pesanan:</strong> ${booking.id_booking}</p>
            <p><strong>Mobil:</strong> ${booking.merk} ${booking.tipe}</p>
            <p><strong>Total Tagihan:</strong> <span style="font-weight: bold; color: #007bff;">Rp ${new Intl.NumberFormat('id-ID').format(booking.total_biaya)}</span></p>
        `;
    } catch (error) {
        summaryContainer.innerHTML = `<p>${error.message}</p>`;
    }
}

async function handlePayment(bookingId) {
    const form = document.getElementById('payment-form');
    const fileInput = document.getElementById('bukti_pembayaran');
    
    if (fileInput.files.length === 0) {
        alert('Mohon pilih file bukti pembayaran.');
        return;
    }

    // Menggunakan FormData untuk mengirim file dan data teks
    const formData = new FormData();
    formData.append('id_booking', bookingId);
    formData.append('bukti_pembayaran', fileInput.files[0]);

    try {
        const response = await fetch('/api/pembayaran', {
            method: 'POST',
            body: formData // Tidak perlu 'Content-Type' header, browser akan menentukannya
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert(result.message);
        window.location.href = 'index.html'; // Arahkan ke halaman utama setelah berhasil

    } catch (error) {
        console.error('Gagal memproses pembayaran:', error);
        alert(`Error: ${error.message}`);
    }
}