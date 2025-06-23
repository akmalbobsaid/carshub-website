// public/supplier_dashboard.js
document.addEventListener('DOMContentLoaded', function () {
    const addCarForm = document.getElementById('add-car-form');
    const supplierCarsTableBody = document.querySelector('#supplier-cars-table tbody');

    // Fungsi untuk memuat mobil milik supplier
    function loadSupplierCars() {
        // API sekarang tidak memerlukan ID di URL, karena diambil dari sesi
        fetch('/api/supplier/mobil')
            .then(response => response.json())
            .then(cars => {
                supplierCarsTableBody.innerHTML = ''; // Kosongkan tabel dulu
                if (cars.length === 0) {
                    supplierCarsTableBody.innerHTML = '<tr><td colspan="5">Anda belum memiliki mobil.</td></tr>';
                    return;
                }
                cars.forEach(car => {
                    const row = `
                        <tr>
                            <td>${car.id_mobil}</td>
                            <td>${car.merk}</td>
                            <td>${car.tipe}</td>
                            <td>${car.status_mobil}</td>
                            <td>Rp ${new Intl.NumberFormat('id-ID').format(car.tarif_per_hari)}</td>
                        </tr>
                    `;
                    supplierCarsTableBody.innerHTML += row;
                });
            })
            .catch(error => console.error('Error memuat mobil supplier:', error));
    }

    // Event listener untuk form pendaftaran mobil
    if (addCarForm) {
        addCarForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // ID supplier tidak perlu lagi di-hardcode, karena server mengambilnya dari sesi
            const formData = new FormData(this);

            fetch('/api/pendaftaran_mobil', {
                method: 'POST',
                body: formData
            })
                .then(response => response.text())
                .then(message => {
                    alert(message);
                    addCarForm.reset();
                    // Tidak perlu load ulang mobil di sini karena mobil baru harus diverifikasi dulu
                })
                .catch(error => {
                    console.error('Error mendaftarkan mobil:', error);
                    alert('Gagal mendaftarkan mobil.');
                });
        });
    }

    // Panggil fungsi untuk memuat mobil saat halaman dimuat
    // Pastikan currentUser sudah ada dari auth.js
    const checkUserInterval = setInterval(() => {
        if (window.currentUser) {
            clearInterval(checkUserInterval);
            if (window.currentUser.role === 'supplier') {
                loadSupplierCars();
            }
        }
    }, 100);
});