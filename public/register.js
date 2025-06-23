// register.js - Versi final dengan penanganan error yang lebih baik

document.addEventListener('DOMContentLoaded', () => {
    // Bagian ini tidak diubah
    const customerToggle = document.getElementById('customer-toggle');
    const supplierToggle = document.getElementById('supplier-toggle');
    const customerForm = document.getElementById('customer-form');
    const supplierForm = document.getElementById('supplier-form');

    let currentRole = 'pelanggan';
    let isLoading = false;

    initializeUIEnhancements();

    customerToggle.addEventListener('click', () => {
        if (isLoading) return;
        currentRole = 'pelanggan';
        switchToCustomerForm();
    });

    supplierToggle.addEventListener('click', () => {
        if (isLoading) return;
        currentRole = 'supplier';
        switchToSupplierForm();
    });

    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isLoading) return;

        const formData = getCustomerFormData();
        formData.role = 'pelanggan';

        const errors = validateCustomerForm(formData);
        if (errors.length > 0) {
            showErrorMessage(errors.join('\n'));
            return;
        }
        await handleRegistration(formData);
    });

    supplierForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isLoading) return;

        const formData = getSupplierFormData();
        formData.role = 'supplier';

        const errors = validateSupplierForm(formData);
        if (errors.length > 0) {
            showErrorMessage(errors.join('\n'));
            return;
        }
        await handleRegistration(formData);
    });

    // ================== PERBAIKAN UTAMA ADA DI FUNGSI INI ==================
    async function handleRegistration(formDataWithRole) {
        try {
            setLoadingState(true);

            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formDataWithRole)
            });

            // 1. PERIKSA DULU APAKAH RESPONS SUKSES (status code 2xx)
            if (!response.ok) {
                // Jika tidak sukses, baca pesan error sebagai TEKS BIASA (bisa jadi HTML)
                const errorText = await response.text();
                // Tampilkan isi HTML error dari server di console untuk debugging
                console.error("Server merespons dengan error. Isi respons:", errorText);
                // Lempar error baru dengan pesan yang lebih jelas
                throw new Error(`Registrasi gagal. Server memberikan status ${response.status}.`);
            }

            // 2. JIKA SUKSES, BARU BACA ISI RESPONS (sebagai teks)
            const successMessage = await response.text();

            showSuccessMessage(successMessage || 'Registrasi berhasil!');

            setTimeout(() => {
                const activeForm = document.querySelector('.registration-form.active');
                if (activeForm) activeForm.reset();
                updateProgress();
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            // Blok catch ini akan menangkap error dari `throw new Error` di atas
            console.error('Registration error details:', error);
            showErrorMessage(error.message); // Tampilkan pesan error yang lebih relevan
        } finally {
            setLoadingState(false);
        }
    }
    // ================== AKHIR DARI PERBAIKAN ==================


    addRealTimeValidation();

    // Semua fungsi di bawah ini tidak diubah, karena sudah sangat baik.
    function initializeUIEnhancements() {
        const style = document.createElement('style');
        style.textContent = `
            .registration-form { transition: all 0.3s ease; }
            .form-container { position: relative; overflow: hidden; }
            .loading-spinner { display: inline-block; margin-left: 10px; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .shake { animation: shake 0.5s ease-in-out; }
            @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
            .notification { animation: slideIn 0.3s ease-out; }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .input-valid { border-color: #28a745 !important; box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25); }
            .input-invalid { border-color: #dc3545 !important; box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25); }
            .progress-container { width: 100%; height: 4px; background-color: #e9ecef; border-radius: 2px; margin-bottom: 2rem; overflow: hidden; }
            .progress-fill { height: 100%; width: 0%; background: linear-gradient(90deg, #007bff, #6f42c1); border-radius: 2px; transition: width 0.3s ease, background 0.3s ease; }
            .ripple { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.6); transform: scale(0); animation: ripple 0.6s linear; pointer-events: none; }
            @keyframes ripple { to { transform: scale(4); opacity: 0; } }
        `;
        document.head.appendChild(style);
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = '<div class="progress-fill" id="progress-fill"></div>';
        const formContainer = document.querySelector('.form-container');
        const formToggle = document.querySelector('.form-toggle');
        formContainer.insertBefore(progressContainer, formToggle.nextSibling);
    }
    function switchToCustomerForm() {
        customerToggle.classList.add('active');
        supplierToggle.classList.remove('active');
        customerForm.classList.add('active');
        supplierForm.classList.remove('active');
        animateFormTransition();
        updateProgress();
        createRippleEffect(customerToggle);
    }
    function switchToSupplierForm() {
        supplierToggle.classList.add('active');
        customerToggle.classList.remove('active');
        supplierForm.classList.add('active');
        customerForm.classList.remove('active');
        animateFormTransition();
        updateProgress();
        createRippleEffect(supplierToggle);
    }
    function animateFormTransition() {
        const activeForm = document.querySelector('.registration-form.active');
        activeForm.style.opacity = '0';
        activeForm.style.transform = 'translateY(20px)';
        setTimeout(() => {
            activeForm.style.opacity = '1';
            activeForm.style.transform = 'translateY(0)';
        }, 150);
    }
    function createRippleEffect(button) {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (rect.width / 2 - size / 2) + 'px';
        ripple.style.top = (rect.height / 2 - size / 2) + 'px';
        button.style.position = 'relative';
        button.appendChild(ripple);
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    function getCustomerFormData() {
        return {
            nik: document.getElementById('c-nik').value.trim(),
            nama: document.getElementById('c-nama').value.trim(),
            alamat: document.getElementById('c-alamat').value.trim(),
            no_telp: document.getElementById('c-telp').value.trim(),
            email: document.getElementById('c-email').value.trim(),
            password: document.getElementById('c-password').value,
        };
    }
    function getSupplierFormData() {
        return {
            nama: document.getElementById('s-nama').value.trim(),
            alamat: document.getElementById('s-alamat').value.trim(),
            no_telp: document.getElementById('s-telp').value.trim(),
            email: document.getElementById('s-email').value.trim(),
            no_rekening: document.getElementById('s-rekening').value.trim(),
            password: document.getElementById('s-password').value,
        };
    }
    function validateCustomerForm(data) {
        const errors = [];
        if (!data.nik) { errors.push('NIK tidak boleh kosong'); }
        else if (data.nik.length !== 16) { errors.push('NIK harus 16 digit'); }
        else if (!/^\d+$/.test(data.nik)) { errors.push('NIK hanya boleh berisi angka'); }
        if (!data.nama) { errors.push('Nama lengkap tidak boleh kosong'); }
        else if (data.nama.length < 3) { errors.push('Nama minimal 3 karakter'); }
        if (!data.alamat) { errors.push('Alamat tidak boleh kosong'); }
        if (!data.no_telp) { errors.push('Nomor telepon tidak boleh kosong'); }
        else if (!/^08\d{8,13}$/.test(data.no_telp)) { errors.push('Format nomor telepon tidak valid (08xxxxxxxxxx)'); }
        if (!data.email) { errors.push('Email tidak boleh kosong'); }
        else if (!isValidEmail(data.email)) { errors.push('Format email tidak valid'); }
        if (!data.password) { errors.push('Password tidak boleh kosong'); }
        else if (data.password.length < 8) { errors.push('Password minimal 8 karakter'); }
        return errors;
    }
    function validateSupplierForm(data) {
        const errors = [];
        if (!data.nama) { errors.push('Nama rental/perusahaan tidak boleh kosong'); }
        if (!data.alamat) { errors.push('Alamat tidak boleh kosong'); }
        if (!data.no_telp) { errors.push('Nomor telepon tidak boleh kosong'); }
        else if (!/^08\d{8,13}$/.test(data.no_telp)) { errors.push('Format nomor telepon tidak valid (08xxxxxxxxxx)'); }
        if (!data.email) { errors.push('Email tidak boleh kosong'); }
        else if (!isValidEmail(data.email)) { errors.push('Format email tidak valid'); }
        if (!data.no_rekening) { errors.push('Nomor rekening tidak boleh kosong'); }
        if (!data.password) { errors.push('Password tidak boleh kosong'); }
        else if (data.password.length < 8) { errors.push('Password minimal 8 karakter'); }
        return errors;
    }
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function setLoadingState(loading) {
        isLoading = loading;
        const activeForm = document.querySelector('.registration-form.active');
        const submitBtn = activeForm.querySelector('.submit-btn');
        if (loading) {
            activeForm.classList.add('loading');
            submitBtn.textContent = 'Memproses...';
            submitBtn.disabled = true;
            const spinner = document.createElement('span');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '⟳';
            submitBtn.appendChild(spinner);
        } else {
            activeForm.classList.remove('loading');
            submitBtn.disabled = false;
            const spinner = submitBtn.querySelector('.loading-spinner');
            if (spinner) { spinner.remove(); }
            if (currentRole === 'pelanggan') { submitBtn.textContent = 'Daftar sebagai Pelanggan'; }
            else { submitBtn.textContent = 'Daftar sebagai Supplier'; }
        }
    }
    function updateProgress() {
        const activeForm = document.querySelector('.registration-form.active');
        const progressFill = document.getElementById('progress-fill');
        if (!activeForm || !progressFill) return;
        const inputs = activeForm.querySelectorAll('input[required]');
        const filledInputs = Array.from(inputs).filter(input => {
            const value = input.value.trim();
            return value !== '' && isInputValid(input, value);
        });
        const progress = inputs.length > 0 ? (filledInputs.length / inputs.length) * 100 : 0;
        progressFill.style.width = progress + '%';
        if (progress === 100) { progressFill.style.background = 'linear-gradient(90deg, #28a745, #20c997)'; }
        else if (progress >= 50) { progressFill.style.background = 'linear-gradient(90deg, #ffc107, #28a745)'; }
        else { progressFill.style.background = 'linear-gradient(90deg, #007bff, #6f42c1)'; }
    }
    function isInputValid(input, value) {
        switch (input.type) {
            case 'email': return isValidEmail(value);
            case 'tel': return /^08\d{8,13}$/.test(value);
            case 'password': return value.length >= 8;
            default:
                if (input.id === 'c-nik') { return value.length === 16 && /^\d+$/.test(value); }
                return value.length >= 3;
        }
    }
    function addRealTimeValidation() {
        const allInputs = document.querySelectorAll('input[required]');
        allInputs.forEach(input => {
            input.addEventListener('input', () => {
                const value = input.value.trim();
                if (value === '') { input.classList.remove('input-valid', 'input-invalid'); }
                else if (isInputValid(input, value)) {
                    input.classList.remove('input-invalid');
                    input.classList.add('input-valid');
                } else {
                    input.classList.remove('input-valid');
                    input.classList.add('input-invalid');
                }
                updateProgress();
            });
            input.addEventListener('blur', () => {
                const value = input.value.trim();
                if (value !== '' && !isInputValid(input, value)) {
                    showFieldError(input);
                }
            });
        });
    }
    function showFieldError(input) {
        let errorMessage = '';
        const value = input.value.trim();
        switch (input.id) {
            case 'c-nik':
                if (value.length !== 16) errorMessage = 'NIK harus 16 digit';
                else if (!/^\d+$/.test(value)) errorMessage = 'NIK hanya boleh berisi angka';
                break;
            case 'c-nama':
            case 's-nama':
                if (value.length < 3) errorMessage = 'Nama minimal 3 karakter';
                break;
            case 'c-telp':
            case 's-telp':
                if (!/^08\d{8,13}$/.test(value)) errorMessage = 'Format: 08xxxxxxxxxx';
                break;
            case 'c-email':
            case 's-email':
                if (!isValidEmail(value)) errorMessage = 'Format email tidak valid';
                break;
            case 'c-password':
            case 's-password':
                if (value.length < 8) errorMessage = 'Password minimal 8 karakter';
                break;
        }
        if (errorMessage) { showFieldTooltip(input, errorMessage); }
    }
    function showFieldTooltip(input, message) {
        const existingTooltip = input.parentNode.querySelector('.field-tooltip');
        if (existingTooltip) { existingTooltip.remove(); }
        const tooltip = document.createElement('div');
        tooltip.className = 'field-tooltip';
        tooltip.textContent = message;
        tooltip.style.cssText = `position: absolute; top: 100%; left: 0; background: #dc3545; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; white-space: nowrap; z-index: 1000; margin-top: 5px;`;
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(tooltip);
        setTimeout(() => { tooltip.remove(); }, 3000);
    }
    function showErrorMessage(message) {
        createNotification(message, 'error');
        const activeForm = document.querySelector('.registration-form.active');
        activeForm.classList.add('shake');
        setTimeout(() => {
            activeForm.classList.remove('shake');
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
            position: 'fixed', top: '20px', right: '20px', padding: '1rem 1.5rem', borderRadius: '8px',
            color: 'white', fontWeight: '600', zIndex: '9999', transform: 'translateX(100%)', opacity: '0',
            transition: 'all 0.3s ease', maxWidth: '400px', wordWrap: 'break-word', whiteSpace: 'pre-line',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        });
        if (type === 'error') { notification.style.background = 'linear-gradient(135deg, #dc3545, #c82333)'; }
        else if (type === 'success') { notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)'; }
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => { notification.remove(); }, 300);
        }, 5000);
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => { notification.remove(); }, 300);
        });
    }

    updateProgress();
});