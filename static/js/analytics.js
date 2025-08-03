// Analytics and charting functionality

class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.colors = {
            primary: '#00bfff',
            success: '#00ff9d',
            danger: '#ff0040',
            warning: '#ff9500',
            info: '#bf00ff',
            secondary: '#6c757d'
        };
        
        this.chartDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        font: {
                            family: 'Consolas, Monaco, Courier New, monospace'
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#ffffff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        };
    }
    
    createWorkHoursChart(ctx, data) {
        if (this.charts.workHours) {
            this.charts.workHours.destroy();
        }
        
        const dates = Object.keys(data).sort();
        const hours = dates.map(date => data[date]);
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, this.colors.primary + '80');
        gradient.addColorStop(1, this.colors.primary + '20');
        
        this.charts.workHours = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates.map(date => this.formatDate(date)),
                datasets: [{
                    label: 'Hours Worked',
                    data: hours,
                    backgroundColor: gradient,
                    borderColor: this.colors.primary,
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                ...this.chartDefaults,
                scales: {
                    ...this.chartDefaults.scales,
                    y: {
                        ...this.chartDefaults.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Hours',
                            color: '#ffffff'
                        }
                    }
                },
                plugins: {
                    ...this.chartDefaults.plugins,
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 23, 0.9)',
                        titleColor: this.colors.primary,
                        bodyColor: '#ffffff',
                        borderColor: this.colors.primary,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.y.toFixed(1)} hours worked`;
                            }
                        }
                    }
                }
            }
        });
        
        return this.charts.workHours;
    }
    
    createEarningsChart(ctx, data) {
        if (this.charts.earnings) {
            this.charts.earnings.destroy();
        }
        
        const dates = Object.keys(data).sort();
        const earnings = dates.map(date => data[date]);
        
        // Calculate cumulative earnings
        const cumulativeEarnings = [];
        let total = 0;
        earnings.forEach(amount => {
            total += amount;
            cumulativeEarnings.push(total);
        });
        
        this.charts.earnings = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => this.formatDate(date)),
                datasets: [
                    {
                        label: 'Daily Earnings',
                        data: earnings,
                        backgroundColor: this.colors.success + '40',
                        borderColor: this.colors.success,
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.colors.success,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Cumulative Earnings',
                        data: cumulativeEarnings,
                        backgroundColor: this.colors.primary + '20',
                        borderColor: this.colors.primary,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: this.colors.primary,
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                ...this.chartDefaults,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    ...this.chartDefaults.scales,
                    y: {
                        ...this.chartDefaults.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'USD ($)',
                            color: '#ffffff'
                        },
                        ticks: {
                            ...this.chartDefaults.scales.y.ticks,
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    ...this.chartDefaults.plugins,
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 23, 0.9)',
                        titleColor: this.colors.success,
                        bodyColor: '#ffffff',
                        borderColor: this.colors.success,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                return `${label}: $${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
        
        return this.charts.earnings;
    }
    
    createSeverityChart(ctx, data) {
        if (this.charts.severity) {
            this.charts.severity.destroy();
        }
        
        const labels = Object.keys(data);
        const values = Object.values(data);
        const total = values.reduce((sum, val) => sum + val, 0);
        
        // Filter out zero values
        const filteredData = labels.reduce((acc, label, index) => {
            if (values[index] > 0) {
                acc.labels.push(label);
                acc.values.push(values[index]);
            }
            return acc;
        }, { labels: [], values: [] });
        
        if (filteredData.values.length === 0) {
            // Show empty state
            ctx.canvas.parentElement.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No vulnerabilities found yet</p>
                </div>
            `;
            return null;
        }
        
        const severityColors = {
            'Critical': this.colors.danger,
            'High': this.colors.warning,
            'Medium': this.colors.info,
            'Low': this.colors.secondary
        };
        
        const backgroundColors = filteredData.labels.map(label => severityColors[label] || this.colors.secondary);
        
        this.charts.severity = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: filteredData.labels,
                datasets: [{
                    data: filteredData.values,
                    backgroundColor: backgroundColors,
                    borderColor: '#1a1a1a',
                    borderWidth: 3,
                    hoverBorderWidth: 4,
                    hoverBorderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff',
                            padding: 20,
                            font: {
                                family: 'Consolas, Monaco, Courier New, monospace',
                                size: 12
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, index) => {
                                    const value = data.datasets[0].data[index];
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return {
                                        text: `${label}: ${value} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[index],
                                        strokeStyle: data.datasets[0].backgroundColor[index],
                                        lineWidth: 2,
                                        hidden: false,
                                        index: index
                                    };
                                });
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 23, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.primary,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const label = context.label;
                                const value = context.parsed;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        return this.charts.severity;
    }
    
    createProductivityTrendChart(ctx, workData, earningsData) {
        if (this.charts.productivity) {
            this.charts.productivity.destroy();
        }
        
        const dates = [...new Set([...Object.keys(workData), ...Object.keys(earningsData)])].sort();
        
        const productivityData = dates.map(date => {
            const hours = workData[date] || 0;
            const earnings = earningsData[date] || 0;
            return hours > 0 ? earnings / hours : 0;
        });
        
        // Calculate moving average (3-day)
        const movingAverage = this.calculateMovingAverage(productivityData, 3);
        
        this.charts.productivity = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates.map(date => this.formatDate(date)),
                datasets: [
                    {
                        label: 'Daily $/Hour',
                        data: productivityData,
                        backgroundColor: this.colors.info + '20',
                        borderColor: this.colors.info,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: this.colors.info,
                        pointRadius: 4
                    },
                    {
                        label: '3-Day Average',
                        data: movingAverage,
                        backgroundColor: 'transparent',
                        borderColor: this.colors.primary,
                        borderWidth: 3,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                ...this.chartDefaults,
                scales: {
                    ...this.chartDefaults.scales,
                    y: {
                        ...this.chartDefaults.scales.y,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Earnings per Hour ($)',
                            color: '#ffffff'
                        },
                        ticks: {
                            ...this.chartDefaults.scales.y.ticks,
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    ...this.chartDefaults.plugins,
                    tooltip: {
                        backgroundColor: 'rgba(13, 17, 23, 0.9)',
                        titleColor: this.colors.info,
                        bodyColor: '#ffffff',
                        borderColor: this.colors.info,
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                return `${label}: $${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
        
        return this.charts.productivity;
    }
    
    generateInsights(data) {
        const insights = [];
        
        // Work hours insights
        const workDays = Object.keys(data.daily_work);
        const totalHours = Object.values(data.daily_work).reduce((sum, hours) => sum + hours, 0);
        const avgHoursPerDay = workDays.length > 0 ? totalHours / workDays.length : 0;
        
        if (avgHoursPerDay > 8) {
            insights.push({
                type: 'warning',
                icon: 'fas fa-exclamation-triangle',
                title: 'Work-Life Balance',
                message: `You're averaging ${avgHoursPerDay.toFixed(1)} hours per day. Consider taking breaks!`,
                color: this.colors.warning
            });
        } else if (avgHoursPerDay > 6) {
            insights.push({
                type: 'success',
                icon: 'fas fa-fire',
                title: 'Great Dedication',
                message: `Excellent work ethic! ${avgHoursPerDay.toFixed(1)} hours per day shows great commitment.`,
                color: this.colors.success
            });
        }
        
        // Earnings insights
        const totalEarnings = Object.values(data.daily_earnings).reduce((sum, earnings) => sum + earnings, 0);
        const hourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;
        
        if (hourlyRate > 150) {
            insights.push({
                type: 'success',
                icon: 'fas fa-trophy',
                title: 'Top Performer',
                message: `Outstanding! $${hourlyRate.toFixed(2)}/hour puts you in the top tier.`,
                color: this.colors.success
            });
        } else if (hourlyRate > 75) {
            insights.push({
                type: 'info',
                icon: 'fas fa-trending-up',
                title: 'Good Progress',
                message: `Solid earning rate of $${hourlyRate.toFixed(2)}/hour. Keep it up!`,
                color: this.colors.primary
            });
        }
        
        // Vulnerability insights
        const totalVulns = Object.values(data.severity_counts).reduce((sum, count) => sum + count, 0);
        const criticalCount = data.severity_counts.Critical || 0;
        
        if (totalVulns > 0) {
            const criticalPercentage = (criticalCount / totalVulns) * 100;
            
            if (criticalPercentage > 30) {
                insights.push({
                    type: 'success',
                    icon: 'fas fa-shield-alt',
                    title: 'Security Expert',
                    message: `${criticalPercentage.toFixed(0)}% critical findings shows excellent security skills!`,
                    color: this.colors.danger
                });
            }
            
            if (totalVulns >= 10) {
                insights.push({
                    type: 'info',
                    icon: 'fas fa-search',
                    title: 'Bug Hunter',
                    message: `${totalVulns} vulnerabilities found! You have a keen eye for security issues.`,
                    color: this.colors.info
                });
            }
        }
        
        // Streak analysis
        const workDates = Object.keys(data.daily_work).sort();
        const consecutiveDays = this.calculateConsecutiveDays(workDates);
        
        if (consecutiveDays >= 7) {
            insights.push({
                type: 'success',
                icon: 'fas fa-calendar-check',
                title: 'Consistency Champion',
                message: `${consecutiveDays} consecutive days! Consistency is key to success.`,
                color: this.colors.success
            });
        }
        
        return insights;
    }
    
    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    calculateMovingAverage(data, window) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < window - 1) {
                result.push(null);
            } else {
                const slice = data.slice(i - window + 1, i + 1);
                const average = slice.reduce((sum, val) => sum + val, 0) / window;
                result.push(average);
            }
        }
        return result;
    }
    
    calculateConsecutiveDays(dates) {
        if (dates.length === 0) return 0;
        
        dates.sort();
        let maxStreak = 1;
        let currentStreak = 1;
        
        for (let i = 1; i < dates.length; i++) {
            const prevDate = new Date(dates[i - 1]);
            const currentDate = new Date(dates[i]);
            const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }
        
        return maxStreak;
    }
    
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Export for global use
window.AnalyticsManager = AnalyticsManager;

// Global analytics manager instance
window.analyticsManager = new AnalyticsManager();
