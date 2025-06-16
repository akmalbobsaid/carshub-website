// public/login.js - Versi yang Diperbaiki

document.addEventListener('DOMContentLoaded', () => {
    const customerToggle = document.getElementById('customer-toggle');
    const supplierToggle = document.getElementById('supplier-toggle');
    const loginForm = document.getElementById('login-form');
    const formTitle = document.getElementById('form-title');
    let userRole = 'pelanggan'; // Peran default adalah 'pelanggan'

    // Event listener untuk tombol toggle, untuk mengubah peran
    customerToggle.addEventListener('click', () => {
        userRole = 'pelanggan';
        formTitle.textContent = 'Login Pelanggan';
        customerToggle.classList.add('active');
        supplierToggle.classList.remove('active');
    });

    supplierToggle.addEventListener('click', () => {
        userRole = 'supplier';
        formTitle.textContent = 'Login Supplier';
        supplierToggle.classList.add('active');
        customerToggle.classList.remove('active');
    });

    // Event listener untuk form login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            role: userRole,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
        };
        
        try {
            // Kirim data login ke server
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!response.ok) {
                // Jika server mengembalikan error (misal: password salah), tampilkan pesannya
                throw new Error(result.message || 'Terjadi kesalahan.');
            }

            alert(result.message); // Tampilkan pesan "Login berhasil!"

            // === INI BAGIAN KUNCI YANG DIPERBAIKI ===
            // Periksa peran pengguna dari respons server
            if (result.user.role === 'supplier') {
                // Jika supplier, arahkan ke dasbor supplier
                window.location.href = 'supplier_dashboard.html';
            } else {
                // Jika bukan (berarti pelanggan), arahkan ke halaman utama
                window.location.href = 'index.html';
            }
            // =======================================

        } catch (error) {
            alert(`Login Gagal: ${error.message}`);
        }
    });
});
