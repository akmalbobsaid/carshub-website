// login.js - Optimized version with enhanced UX features
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const customerToggle = document.getElementById('customer-toggle');
    const supplierToggle = document.getElementById('supplier-toggle');
    const loginForm = document.getElementById('login-form');
    const formTitle = document.getElementById('form-title');
    const roleIndicator = document.getElementById('role-indicator');
    const submitBtn = loginForm.querySelector('.submit-btn');

    let userRole = 'pelanggan'; // Default role
    let isLoading = false;

    // Initialize UI enhancements
    initializeUIEnhancements();

    // Toggle event listeners
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

    // Login form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isLoading) return;

        const formData = getFormData();

        // Validate form data
        if (!validateForm(formData)) {
            return;
        }

        await handleLogin(formData);
    });

    // Functions
    function updateUI(role) {
        const isCustomer = role === 'pelanggan';

        formTitle.textContent = isCustomer ? 'Masuk sebagai Pelanggan' : 'Masuk sebagai Supplier';
        roleIndicator.textContent = isCustomer ? 'Pelanggan' : 'Supplier';

        // Update form styling based on role
        loginForm.setAttribute('data-role', role);
    }

    function animateToggle(activeBtn, inactiveBtn) {
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');

        // Add ripple effect
        createRippleEffect(activeBtn);
    }

    function getFormData() {
        return {
            role: userRole,
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
        };
    }

    function validateForm(data) {
        const errors = [];

        // Email validation
        if (!data.email) {
            errors.push('Email tidak boleh kosong');
        } else if (!isValidEmail(data.email)) {
            errors.push('Format email tidak valid');
        }

        // Password validation
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

    async function handleLogin(formData) {
        try {
            setLoadingState(true);

            const response = await fetch('/api/login', {
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

            // Show success message
            showSuccessMessage(result.message || 'Login berhasil!');

            // Redirect based on user role
            setTimeout(() => {
                if (result.user && result.user.role === 'supplier') {
                    window.location.href = 'supplier_dashboard.html';
                } else {
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

    function setLoadingState(loading) {
        isLoading = loading;

        if (loading) {
            loginForm.classList.add('loading');
            submitBtn.textContent = 'Memproses...';
            submitBtn.disabled = true;

            // Add loading spinner
            const spinner = document.createElement('span');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '⟳';
            submitBtn.appendChild(spinner);

        } else {
            loginForm.classList.remove('loading');
            submitBtn.textContent = 'Masuk Sekarang';
            submitBtn.disabled = false;

            // Remove loading spinner
            const spinner = submitBtn.querySelector('.loading-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    function showErrorMessage(message) {
        createNotification(message, 'error');

        // Add shake animation to form
        loginForm.classList.add('shake');
        setTimeout(() => {
            loginForm.classList.remove('shake');
        }, 500);
    }

    function showSuccessMessage(message) {
        createNotification(message, 'success');
    }

    function createNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Add styles
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

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
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
        // Add input focus effects
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('focus', function () {
                this.parentElement.style.transform = 'scale(1.02)';
                this.parentElement.style.transition = 'transform 0.3s ease';
            });

            input.addEventListener('blur', function () {
                this.parentElement.style.transform = 'scale(1)';
            });

            // Add real-time validation feedback
            input.addEventListener('input', function () {
                validateInputRealTime(this);
            });
        });

        // Add CSS animations
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

    // Initialize with default role
    updateUI(userRole);
});