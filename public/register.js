// public/register.js
document.addEventListener('DOMContentLoaded', () => {
    const customerToggle = document.getElementById('customer-toggle');
    const supplierToggle = document.getElementById('supplier-toggle');
    const customerForm = document.getElementById('customer-form');
    const supplierForm = document.getElementById('supplier-form');

    // Event listener untuk tombol toggle
    customerToggle.addEventListener('click', () => {
        customerToggle.classList.add('active');
        supplierToggle.classList.remove('active');
        customerForm.classList.add('active');
        supplierForm.classList.remove('active');
    });

    supplierToggle.addEventListener('click', () => {
        supplierToggle.classList.add('active');
        customerToggle.classList.remove('active');
        supplierForm.classList.add('active');
        customerForm.classList.remove('active');
    });

    // Event listener untuk form pelanggan
    customerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nik: document.getElementById('c-nik').value,
            nama: document.getElementById('c-nama').value,
            alamat: document.getElementById('c-alamat').value,
            no_telp: document.getElementById('c-telp').value,
            email: document.getElementById('c-email').value,
            password: document.getElementById('c-password').value,
        };
        registerUser('/api/register/pelanggan', data, 'pelanggan');
    });

    // Event listener untuk form supplier
    supplierForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nama: document.getElementById('s-nama').value,
            alamat: document.getElementById('s-alamat').value,
            no_telp: document.getElementById('s-telp').value,
            email: document.getElementById('s-email').value,
            no_rekening: document.getElementById('s-rekening').value,
            password: document.getElementById('s-password').value,
        };
        registerUser('/api/register/supplier', data, 'supplier');
    });
});

async function registerUser(apiUrl, formData, userType) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert(result.message);

        // Arahkan ke halaman login setelah registrasi berhasil
        window.location.href = 'login.html';

    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
