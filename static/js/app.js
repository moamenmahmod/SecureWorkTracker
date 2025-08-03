// Global app utilities and common functionality

class CyberTracker {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupTooltips();
        this.setupAnimations();
        this.setupFormValidation();
        this.bindEvents();
    }
    
    setupTooltips() {
        // Initialize Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }
    
    setupAnimations() {
        // Add slide-up animation to cards when they come into view
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('slide-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.cyber-card').forEach(card => {
            observer.observe(card);
        });
    }
    
    setupFormValidation() {
        // Enhanced form validation with cyber styling
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!form.checkValidity()) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Add cyber error styling
                    const invalidInputs = form.querySelectorAll(':invalid');
                    invalidInputs.forEach(input => {
                        input.style.borderColor = 'var(--neon-red)';
                        input.style.boxShadow = '0 0 0 0.25rem rgba(255, 0, 64, 0.25)';
                    });
                }
                
                form.classList.add('was-validated');
            });
            
            // Remove error styling on input
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    if (input.validity.valid) {
                        input.style.borderColor = '';
                        input.style.boxShadow = '';
                    }
                });
            });
        });
    }
    
    bindEvents() {
        // Global event bindings
        document.addEventListener('DOMContentLoaded', () => {
            // Auto-hide alerts after 5 seconds
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                setTimeout(() => {
                    if (alert && alert.parentNode) {
                        alert.style.opacity = '0';
                        alert.style.transform = 'translateY(-20px)';
                        setTimeout(() => {
                            alert.remove();
                        }, 300);
                    }
                }, 5000);
            });
        });
        
        // Handle button loading states
        document.addEventListener('click', (e) => {
            if (e.target.matches('button[type="submit"]') || e.target.matches('.btn[type="submit"]')) {
                const button = e.target;
                const originalText = button.innerHTML;
                
                button.disabled = true;
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                
                // Re-enable after 3 seconds as fallback
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = originalText;
                }, 3000);
            }
        });
    }
    
    // Utility methods
    showToast(message, type = 'info') {
        const toastContainer = this.getOrCreateToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center cyber-alert ${type === 'error' ? 'alert-danger' : 'alert-success'} border-0`;
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            
            toast.addEventListener('hidden.bs.toast', () => {
                toast.remove();
            });
        } else {
            // Fallback without Bootstrap
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }
    
    getOrCreateToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    // API helper methods
    async apiCall(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            this.showToast('An error occurred. Please try again.', 'error');
            throw error;
        }
    }
}

// Progress bar animation utility
class ProgressAnimator {
    static animateProgress(element, targetWidth, duration = 1000) {
        const startWidth = parseFloat(element.style.width) || 0;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const currentWidth = startWidth + (targetWidth - startWidth) * easeOut;
            element.style.width = `${currentWidth}%`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// Counter animation utility
class CounterAnimator {
    static animateCounter(element, targetValue, duration = 1000, suffix = '') {
        const startValue = parseFloat(element.textContent) || 0;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = startValue + (targetValue - startValue) * easeOut;
            element.textContent = Math.round(currentValue) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// Initialize the app
const cyberTracker = new CyberTracker();

// Export for global use
window.CyberTracker = cyberTracker;
window.ProgressAnimator = ProgressAnimator;
window.CounterAnimator = CounterAnimator;

// Dark mode toggle (if needed in future)
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Load saved theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
});
