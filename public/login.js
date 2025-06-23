// login.js - Versi Anda yang sudah disempurnakan dengan sedikit modifikasi

document.addEventListener('DOMContentLoaded', () => {
    // Bagian ini tidak perlu diubah sama sekali, semua elemen dan variabel Anda sudah bagus
    const customerToggle = document.getElementById('customer-toggle');
    const supplierToggle = document.getElementById('supplier-toggle');
    const loginForm = document.getElementById('login-form');
    const formTitle = document.getElementById('form-title');
    const roleIndicator = document.getElementById('role-indicator');
    const submitBtn = loginForm.querySelector('.submit-btn');

    // **MODIFIKASI 1: Tambahkan 'admin' sebagai role default jika diperlukan, atau pastikan UI Anda bisa memilihnya**
    // Jika halaman login Anda juga untuk admin, Anda perlu cara untuk memilih role 'admin'.
    // Untuk saat ini, kita asumsikan role 'admin' bisa dipilih dari UI yang terpisah atau URL khusus.
    // Kode di bawah ini saya biarkan seperti milik Anda.
    let userRole = 'pelanggan'; // Default role
    let isLoading = false;

    // ... (Semua fungsi Anda dari initializeUIEnhancements hingga validateForm tidak perlu diubah) ...
    initializeUIEnhancements();

    customerToggle.addEventListener('click', () => {
        if (isLoading) return;
        userRole = 'pelanggan';
        updateUI('pelanggan');
        animateToggle(customerToggle, supplierToggle);
    });

    supplierToggle.addEventListener('click', () => {
        if (isLoading) return;
        userRole = 'supplier';
        updateUI('supplier');
        animateToggle(supplierToggle, customerToggle);
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isLoading) return;
        const formData = getFormData();
        if (!validateForm(formData)) {
            return;
        }
        await handleLogin(formData);
    });

    function updateUI(role) {
        // ... kode Anda tidak berubah ...
        const isCustomer = role === 'pelanggan';
        formTitle.textContent = isCustomer ? 'Masuk sebagai Pelanggan' : 'Masuk sebagai Supplier';
        roleIndicator.textContent = isCustomer ? 'Pelanggan' : 'Supplier';
        loginForm.setAttribute('data-role', role);
    }

    function animateToggle(activeBtn, inactiveBtn) {
        // ... kode Anda tidak berubah ...
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
        createRippleEffect(activeBtn);
    }

    function getFormData() {
        // ... kode Anda tidak berubah ...
        // Penting: pastikan 'userRole' bisa diatur menjadi 'admin' jika diperlukan
        return {
            role: userRole,
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
        };
    }

    function validateForm(data) {
        // ... kode Anda tidak berubah, sudah sangat baik ...
        const errors = [];
        if (!data.email) {
            errors.push('Email tidak boleh kosong');
        } else if (!isValidEmail(data.email)) {
            errors.push('Format email tidak valid');
        }
        if (!data.password) {
            errors.push('Password tidak boleh kosong');
        } else if (data.password.length < 6) {
            errors.push('Password minimal 6 karakter');
        }
        if (errors.length > 0) {
            showErrorMessage(errors.join('\n'));
            return false;
        }
        return true;
    }

    // INI ADALAH BAGIAN UTAMA YANG PERLU DISESUAIKAN
    async function handleLogin(formData) {
        try {
            setLoadingState(true);

            // **MODIFIKASI 2: Ubah URL endpoint dari '/api/login' menjadi '/login'**
            // Agar cocok dengan `server.js` yang kita buat.
            const response = await fetch('/login', { // <--- PERUBAHAN DI SINI
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Terjadi kesalahan saat login');
            }

            showSuccessMessage(result.message || 'Login berhasil!');

            // **MODIFIKASI 3: Tambahkan penanganan untuk role 'admin' saat redirect**
            setTimeout(() => {
                if (result.user) {
                    if (result.user.role === 'admin') {
                        window.location.href = 'admin.html'; // <-- TAMBAHAN
                    } else if (result.user.role === 'supplier') {
                        window.location.href = 'supplier_dashboard.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                } else {
                    // Fallback jika tidak ada info user
                    window.location.href = 'index.html';
                }
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            showErrorMessage(`Login Gagal: ${error.message}`);
        } finally {
            setLoadingState(false);
        }
    }

    // ... (Semua fungsi lainnya dari setLoadingState hingga addDynamicStyles tidak perlu diubah sama sekali) ...
    function setLoadingState(loading) {
        isLoading = loading;
        if (loading) {
            loginForm.classList.add('loading');
            submitBtn.textContent = 'Memproses...';
            submitBtn.disabled = true;
            const spinner = document.createElement('span');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '⟳';
            submitBtn.appendChild(spinner);
        } else {
            loginForm.classList.remove('loading');
            submitBtn.textContent = 'Masuk Sekarang';
            submitBtn.disabled = false;
            const spinner = submitBtn.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    function showErrorMessage(message) {
        createNotification(message, 'error');
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
    }

    function showSuccessMessage(message) {
        createNotification(message, 'success');
    }

    function createNotification(message, type) {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            backgroundColor: type === 'success' ? '#28a745' : '#dc3545',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        });
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    function createRippleEffect(element) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        Object.assign(ripple.style, {
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            transform: 'scale(0)',
            animation: 'ripple 0.6s linear',
            left: '50%',
            top: '50%',
            marginLeft: '-10px',
            marginTop: '-10px',
            width: '20px',
            height: '20px'
        });
        element.style.position = 'relative';
        element.appendChild(ripple);
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    function initializeUIEnhancements() {
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function () {
                this.parentElement.style.transform = 'scale(1.02)';
                this.parentElement.style.transition = 'transform 0.3s ease';
            });
            input.addEventListener('blur', function () {
                this.parentElement.style.transform = 'scale(1)';
            });
            input.addEventListener('input', function () {
                validateInputRealTime(this);
            });
        });
        addDynamicStyles();
    }

    function validateInputRealTime(input) {
        const value = input.value.trim();
        if (input.type === 'email' && value) {
            if (isValidEmail(value)) {
                input.style.borderColor = '#28a745';
            } else {
                input.style.borderColor = '#dc3545';
            }
        } else if (input.type === 'password' && value) {
            if (value.length >= 6) {
                input.style.borderColor = '#28a745';
            } else {
                input.style.borderColor = '#ffc107';
            }
        } else {
            input.style.borderColor = '#e1e5e9';
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            .shake {
                animation: shake 0.5s ease-in-out;
            }
            
            .loading-spinner {
                margin-left: 0.5rem;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            .notification {
                font-family: Arial, sans-serif;
            }
        `;
        document.head.appendChild(style);
    }

    updateUI(userRole);
});