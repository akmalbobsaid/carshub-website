// public/auth.js - Versi Fleksibel (Pastikan Anda menggunakan ini)
document.addEventListener('DOMContentLoaded', () => {
    // Ambil semua kemungkinan elemen
    const authLinks = document.getElementById('auth-links');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');

    // Elemen spesifik untuk halaman admin
    const adminLoginContainer = document.getElementById('admin-login-container');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminUserInfo = document.getElementById('admin-user-info');
    const adminName = document.getElementById('admin-name');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    // Cek sesi
    fetch('/api/session')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn && data.user) {
                window.currentUser = data.user;
                // Halaman Biasa
                if (authLinks) authLinks.style.display = 'none';
                if (userInfo) userInfo.style.display = 'flex';
                if (userName) userName.textContent = data.user.nama;
                // Halaman Admin
                if (adminLoginContainer) adminLoginContainer.style.display = 'none';
                if (adminUserInfo) adminUserInfo.style.display = 'flex';
                if (adminName) adminName.textContent = data.user.nama;
            } else {
                window.currentUser = null;
                // Halaman Biasa
                if (authLinks) authLinks.style.display = 'flex';
                if (userInfo) userInfo.style.display = 'none';
                // Halaman Admin
                if (adminLoginContainer) adminLoginContainer.style.display = 'block';
                if (adminUserInfo) adminUserInfo.style.display = 'none';
            }
        });

    // Event handler untuk form login admin
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            const role = document.getElementById('admin-role').value;

            fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert('Login admin berhasil!');
                        window.location.reload(); // Muat ulang halaman untuk memicu dashboard
                    } else {
                        alert('Login gagal: ' + data.message);
                    }
                });
        });
    }

    // Event handler untuk logout
    const handleLogout = () => {
        fetch('/logout', { method: 'POST' }).finally(() => window.location.href = '/index.html');
    };
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleLogout);
});