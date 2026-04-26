// ORGANIC LUXURY - Interactive JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initScrollEffects();
    initNavbar();
    initParallax();
    initProductCards();
    initNewsletterForm();
    initSmoothScroll();
});

// Navbar scroll effect
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });
}

// Scroll-triggered animations
function initScrollEffects() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe product cards
    document.querySelectorAll('.product-card, .service-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add animate-in class styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// Parallax effect for organic shapes
function initParallax() {
    const shapes = document.querySelectorAll('.organic-shape');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        shapes.forEach((shape, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = scrolled * speed;
            shape.style.transform = `translateY(${yPos}px) scale(${1 + Math.sin(scrolled * 0.001 + index) * 0.05})`;
        });
    }, { passive: true });
}

// Product card interactions
function initProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const image = card.querySelector('.product-image');
        let timeout;
        
        card.addEventListener('mouseenter', () => {
            clearTimeout(timeout);
            image.style.transform = 'scale(1.05)';
        });
        
        card.addEventListener('mouseleave', () => {
            timeout = setTimeout(() => {
                image.style.transform = 'scale(1)';
            }, 300);
        });
        
        // Quick view button
        const quickViewBtn = card.querySelector('.quick-view-btn');
        quickViewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productName = card.querySelector('.product-name').textContent;
            showNotification(`"${productName}" added to wishlist`);
        });
    });
}

// Newsletter form
function initNewsletterForm() {
    const form = document.querySelector('.newsletter-form');
    const input = document.querySelector('.newsletter-input');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = input.value.trim();
        if (email && isValidEmail(email)) {
            showNotification('Welcome to our world! Check your inbox.');
            input.value = '';
        }
    });
    
    // Real-time validation
    input.addEventListener('blur', () => {
        if (input.value && !isValidEmail(input.value)) {
            input.style.borderColor = '#ff6b6b';
        } else {
            input.style.borderColor = '';
        }
    });
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Notification system
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        background: 'var(--charcoal)',
        color: 'var(--cream)',
        padding: '16px 24px',
        borderRadius: '8px',
        fontSize: '0.9rem',
        zIndex: '1000',
        animation: 'slideIn 0.4s ease, fadeOut 0.4s ease 2.6s',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
    });
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Smooth scroll for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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
}

// Add subtle tilt effect to service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

// Animate numbers on scroll
function initNumberAnimation() {
    const animatedNumbers = document.querySelectorAll('[data-animate]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endValue = parseInt(target.dataset.animate);
                const duration = 2000;
                const startValue = 0;
                const startTime = performance.now();
                
                function update(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function
                    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                    const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutQuart);
                    
                    target.textContent = currentValue;
                    
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    }
                }
                
                requestAnimationFrame(update);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    animatedNumbers.forEach(num => observer.observe(num));
}

// Initialize number animation if needed
initNumberAnimation();
