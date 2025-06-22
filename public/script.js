document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('pickup-date').min = today;
    document.getElementById('return-date').min = today;

    // Update return date minimum when pickup date changes
    document.getElementById('pickup-date').addEventListener('change', function () {
        document.getElementById('return-date').min = this.value;
    });

    // Load cars
    fetchAndDisplayCars();

    // Handle search form
    document.getElementById('search-form').addEventListener('submit', function (e) {
        e.preventDefault();
        // Implement search functionality here
        console.log('Search triggered');
    });
});

async function fetchAndDisplayCars() {
    const carsContainer = document.getElementById('cars-container');
    const loadingState = document.getElementById('loading-state');

    try {
        const response = await fetch('/api/mobil');
        const cars = await response.json();

        // Remove loading state
        loadingState.remove();

        if (cars.length === 0) {
            carsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-car empty-icon"></i>
                            <h3>Belum Ada Mobil Tersedia</h3>
                            <p>Maaf, saat ini belum ada mobil yang tersedia untuk disewa.</p>
                        </div>
                    `;
            return;
        }

        // Clear container
        carsContainer.innerHTML = '';

        // Create car cards
        cars.forEach((car, index) => {
            const carCard = document.createElement('a');
            carCard.href = `detail.html?id=${car.id_mobil}`;
            carCard.className = 'car-card';
            carCard.style.animationDelay = `${index * 0.1}s`;

            const imageUrl = car.foto || 'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=240&fit=crop&auto=format';

            carCard.innerHTML = `
                        <img src="${imageUrl}" alt="${car.merk} ${car.tipe}" class="car-image" 
                             onerror="this.src='https://images.unsplash.com/photo-1494905998402-395d579af36f?w=400&h=240&fit=crop&auto=format'">
                        <div class="car-content">
                            <h3 class="car-title">${car.merk} ${car.tipe}</h3>
                            <p class="car-year">Tahun ${car.tahun}</p>
                            
                            <div class="car-footer">
                                <div class="car-price">
                                    Rp ${new Intl.NumberFormat('id-ID').format(car.tarif_per_hari)}
                                    <span class="price-unit">/ hari</span>
                                </div>
                                <div class="availability-badge">
                                    <i class="fas fa-check-circle"></i>
                                    Tersedia
                                </div>
                            </div>
                        </div>
                    `;

            carsContainer.appendChild(carCard);
        });

    } catch (error) {
        console.error('Error fetching cars:', error);
        loadingState.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle empty-icon" style="color: var(--danger-color);"></i>
                        <h3>Gagal Memuat Data</h3>
                        <p>Terjadi kesalahan saat memuat data mobil. Silakan coba lagi nanti.</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="fas fa-redo"></i>
                            Muat Ulang
                        </button>
                    </div>
                `;
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = 'var(--shadow)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});