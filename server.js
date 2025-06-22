// server.js - Versi Optimal dengan Database Pool dan Security (FIXED)

// 1. Load Environment Variables
require('dotenv').config();

// 2. Import Dependencies
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// 3. Initialize Express App
const app = express();
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 12;

// 4. Security Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.'
});
app.use('/api/', limiter);

// Auth rate limiting (lebih ketat)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit.'
});

// 5. Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Static Files Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// 7. Database Connection Pool (FIXED CONFIGURATION)
const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'CarsHub',
    connectionLimit: 20,
    queueLimit: 0,
    // REMOVED INVALID OPTIONS:
    // acquireTimeout, timeout, reconnect are not valid for mysql2
    charset: 'utf8mb4',
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    debug: false,
    multipleStatements: false,
    // Valid mysql2 options:
    idleTimeout: 60000,
    acquireTimeout: 60000,
    waitForConnections: true,
    reconnect: true
});

// Test database connection
dbPool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    });

// 8. Multer Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
        }
    }
});

// 9. Helper Functions
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const validateRequired = (fields) => (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    if (missing.length > 0) {
        return res.status(400).json({
            message: `Field berikut diperlukan: ${missing.join(', ')}`
        });
    }
    next();
};

// 10. API Routes

// === AUTHENTICATION ROUTES ===
app.post('/api/login', authLimiter, validateRequired(['role', 'email', 'password']), asyncHandler(async (req, res) => {
    const { role, email, password } = req.body;

    // Validate role
    const validRoles = ['pelanggan', 'supplier', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Role tidak valid' });
    }

    const table = role === 'pelanggan' ? 'pelanggan' :
        role === 'supplier' ? 'supplier' : 'admin';

    const idField = role === 'pelanggan' ? 'id_pelanggan' :
        role === 'supplier' ? 'id_supplier' : 'id_admin';

    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT ${idField} as id, nama, email, password FROM ${table} WHERE email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        const user = rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ message: 'Email atau password salah' });
        }

        res.status(200).json({
            message: 'Login berhasil!',
            user: {
                id: user.id,
                nama: user.nama,
                email: user.email,
                role: role
            }
        });

    } finally {
        connection.release();
    }
}));

app.post('/api/register/pelanggan', validateRequired(['nik', 'nama', 'alamat', 'no_telp', 'email', 'password']), asyncHandler(async (req, res) => {
    const { nik, nama, alamat, no_telp, email, password } = req.body;

    // Validate password strength (minimal 6 karakter)
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const connection = await dbPool.getConnection();

    try {
        await connection.execute(
            "INSERT INTO pelanggan (nik, nama, alamat, no_telp, email, password) VALUES (?, ?, ?, ?, ?, ?)",
            [nik, nama, alamat, no_telp, email, hashedPassword]
        );

        res.status(201).json({ message: 'Registrasi pelanggan berhasil!' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email atau NIK sudah terdaftar' });
        }
        throw error;
    } finally {
        connection.release();
    }
}));

app.post('/api/register/supplier', validateRequired(['nama', 'alamat', 'no_telp', 'email', 'password', 'no_rekening']), asyncHandler(async (req, res) => {
    const { nama, alamat, no_telp, email, password, no_rekening } = req.body;

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const connection = await dbPool.getConnection();

    try {
        await connection.execute(
            "INSERT INTO supplier (nama, alamat, no_telp, email, password, no_rekening) VALUES (?, ?, ?, ?, ?, ?)",
            [nama, alamat, no_telp, email, hashedPassword, no_rekening]
        );

        res.status(201).json({ message: 'Registrasi supplier berhasil!' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email sudah terdaftar' });
        }
        throw error;
    } finally {
        connection.release();
    }
}));

// === MOBIL ROUTES ===
app.get('/api/mobil', asyncHandler(async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.execute(
            "SELECT id_mobil, merk, tipe, tahun, tarif_per_hari, foto FROM mobil WHERE status_mobil = 'tersedia' ORDER BY id_mobil DESC"
        );
        res.json(rows);
    } finally {
        connection.release();
    }
}));

app.get('/api/mobil/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const connection = await dbPool.getConnection();

    try {
        const [rows] = await connection.execute(
            'SELECT * FROM mobil WHERE id_mobil = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Mobil tidak ditemukan' });
        }

        res.json(rows[0]);
    } finally {
        connection.release();
    }
}));

// === BOOKING ROUTES WITH RACE CONDITION PREVENTION ===
app.post('/api/booking', validateRequired(['nik', 'id_mobil', 'tanggal_mulai', 'tanggal_selesai']), asyncHandler(async (req, res) => {
    const { nik, id_mobil, tanggal_mulai, tanggal_selesai } = req.body;

    // Validate dates
    const startDate = new Date(tanggal_mulai);
    const endDate = new Date(tanggal_selesai);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
        return res.status(400).json({ message: 'Tanggal mulai tidak boleh kurang dari hari ini' });
    }

    if (endDate <= startDate) {
        return res.status(400).json({ message: 'Tanggal selesai harus setelah tanggal mulai' });
    }

    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();

        // Lock the car row to prevent race conditions
        const [carRows] = await connection.execute(
            'SELECT id_mobil, tarif_per_hari, status_mobil FROM mobil WHERE id_mobil = ? FOR UPDATE',
            [id_mobil]
        );

        if (carRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Mobil tidak ditemukan' });
        }

        const car = carRows[0];
        if (car.status_mobil !== 'tersedia') {
            await connection.rollback();
            return res.status(409).json({ message: 'Mobil tidak tersedia' });
        }

        // Check for overlapping bookings
        const [overlappingBookings] = await connection.execute(
            `SELECT id_booking FROM booking 
             WHERE id_mobil = ? 
             AND status_booking NOT IN ('dibatalkan', 'selesai')
             AND (
                 (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
                 (tanggal_mulai <= ? AND tanggal_selesai >= ?) OR
                 (tanggal_mulai >= ? AND tanggal_selesai <= ?)
             )`,
            [id_mobil, tanggal_mulai, tanggal_mulai, tanggal_selesai, tanggal_selesai, tanggal_mulai, tanggal_selesai]
        );

        if (overlappingBookings.length > 0) {
            await connection.rollback();
            return res.status(409).json({ message: 'Mobil sudah dibooking untuk tanggal tersebut' });
        }

        // Calculate total cost
        const [durationRows] = await connection.execute(
            'SELECT DATEDIFF(?, ?) AS durasi',
            [tanggal_selesai, tanggal_mulai]
        );

        const duration = durationRows[0].durasi;
        const totalCost = duration * car.tarif_per_hari;

        // Insert booking
        const [result] = await connection.execute(
            'INSERT INTO booking (nik, id_mobil, tanggal_mulai, tanggal_selesai, total_biaya, status_booking) VALUES (?, ?, ?, ?, ?, ?)',
            [nik, id_mobil, tanggal_mulai, tanggal_selesai, totalCost, 'menunggu pembayaran']
        );

        await connection.commit();

        res.status(201).json({
            message: 'Booking berhasil dibuat!',
            bookingId: result.insertId,
            totalBiaya: totalCost
        });

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

// === PAYMENT ROUTES ===
app.post('/api/pembayaran', upload.single('bukti_pembayaran'), validateRequired(['id_booking']), asyncHandler(async (req, res) => {
    const { id_booking } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Bukti pembayaran diperlukan' });
    }

    const buktiPath = `uploads/${req.file.filename}`;
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();

        // Check if booking exists and is waiting for payment
        const [bookingRows] = await connection.execute(
            'SELECT id_booking, status_booking FROM booking WHERE id_booking = ? FOR UPDATE',
            [id_booking]
        );

        if (bookingRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Booking tidak ditemukan' });
        }

        if (bookingRows[0].status_booking !== 'menunggu pembayaran') {
            await connection.rollback();
            return res.status(400).json({ message: 'Booking tidak dalam status menunggu pembayaran' });
        }

        // Insert payment record
        await connection.execute(
            "INSERT INTO pembayaran (id_booking, metode, bukti_pembayaran, status_pembayaran) VALUES (?, ?, ?, ?)",
            [id_booking, 'Transfer Bank', buktiPath, 'menunggu verifikasi']
        );

        // Update booking status
        await connection.execute(
            "UPDATE booking SET status_booking = 'menunggu verifikasi' WHERE id_booking = ?",
            [id_booking]
        );

        await connection.commit();

        res.status(201).json({ message: 'Pembayaran berhasil diupload dan menunggu verifikasi!' });

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

// === ADMIN ROUTES ===
app.get('/api/pendaftaran-mobil/pending', asyncHandler(async (req, res) => {
    const connection = await dbPool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT p.*, s.nama AS nama_supplier
             FROM pendaftaran_mobil p
             JOIN supplier s ON p.id_supplier = s.id_supplier
             WHERE p.status_verifikasi = 'menunggu'
             ORDER BY p.tanggal_daftar ASC`
        );
        res.json(rows);
    } finally {
        connection.release();
    }
}));

app.post('/api/pendaftaran-mobil/verify', validateRequired(['pendaftaran_id', 'action']), asyncHandler(async (req, res) => {
    const { pendaftaran_id, action, catatan } = req.body;
    const admin_id = 1; // Should come from authentication

    if (!['diterima', 'ditolak'].includes(action)) {
        return res.status(400).json({ message: 'Action harus "diterima" atau "ditolak"' });
    }

    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();

        // Get pendaftaran data
        const [pendaftaranRows] = await connection.execute(
            "SELECT * FROM pendaftaran_mobil WHERE id_pendaftaran = ? AND status_verifikasi = 'menunggu'",
            [pendaftaran_id]
        );

        if (pendaftaranRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Pendaftaran tidak ditemukan atau sudah diverifikasi' });
        }

        const pendaftaran = pendaftaranRows[0];

        // Update pendaftaran status
        await connection.execute(
            "UPDATE pendaftaran_mobil SET status_verifikasi = ?, catatan_verifikasi = ?, id_admin = ?, tanggal_verifikasi = NOW() WHERE id_pendaftaran = ?",
            [action, catatan, admin_id, pendaftaran_id]
        );

        // If approved, add to mobil table
        if (action === 'diterima') {
            await connection.execute(
                `INSERT INTO mobil (id_supplier, merk, tipe, tahun, tarif_per_hari, foto, status_mobil) 
                 VALUES (?, ?, ?, ?, ?, ?, 'tersedia')`,
                [pendaftaran.id_supplier, pendaftaran.merk, pendaftaran.tipe, pendaftaran.tahun, pendaftaran.tarif_per_hari, pendaftaran.foto]
            );
        }

        await connection.commit();

        res.json({ message: `Pendaftaran mobil #${pendaftaran_id} telah ${action}` });

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

// === SUPPLIER ROUTES ===
app.post('/api/pendaftaran-mobil', upload.single('foto'), validateRequired(['id_supplier', 'merk', 'tipe', 'tahun', 'tarif_per_hari']), asyncHandler(async (req, res) => {
    const { id_supplier, merk, tipe, tahun, tarif_per_hari } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Foto mobil diperlukan' });
    }

    const foto = `uploads/${req.file.filename}`;
    const connection = await dbPool.getConnection();

    try {
        await connection.execute(
            `INSERT INTO pendaftaran_mobil (id_supplier, merk, tipe, tahun, tarif_per_hari, foto, status_verifikasi, tanggal_daftar) 
             VALUES (?, ?, ?, ?, ?, ?, 'menunggu', NOW())`,
            [id_supplier, merk, tipe, tahun, tarif_per_hari, foto]
        );

        res.status(201).json({ message: 'Pendaftaran mobil berhasil diajukan dan menunggu verifikasi admin' });

    } finally {
        connection.release();
    }
}));

// === ERROR HANDLING MIDDLEWARE ===
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File terlalu besar (maksimal 5MB)' });
        }
    }

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Data sudah ada' });
    }

    res.status(500).json({
        message: 'Terjadi kesalahan pada server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// === STATIC FILE SERVING ===
// Serve static files (harus di akhir setelah semua API routes)
app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ message: 'API endpoint tidak ditemukan' });
    }
});

// === SERVER STARTUP ===
const server = app.listen(PORT, () => {
    console.log(`🚀 Server CarsHub berjalan di http://localhost:${PORT}`);
    console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
});

// === GRACEFUL SHUTDOWN ===
const gracefulShutdown = () => {
    console.log('\n🔄 Shutting down gracefully...');

    server.close(() => {
        console.log('✅ HTTP server closed');

        dbPool.end(() => {
            console.log('✅ Database pool closed');
            process.exit(0);
        });
    });

    // Force close after 30 seconds
    setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});

module.exports = app;