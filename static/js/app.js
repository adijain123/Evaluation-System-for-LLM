// LLM Evaluation System - Frontend JavaScript
// Modern ES6+ JavaScript with comprehensive functionality

class LLMEvaluationApp {
    constructor() {
        this.charts = {};
        this.settings = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.initializeCharts();
    }

    bindEvents() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
        }

        // Mobile menu handling
        this.handleMobileMenu();

        // Form submissions
        this.bindFormEvents();

        // Search functionality
        this.bindSearchEvents();

        // Settings events
        this.bindSettingsEvents();
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
        
        // Save preference to localStorage if available
        try {
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        } catch (e) {
            // localStorage not available, continue without saving
        }
    }

    handleMobileMenu() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleMobile = (e) => {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.mobile-overlay');
            
            if (e.matches) {
                // Mobile view
                if (!overlay) {
                    const mobileOverlay = document.createElement('div');
                    mobileOverlay.className = 'mobile-overlay';
                    mobileOverlay.addEventListener('click', () => {
                        sidebar.classList.remove('mobile-open');
                        mobileOverlay.classList.remove('active');
                    });
                    document.body.appendChild(mobileOverlay);
                }
            }
        };
        
        mediaQuery.addListener(handleMobile);
        handleMobile(mediaQuery);
    }

    bindFormEvents() {
        // Generic form handler
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.api-form')) {
                e.preventDefault();
                this.handleFormSubmission(e.target);
            }
        });
    }

    bindSearchEvents() {
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            let timeout;
            input.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.handleSearch(e.target.value, e.target.dataset.searchType);
                }, 300);
            });
        });
    }

    bindSettingsEvents() {
        // Settings form handling
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', this.saveSettings.bind(this));
        }

        // Reset settings button
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', this.resetSettings.bind(this));
        }

        // Threshold sliders
        const thresholdSliders = document.querySelectorAll('.threshold-slider');
        thresholdSliders.forEach(slider => {
            slider.addEventListener('input', this.updateThresholdDisplay.bind(this));
        });

        // Metric checkboxes
        const metricCheckboxes = document.querySelectorAll('.metric-checkbox');
        metricCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', this.toggleMetric.bind(this));
        });
    }

    async loadSettings() {
        try {
            const response = await this.apiRequest('/api/settings');
            this.settings = response.settings;
            this.updateSettingsUI();
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    updateSettingsUI() {
        if (!this.settings) return;

        // Update metric checkboxes
        Object.entries(this.settings.metrics).forEach(([metric, enabled]) => {
            const checkbox = document.getElementById(`metric_${metric}`);
            if (checkbox) {
                checkbox.checked = enabled;
            }
        });

        // Update threshold sliders
        Object.entries(this.settings.thresholds).forEach(([metric, value]) => {
            const slider = document.getElementById(`threshold_${metric}`);
            const display = document.getElementById(`threshold_${metric}_display`);
            if (slider) {
                slider.value = value;
                if (display) {
                    display.textContent = value.toFixed(2);
                }
            }
        });

        // Update improvement loop settings
        const enableLoop = document.getElementById('enable_improvement_loop');
        if (enableLoop) {
            enableLoop.checked = this.settings.improvement_loop.enabled;
        }

        const retryThreshold = document.getElementById('retry_threshold');
        if (retryThreshold) {
            retryThreshold.value = this.settings.improvement_loop.retry_threshold;
        }

        const maxRetries = document.getElementById('max_retries');
        if (maxRetries) {
            maxRetries.value = this.settings.improvement_loop.max_retries;
        }
    }

    async submitFeedback(evalId, feedback) {
        try {
            await this.apiRequest('/api/feedback', {
                method: 'POST',
                body: JSON.stringify({ eval_id: evalId, feedback })
            });
            
            this.showToast('Feedback submitted successfully!', 'success');
            
            // Update UI to show feedback was submitted
            const feedbackBtns = document.querySelectorAll(`[data-eval-id="${evalId}"]`);
            feedbackBtns.forEach(btn => {
                if (btn.dataset.feedback === feedback) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
        } catch (error) {
            this.showToast(`Failed to submit feedback: ${error.message}`, 'error');
        }
    }

    async saveSettings(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const settings = {
            metrics: {},
            thresholds: {},
            improvement_loop: {}
        };

        // Collect metrics
        document.querySelectorAll('.metric-checkbox').forEach(checkbox => {
            const metric = checkbox.id.replace('metric_', '');
            settings.metrics[metric] = checkbox.checked;
        });

        // Collect thresholds
        document.querySelectorAll('.threshold-slider').forEach(slider => {
            const metric = slider.id.replace('threshold_', '');
            settings.thresholds[metric] = parseFloat(slider.value);
        });

        // Collect improvement loop settings
        settings.improvement_loop = {
            enabled: document.getElementById('enable_improvement_loop')?.checked || false,
            retry_threshold: parseFloat(document.getElementById('retry_threshold')?.value || 0.6),
            max_retries: parseInt(document.getElementById('max_retries')?.value || 2)
        };

        try {
            showLoading();
            await this.apiRequest('/api/settings', {
                method: 'POST',
                body: JSON.stringify(settings)
            });
            
            this.settings = settings;
            this.showToast('Settings saved successfully!', 'success');
            
        } catch (error) {
            this.showToast(`Failed to save settings: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    async resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        try {
            showLoading();
            const response = await this.apiRequest('/api/reset_settings', {
                method: 'POST'
            });
            
            this.settings = response.settings;
            this.updateSettingsUI();
            this.showToast('Settings reset to defaults!', 'success');
            
        } catch (error) {
            this.showToast(`Failed to reset settings: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    updateThresholdDisplay(e) {
        const slider = e.target;
        const display = document.getElementById(`${slider.id}_display`);
        if (display) {
            display.textContent = parseFloat(slider.value).toFixed(2);
        }
    }

    toggleMetric(e) {
        const checkbox = e.target;
        const metric = checkbox.id.replace('metric_', '');
        
        // Visual feedback
        const card = checkbox.closest('.metric-card');
        if (card) {
            card.classList.toggle('disabled', !checkbox.checked);
        }
    }

    handleSearch(query, type) {
        if (type === 'results') {
            this.searchResults(query);
        }
    }

    searchResults(query) {
        const resultRows = document.querySelectorAll('.result-row');
        const normalizedQuery = query.toLowerCase().trim();
        
        resultRows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = !normalizedQuery || text.includes(normalizedQuery);
            row.style.display = shouldShow ? '' : 'none';
        });

        // Update results count
        const visibleRows = document.querySelectorAll('.result-row:not([style*="display: none"])');
        const countElement = document.getElementById('resultsCount');
        if (countElement) {
            countElement.textContent = `${visibleRows.length} results found`;
        }
    }

    initializeCharts() {
        // Initialize dashboard charts if on dashboard page
        if (window.location.pathname === '/' || window.location.pathname.includes('dashboard')) {
            this.initializeDashboardCharts();
        }
    }

    initializeDashboardCharts() {
        // Quality metrics over time chart
        const qualityChartCtx = document.getElementById('qualityChart');
        if (qualityChartCtx && window.chartData) {
            this.charts.quality = new Chart(qualityChartCtx, {
                type: 'line',
                data: {
                    labels: window.chartData.map(d => new Date(d.date).toLocaleDateString()),
                    datasets: [{
                        label: 'Overall Quality',
                        data: window.chartData.map(d => d.score * 100),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#b4b4c7'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: { color: '#8a8a9a' },
                            grid: { color: '#2d2d3a' }
                        },
                        y: {
                            ticks: { 
                                color: '#8a8a9a',
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            grid: { color: '#2d2d3a' },
                            min: 0,
                            max: 100
                        }
                    }
                }
            });
        }

        // Feedback distribution chart
        const feedbackChartCtx = document.getElementById('feedbackChart');
        if (feedbackChartCtx && window.feedbackData) {
            this.charts.feedback = new Chart(feedbackChartCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Positive', 'Negative'],
                    datasets: [{
                        data: [window.feedbackData.positive, window.feedbackData.negative],
                        backgroundColor: ['#22c55e', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#b4b4c7',
                                padding: 20
                            }
                        }
                    }
                }
            });
        }
    }

    // Utility methods
    async apiRequest(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    formatScore(score) {
        return (score * 100).toFixed(1) + '%';
    }

    getScoreClass(score) {
        if (score >= 0.8) return 'success';
        if (score >= 0.6) return 'warning';
        if (score >= 0.4) return 'fair';
        return 'error';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('Copied to clipboard!', 'success');
        } catch (err) {
            this.showToast('Failed to copy to clipboard', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 5000);
        }
    }

    getToastIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Global utility functions (for backward compatibility and external use)
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function showToast(message, type = 'info') {
    if (window.llmApp) {
        window.llmApp.showToast(message, type);
    }
}

function formatScore(score) {
    return (score * 100).toFixed(1) + '%';
}

function getScoreClass(score) {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    if (score >= 0.4) return 'fair';
    return 'error';
}

function getScoreLabel(score) {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Acceptable';
    if (score >= 0.4) return 'Below Average';
    return 'Poor';
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the main application
    window.llmApp = new LLMEvaluationApp();
    
    // Load sidebar state if available
    try {
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
        if (sidebarCollapsed === 'true') {
            document.querySelector('.sidebar')?.classList.add('collapsed');
            document.querySelector('.main-content')?.classList.add('expanded');
        }
    } catch (e) {
        // localStorage not available, continue without loading state
    }
    
    console.log('LLM Evaluation System initialized successfully!');
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMEvaluationApp;
}