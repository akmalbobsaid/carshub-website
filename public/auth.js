// public/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const authLinks = document.getElementById('auth-links');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');

    // Cek apakah elemen ada sebelum digunakan
    if (!authLinks || !userInfo || !userName || !logoutButton) {
        console.error('Elemen otentikasi tidak ditemukan di halaman ini.');
        return;
    }

    fetch('/api/session')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn && data.user) {
                // Pengguna sudah login
                authLinks.style.display = 'none';
                userInfo.style.display = 'flex'; // Gunakan flex untuk alignment yang baik
                userName.textContent = data.user.nama;

                // Simpan data user di window object agar bisa diakses script lain
                window.currentUser = data.user;

            } else {
                // Pengguna belum login
                authLinks.style.display = 'flex';
                userInfo.style.display = 'none';
                window.currentUser = null;
            }
        })
        .catch(err => {
            console.error('Error memeriksa sesi:', err);
            authLinks.style.display = 'flex';
            userInfo.style.display = 'none';
            window.currentUser = null;
        });

    logoutButton.addEventListener('click', () => {
        fetch('/logout', { method: 'POST' })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.currentUser = null;
                    window.location.href = '/index.html'; // Arahkan ke halaman utama
                } else {
                    alert('Logout gagal.');
                }
            })
            .catch(err => console.error('Logout error:', err));
    });
});