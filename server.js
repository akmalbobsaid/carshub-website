// server.js - Versi Final yang Lengkap

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'secret-key-carshub',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'CarsHub'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- RUTE API UMUM ---

app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Could not log out.');
        res.clearCookie('connect.sid');
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
});

app.post('/register', (req, res) => {
    const { role, nama, alamat, no_telp, email, password, nik, no_rekening } = req.body;
    let tableName, fields, values;
    switch (role) {
        case 'pelanggan':
            tableName = 'pelanggan';
            fields = ['nik', 'nama', 'alamat', 'no_telp', 'email', 'password'];
            values = [nik, nama, alamat, no_telp, email, password];
            break;
        case 'supplier':
            tableName = 'supplier';
            fields = ['nama', 'alamat', 'no_telp', 'email', 'password', 'no_rekening'];
            values = [nama, alamat, no_telp, email, password, no_rekening];
            break;
        default: return res.status(400).send('Invalid role');
    }
    const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (?${', ?'.repeat(fields.length - 1)})`;
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error saat menjalankan query registrasi:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).send('NIK atau Email ini sudah terdaftar.');
            }
            return res.status(500).send('Terjadi masalah pada server saat registrasi.');
        }
        res.status(201).send('Registrasi berhasil! Anda akan diarahkan ke halaman login.');
    });
});

app.post('/login', (req, res) => {
    const { email, password, role } = req.body;
    let tableName, id_field;
    switch (role) {
        case 'pelanggan': tableName = 'pelanggan'; id_field = 'nik'; break;
        case 'supplier': tableName = 'supplier'; id_field = 'id_supplier'; break;
        case 'admin': tableName = 'admin'; id_field = 'id_admin'; break;
        default: return res.status(400).send('Invalid role');
    }
    const query = `SELECT * FROM ${tableName} WHERE email = ? AND password = ?`;
    db.query(query, [email, password], (err, results) => {
        if (err) return res.status(500).send('Server error');
        if (results.length > 0) {
            req.session.user = { id: results[0][id_field], nama: results[0].nama, email: results[0].email, role: role };
            res.json({ success: true, user: req.session.user });
        } else {
            res.status(401).json({ success: false, message: 'Email atau password salah' });
        }
    });
});

app.get('/api/mobil', (req, res) => {
    const query = "SELECT * FROM mobil WHERE status_mobil = 'tersedia'";
    db.query(query, (err, results) => {
        if (err) return res.status(500).send('Server error');
        res.json(results);
    });
});

app.get('/api/mobil/:id', (req, res) => {
    const query = 'SELECT * FROM mobil WHERE id_mobil = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).send('Server error');
        res.json(result[0]);
    });
});

// --- RUTE SUPPLIER ---

// ** INI RUTE YANG HILANG DAN SEKARANG SUDAH DITAMBAHKAN **
app.get('/api/supplier/mobil', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'supplier') {
        return res.status(403).json([]);
    }
    const id_supplier = req.session.user.id;
    const query = "SELECT * FROM mobil WHERE id_supplier = ?";
    db.query(query, [id_supplier], (err, results) => {
        if (err) {
            console.error('Error fetching supplier cars:', err);
            return res.status(500).send('Server error');
        }
        res.json(results);
    });
});

app.post('/api/pendaftaran_mobil', upload.single('foto'), (req, res) => {
    if (!req.session.user || req.session.user.role !== 'supplier') {
        return res.status(403).send('Akses ditolak: Anda harus login sebagai supplier.');
    }
    const id_supplier = req.session.user.id;
    const { merk, tipe, tahun, tarif_per_hari } = req.body;
    const foto = req.file ? `/uploads/${req.file.filename}` : null;
    if (!foto) return res.status(400).send('Foto mobil diperlukan.');

    const query = 'INSERT INTO pendaftaran_mobil (id_supplier, merk, tipe, tahun, tarif_per_hari, foto) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [id_supplier, merk, tipe, tahun, tarif_per_hari, foto], (err, result) => {
        if (err) {
            console.error('Error submitting car registration:', err);
            return res.status(500).send('Server error');
        }
        res.status(201).send('Pendaftaran mobil berhasil, menunggu verifikasi admin.');
    });
});

app.get('/api/supplier/reports', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'supplier') {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }
    const id_supplier = req.session.user.id;
    const { year } = req.query;
    if (!year) return res.status(400).json({ message: 'Tahun diperlukan.' });

    db.query('CALL laporan_komisi_bulanan(?, ?)', [id_supplier, year], (err, results) => {
        if (err) {
            console.error("Error fetching monthly commission report:", err);
            return res.status(500).json({ message: 'Gagal mengambil laporan.' });
        }
        res.json(results[0]);
    });
});

// ================= RUTE-RUTE BARU UNTUK ADMIN.JS =================

// 1. RUTE BARU: Mengambil semua data booking untuk ditampilkan di dashboard admin
app.get('/api/bookings', (req, res) => {
    const query = `
        SELECT 
            b.id_booking,
            pel.nama AS nama_pelanggan,
            m.merk,
            m.tipe,
            b.tanggal_mulai,
            b.tanggal_selesai,
            b.status_booking,
            p.bukti_pembayaran
        FROM booking b
        JOIN pelanggan pel ON b.nik = pel.nik
        JOIN mobil m ON b.id_mobil = m.id_mobil
        LEFT JOIN pembayaran p ON b.id_booking = p.id_booking
        ORDER BY b.id_booking DESC;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching all bookings:", err);
            return res.status(500).json({ message: "Gagal mengambil data pesanan." });
        }
        res.json(results);
    });
});

// 2. RUTE BARU: Mengambil daftar mobil yang menunggu verifikasi
app.get('/api/pendaftaran-mobil/pending', (req, res) => {
    const query = `
        SELECT 
            pm.id_pendaftaran,
            pm.merk,
            pm.tipe,
            pm.tahun,
            pm.tarif_per_hari,
            pm.foto,
            s.nama AS nama_supplier 
        FROM pendaftaran_mobil pm
        JOIN supplier s ON pm.id_supplier = s.id_supplier
        WHERE pm.status_verifikasi = 'menunggu'
        ORDER BY pm.tanggal_daftar ASC;
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching pending cars:", err);
            return res.status(500).json({ message: "Gagal memuat data verifikasi." });
        }
        res.json(results);
    });
});

// 3. RUTE BARU: Untuk admin mengonfirmasi atau menyelesaikan booking
app.post('/api/booking/confirm', (req, res) => {
    // Pastikan admin sudah login
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const { id_booking, status } = req.body;
    if (!id_booking || !status) {
        return res.status(400).json({ message: 'Informasi tidak lengkap.' });
    }

    // Panggil stored procedure yang sudah ada
    db.query('CALL konfirmasi_booking(?, ?)', [id_booking, status], (err, result) => {
        if (err) {
            console.error("Error confirming booking:", err);
            return res.status(500).json({ message: "Gagal mengonfirmasi pesanan." });
        }
        res.json({ message: `Pesanan #${id_booking} berhasil diubah statusnya menjadi '${status}'.` });
    });
});

// 4. RUTE BARU: Untuk admin menyetujui atau menolak pendaftaran mobil
app.post('/api/pendaftaran-mobil/verify', (req, res) => {
    // Pastikan admin sudah login
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const { pendaftaran_id, action, catatan } = req.body;
    const admin_id = req.session.user.id;

    if (!['diterima', 'ditolak'].includes(action)) {
        return res.status(400).json({ message: 'Aksi tidak valid.' });
    }

    // Update status pendaftaran
    const updateQuery = 'UPDATE pendaftaran_mobil SET status_verifikasi = ?, catatan_verifikasi = ?, id_admin = ? WHERE id_pendaftaran = ?';
    db.query(updateQuery, [action, catatan, admin_id, pendaftaran_id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Gagal update status pendaftaran.' });

        // Jika diterima, masukkan data ke tabel mobil
        if (action === 'diterima') {
            const getPendaftaranQuery = 'SELECT * FROM pendaftaran_mobil WHERE id_pendaftaran = ?';
            db.query(getPendaftaranQuery, [pendaftaran_id], (err, pendaftaran) => {
                if (err || pendaftaran.length === 0) return res.status(500).json({ message: 'Gagal mengambil data pendaftaran.' });

                const car = pendaftaran[0];
                const insertMobilQuery = 'INSERT INTO mobil (id_supplier, merk, tipe, tahun, tarif_per_hari, foto) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(insertMobilQuery, [car.id_supplier, car.merk, car.tipe, car.tahun, car.tarif_per_hari, car.foto], (err, insertResult) => {
                    if (err) return res.status(500).json({ message: 'Gagal memasukkan mobil ke daftar.' });
                    res.json({ message: `Pendaftaran #${pendaftaran_id} disetujui dan mobil telah ditambahkan.` });
                });
            });
        } else {
            // Jika ditolak
            res.json({ message: `Pendaftaran #${pendaftaran_id} telah ditolak.` });
        }
    });
});

// ================= AKHIR DARI RUTE BARU =================


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});