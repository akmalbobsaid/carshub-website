// public/supplier_dashboard.js - Versi Final

document.addEventListener('DOMContentLoaded', function () {
    // === Elemen DOM ===
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    const burgerMenu = document.getElementById('burger-menu');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content'); // Ambil elemen konten utama
    const userNameDisplay = document.getElementById('user-name-display');
    const logoutLink = document.getElementById('logout-link');

    // Form
    const carRegistrationForm = document.getElementById('car-registration-form');
    const reportForm = document.getElementById('report-form');

    // Tabel
    // PERBAIKAN: Menggunakan ID yang benar dari HTML: 'my-cars-tbody'
    const myCarsTbody = document.getElementById('my-cars-tbody');
    const reportTbody = document.getElementById('report-tbody');

    // === Logika Navigasi Sidebar ===
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            contentSections.forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('open');
            }
        });
    });

    // === Logika Burger Menu (DISEMPURNAKAN) ===
    burgerMenu.addEventListener('click', (e) => {
        e.stopPropagation(); // Mencegah event klik menyebar ke document
        sidebar.classList.toggle('open');
    });

    // Menutup sidebar saat mengklik area di luar
    mainContent.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // === Logika Data & Form ===

    async function loadSupplierCars() {
        try {
            const response = await fetch('/api/supplier/mobil'); // Alamat ini sekarang sudah benar
            if (!response.ok) throw new Error('Gagal memuat data mobil.');

            const cars = await response.json();
            myCarsTbody.innerHTML = '';

            if (cars.length === 0) {
                myCarsTbody.innerHTML = '<tr><td colspan="5">Anda belum memiliki mobil yang terdaftar.</td></tr>';
                return;
            }

            cars.forEach(car => {
                const row = myCarsTbody.insertRow();
                row.innerHTML = `
                    <td>${car.merk} ${car.tipe}</td>
                    <td>${car.tahun}</td>
                    <td>${new Intl.NumberFormat('id-ID').format(car.tarif_per_hari)}</td>
                    <td><span class="status-${car.status_mobil.replace(' ', '-')}">${car.status_mobil}</span></td>
                    <td>
                        <button class="btn btn-info btn-sm">Edit</button>
                        <button class="btn btn-danger btn-sm">Hapus</button>
                    </td>
                `;
            });
        } catch (error) {
            console.error('Error memuat mobil supplier:', error);
            myCarsTbody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
        }
    }

    carRegistrationForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const submitButton = this.querySelector('button');
        submitButton.textContent = 'Mengajukan...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/pendaftaran_mobil', { method: 'POST', body: formData });
            const message = await response.text();
            if (!response.ok) throw new Error(message);
            alert(message);
            carRegistrationForm.reset();
        } catch (error) {
            alert(`Gagal: ${error.message}`);
        } finally {
            submitButton.textContent = 'Ajukan Pendaftaran';
            submitButton.disabled = false;
        }
    });

    reportForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const year = document.getElementById('tahun-laporan').value;
        reportTbody.innerHTML = '<tr><td colspan="3">Memuat laporan...</td></tr>';

        try {
            const response = await fetch(`/api/supplier/reports?year=${year}`);
            if (!response.ok) throw new Error('Gagal mengambil data laporan.');
            const reports = await response.json();
            reportTbody.innerHTML = '';

            if (reports.length === 0) {
                reportTbody.innerHTML = `<tr><td colspan="3">Tidak ada data komisi untuk tahun ${year}.</td></tr>`;
                return;
            }
            reports.forEach(report => {
                const monthName = new Date(year, report.bulan - 1).toLocaleString('id-ID', { month: 'long' });
                const row = reportTbody.insertRow();
                row.innerHTML = `
                    <td>${monthName}</td>
                    <td>${new Intl.NumberFormat('id-ID').format(report.total_komisi)}</td>
                    <td>${report.jumlah_transaksi}</td>
                `;
            });
        } catch (error) {
            reportTbody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
        }
    });

    const checkUserInterval = setInterval(() => {
        if (window.currentUser) {
            clearInterval(checkUserInterval);
            if (window.currentUser.role === 'supplier') {
                userNameDisplay.textContent = window.currentUser.nama;
                loadSupplierCars();
            } else {
                alert('Akses ditolak. Anda bukan supplier.');
                window.location.href = 'login.html';
            }
        }
    }, 100);

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        fetch('/logout', { method: 'POST' }).finally(() => window.location.href = '/index.html');
    });
});