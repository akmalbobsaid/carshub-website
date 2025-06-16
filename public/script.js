document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayCars();
});

async function fetchAndDisplayCars() {
    const carsContainer = document.getElementById('cars-container');
    
    try {
        // Panggil API backend yang kita buat di server.js
        const response = await fetch('http://localhost:3000/api/mobil');
        const cars = await response.json();

        // Kosongkan container jika ada konten lama
        carsContainer.innerHTML = '';

        if (cars.length === 0) {
            carsContainer.innerHTML = '<p>Maaf, saat ini tidak ada mobil yang tersedia.</p>';
            return;
        }

        // Loop melalui setiap data mobil dan buat card HTML-nya
        cars.forEach(car => {
            // Buat elemen link
            const link = document.createElement('a');
            link.href = `detail.html?id=${car.id_mobil}`; // Link ke halaman detail dengan ID mobil
            link.style.textDecoration = 'none'; // Hapus garis bawah link
            link.style.color = 'inherit'; // Warisi warna teks

            const carCard = document.createElement('div');
            carCard.className = 'car-card';

            carCard.innerHTML = `
                <img src="${car.foto || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${car.merk} ${car.tipe}">
                <div class="car-card-content">
                    <h3>${car.merk} ${car.tipe}</h3>
                    <p>Tahun: ${car.tahun}</p>
                </div>
                <div class="car-card-footer">
                    <span>Rp ${new Intl.NumberFormat('id-ID').format(car.tarif_per_hari)} / hari</span>
                </div>
            `;
            // Masukkan carCard ke dalam link, lalu link ke container
            link.appendChild(carCard);
            carsContainer.appendChild(link);
        });


    } catch (error) {
        console.error('Error fetching cars:', error);
        carsContainer.innerHTML = '<p>Gagal memuat data mobil. Coba lagi nanti.</p>';
    }
}