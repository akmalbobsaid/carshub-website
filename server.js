// server.js - Versi Final yang Menggabungkan Semua Fitur

// 1. Impor paket
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// 2. Konfigurasi
const app = express();
const PORT = 3000;
const dbConfig = { host: 'localhost', user: 'root', password: 'AkmalRafi16', database: 'CarsHub' };

// 3. Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });


// 4. API Endpoints

// === LOGIN & REGISTRASI ===
app.post('/api/login', async (req, res) => {
    const { role, email, password } = req.body;
    if (!role || !email || !password) return res.status(400).json({ message: 'Peran, email, dan password diperlukan.' });
    const table = role === 'pelanggan' ? 'pelanggan' : 'supplier';
    const sql = `SELECT * FROM ${table} WHERE email = ?`;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(sql, [email]);
        await connection.end();
        if (rows.length === 0) return res.status(404).json({ message: 'Email tidak ditemukan.' });
        const user = rows[0];
        if (password !== user.password) return res.status(401).json({ message: 'Password salah.' });
        res.status(200).json({ message: 'Login berhasil!', user: { id: user.id_pelanggan || user.id_supplier, nama: user.nama, role: role } });
    } catch (error) {
        console.error(`Gagal login ${role}:`, error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

app.post('/api/register/pelanggan', async (req, res) => {
    const { nik, nama, alamat, no_telp, email, password } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = "INSERT INTO pelanggan (nik, nama, alamat, no_telp, email, password) VALUES (?, ?, ?, ?, ?, ?)";
        await connection.execute(sql, [nik, nama, alamat, no_telp, email, password]);
        await connection.end();
        res.status(201).json({ message: 'Registrasi pelanggan berhasil! Silakan login.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') res.status(409).json({ message: 'Email atau NIK sudah terdaftar.' });
        else { console.error("Gagal registrasi pelanggan:", error); res.status(500).json({ message: "Terjadi kesalahan pada server." }); }
    }
});

app.post('/api/register/supplier', async (req, res) => {
    const { nama, alamat, no_telp, email, password, no_rekening } = req.body;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = "INSERT INTO supplier (nama, alamat, no_telp, email, password, no_rekening) VALUES (?, ?, ?, ?, ?, ?)";
        await connection.execute(sql, [nama, alamat, no_telp, email, password, no_rekening]);
        await connection.end();
        res.status(201).json({ message: 'Registrasi supplier berhasil! Silakan login.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') res.status(409).json({ message: 'Email sudah terdaftar.' });
        else { console.error("Gagal registrasi supplier:", error); res.status(500).json({ message: "Terjadi kesalahan pada server." }); }
    }
});


// === DATA FETCHING (GET) ===
app.get('/api/mobil', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute("SELECT id_mobil, merk, tipe, tahun, tarif_per_hari, foto FROM mobil WHERE status_mobil = 'tersedia'");
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error("Error fetching cars:", error); res.status(500).json({ message: "Server error" });
    }
});

app.get('/api/mobil/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM mobil WHERE id_mobil = ?', [req.params.id]);
        await connection.end();
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ message: 'Car not found' });
    } catch (error) {
        console.error("Error fetching car details:", error); res.status(500).json({ message: "Server error" });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = `
            SELECT b.id_booking, pl.nama AS nama_pelanggan, m.merk, m.tipe, b.tanggal_mulai, b.tanggal_selesai, b.status_booking, py.bukti_pembayaran
            FROM booking b
            JOIN pelanggan pl ON b.nik = pl.nik
            JOIN mobil m ON b.id_mobil = m.id_mobil
            LEFT JOIN pembayaran py ON b.id_booking = py.id_booking
            ORDER BY b.id_booking DESC;
        `;
        const [rows] = await connection.execute(sql);
        await connection.end();
        res.json(rows);
    } catch (error) {
        console.error("Gagal mengambil daftar booking:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

app.get('/api/booking/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = `SELECT b.id_booking, b.total_biaya, m.merk, m.tipe FROM booking b JOIN mobil m ON b.id_mobil = m.id_mobil WHERE b.id_booking = ?`;
        const [rows] = await connection.execute(sql, [req.params.id]);
        await connection.end();
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ message: 'Booking not found' });
    } catch (error) {
        console.error("Error fetching booking details:", error); res.status(500).json({ message: "Server error" });
    }
});

app.get('/api/supplier/mobil', async (req, res) => {
    const { supplierId } = req.query;
    if (!supplierId) return res.status(400).json({ message: 'ID Supplier diperlukan.' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = "SELECT id_mobil, merk, tipe, tahun, tarif_per_hari, status_mobil FROM mobil WHERE id_supplier = ?";
        const [cars] = await connection.execute(sql, [supplierId]);
        await connection.end();
        res.status(200).json(cars);
    } catch (error) {
        console.error("Gagal mengambil mobil supplier:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.get('/api/laporan-komisi', async (req, res) => {
    const { year, supplierId } = req.query;
    if (!year || !supplierId) return res.status(400).json({ message: 'Tahun dan ID Supplier diperlukan.' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [results] = await connection.execute('CALL laporan_komisi_bulanan(?, ?)', [supplierId, year]);
        await connection.end();
        res.status(200).json(results[0]);
    } catch (error) {
        console.error("Gagal mengambil laporan komisi:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});


// === API VERIFIKASI ADMIN ===
app.get('/api/pendaftaran-mobil/pending', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = `
            SELECT p.*, s.nama AS nama_supplier
            FROM pendaftaran_mobil p
            JOIN supplier s ON p.id_supplier = s.id_supplier
            WHERE p.status_verifikasi = 'menunggu'
            ORDER BY p.tanggal_daftar ASC;
        `;
        const [pendingCars] = await connection.execute(sql);
        await connection.end();
        res.status(200).json(pendingCars);
    } catch (error) {
        console.error("Gagal mengambil pendaftaran mobil:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.post('/api/pendaftaran-mobil/verify', async (req, res) => {
    const { pendaftaran_id, action, catatan } = req.body;
    const admin_id = 1;
    if (!pendaftaran_id || !action) return res.status(400).json({ message: 'ID Pendaftaran dan Aksi diperlukan.' });
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();
        const updateSql = "UPDATE pendaftaran_mobil SET status_verifikasi = ?, catatan_verifikasi = ?, id_admin = ? WHERE id_pendaftaran = ?";
        await connection.execute(updateSql, [action, catatan, admin_id, pendaftaran_id]);
        if (action === 'diterima') {
            const [rows] = await connection.execute("SELECT * FROM pendaftaran_mobil WHERE id_pendaftaran = ?", [pendaftaran_id]);
            const car = rows[0];
            const insertSql = `INSERT INTO mobil (id_supplier, merk, tipe, tahun, tarif_per_hari, foto, status_mobil) VALUES (?, ?, ?, ?, ?, ?, 'tersedia')`;
            await connection.execute(insertSql, [car.id_supplier, car.merk, car.tipe, car.tahun, car.tarif_per_hari, car.foto]);
        }
        await connection.commit();
        res.status(200).json({ message: `Pendaftaran mobil #${pendaftaran_id} telah berhasil di-${action}.` });
    } catch (error) {
        await connection.rollback();
        console.error("Gagal verifikasi mobil:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    } finally {
        await connection.end();
    }
});


// === AKSI (POST, PUT, DELETE) LAINNYA ===
app.post('/api/booking', async (req, res) => {
    const { nik, id_mobil, tanggal_mulai, tanggal_selesai } = req.body;
    if (!nik || !id_mobil || !tanggal_mulai || !tanggal_selesai) return res.status(400).json({ message: 'All fields are required' });
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.beginTransaction();
        const [mobilRows] = await connection.execute('SELECT tarif_per_hari FROM mobil WHERE id_mobil = ?', [id_mobil]);
        if (mobilRows.length === 0) throw new Error('Invalid car');
        const [durasiRows] = await connection.execute('SELECT DATEDIFF(?, ?) AS durasi', [tanggal_selesai, tanggal_mulai]);
        if (durasiRows[0].durasi <= 0) throw new Error('End date must be after start date');
        const total_biaya = durasiRows[0].durasi * mobilRows[0].tarif_per_hari;
        const sql = 'INSERT INTO booking (nik, id_mobil, tanggal_mulai, tanggal_selesai, total_biaya, status_booking) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await connection.execute(sql, [nik, id_mobil, tanggal_mulai, tanggal_selesai, total_biaya, 'menunggu pembayaran']);
        await connection.commit();
        res.status(201).json({ message: 'Booking successful!', bookingId: result.insertId });
    } catch (error) {
        await connection.rollback();
        console.error("Error creating booking:", error); res.status(500).json({ message: error.message || "Server error" });
    } finally {
        await connection.end();
    }
});

app.post('/api/pembayaran', upload.single('bukti_pembayaran'), async (req, res) => {
    const { id_booking } = req.body;
    const bukti_pembayaran_path = req.file ? req.file.path.replace(/\\/g, "/") : null;
    if (!id_booking || !bukti_pembayaran_path) return res.status(400).json({ message: 'Booking ID and proof of payment are required' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = "INSERT INTO pembayaran (id_booking, metode, bukti_pembayaran, status_pembayaran) VALUES (?, ?, ?, ?)";
        await connection.execute(sql, [id_booking, 'Transfer Bank', bukti_pembayaran_path, 'berhasil']);
        await connection.end();
        res.status(201).json({ message: 'Payment confirmed!' });
    } catch (error) {
        console.error("Error processing payment:", error); res.status(500).json({ message: "Server error" });
    }
});

app.put('/api/mobil/:id', async (req, res) => {
    const { id } = req.params;
    const { tarif_per_hari } = req.body;
    if (!tarif_per_hari) return res.status(400).json({ message: 'Tarif per hari diperlukan.' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = "UPDATE mobil SET tarif_per_hari = ? WHERE id_mobil = ?";
        await connection.execute(sql, [tarif_per_hari, id]);
        await connection.end();
        res.status(200).json({ message: `Tarif untuk mobil #${id} berhasil diperbarui.` });
    } catch (error) {
        console.error("Gagal memperbarui mobil:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.delete('/api/mobil/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = "DELETE FROM mobil WHERE id_mobil = ?";
        await connection.execute(sql, [id]);
        await connection.end();
        res.status(200).json({ message: `Mobil #${id} dan semua data terkait berhasil dihapus.` });
    } catch (error) {
        console.error("Gagal menghapus mobil:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.post('/api/booking/confirm', async (req, res) => {
    const { id_booking, status } = req.body;
    if (!id_booking || !status) return res.status(400).json({ message: 'ID Booking dan Status baru diperlukan.' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('CALL konfirmasi_booking(?, ?)', [id_booking, status]);
        await connection.end();
        res.status(200).json({ message: `Status pesanan #${id_booking} berhasil diubah menjadi "${status}"` });
    } catch (error) {
        console.error("Gagal mengonfirmasi booking:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
});

app.post('/api/pendaftaran-mobil', upload.single('foto'), async (req, res) => {
    const { id_supplier, merk, tipe, tahun, tarif_per_hari } = req.body;
    const foto = req.file ? `uploads/${req.file.filename}` : null;
    if (!id_supplier || !merk || !tipe || !tahun || !tarif_per_hari || !foto) return res.status(400).json({ message: 'Semua field harus diisi.' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        const sql = `INSERT INTO pendaftaran_mobil (id_supplier, merk, tipe, tahun, tarif_per_hari, foto, status_verifikasi) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await connection.execute(sql, [id_supplier, merk, tipe, tahun, tarif_per_hari, foto, 'menunggu']);
        await connection.end();
        res.status(201).json({ message: 'Pendaftaran mobil berhasil diajukan dan menunggu verifikasi admin.' });
    } catch (error) {
        console.error("Gagal mendaftarkan mobil:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});


// 5. Jalankan Server
app.listen(PORT, () => {
    console.log(`Server CarsHub berjalan di http://localhost:${PORT}`);
});
