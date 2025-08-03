// Activity tracking system for automatic work time logging

class ActivityTracker {
    constructor(challengeId) {
        this.challengeId = challengeId;
        this.isActive = false;
        this.lastActivityTime = Date.now();
        this.activityBuffer = [];
        this.checkInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.activityTimeout = 30 * 1000; // 30 seconds without activity = inactive
        this.intervalId = null;
        this.paused = false;
        
        this.bindActivityListeners();
        this.loadState();
    }
    
    bindActivityListeners() {
        // Track various user activities
        const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        activities.forEach(activity => {
            document.addEventListener(activity, () => {
                if (!this.paused) {
                    this.recordActivity();
                }
            }, true);
        });
        
        // Track window focus/blur
        window.addEventListener('focus', () => {
            if (!this.paused) {
                this.recordActivity();
            }
        });
        
        window.addEventListener('blur', () => {
            // User switched to another window/tab
            this.lastActivityTime = 0; // Mark as inactive
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.lastActivityTime = 0; // Mark as inactive
            } else if (!this.paused) {
                this.recordActivity();
            }
        });
    }
    
    recordActivity() {
        this.lastActivityTime = Date.now();
        this.isActive = true;
        this.updateActivityStatus();
    }
    
    updateActivityStatus() {
        const statusElement = document.getElementById('activity-status');
        if (statusElement) {
            const now = Date.now();
            const timeSinceActivity = now - this.lastActivityTime;
            
            if (this.paused) {
                statusElement.innerHTML = '<i class="fas fa-pause text-warning"></i><span>Paused</span>';
                statusElement.className = 'activity-status paused';
            } else if (timeSinceActivity < this.activityTimeout) {
                statusElement.innerHTML = '<i class="fas fa-circle text-neon-green"></i><span>Active</span>';
                statusElement.className = 'activity-status active';
            } else {
                statusElement.innerHTML = '<i class="fas fa-circle text-muted"></i><span>Inactive</span>';
                statusElement.className = 'activity-status inactive';
            }
        }
    }
    
    start() {
        if (this.intervalId) {
            this.stop();
        }
        
        console.log('Activity tracker started for challenge', this.challengeId);
        
        // Check activity every 5 minutes
        this.intervalId = setInterval(() => {
            this.checkAndLogActivity();
        }, this.checkInterval);
        
        // Update status every second
        this.statusInterval = setInterval(() => {
            this.updateActivityStatus();
        }, 1000);
        
        this.updateActivityStatus();
        this.saveState();
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
        
        console.log('Activity tracker stopped');
        this.saveState();
    }
    
    pause() {
        this.paused = true;
        this.updateActivityStatus();
        this.saveState();
        
        if (window.CyberTracker) {
            window.CyberTracker.showToast('Work tracking paused', 'info');
        }
    }
    
    resume() {
        this.paused = false;
        this.recordActivity(); // Record activity when resuming
        this.saveState();
        
        if (window.CyberTracker) {
            window.CyberTracker.showToast('Work tracking resumed', 'success');
        }
    }
    
    toggle() {
        if (this.paused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    async checkAndLogActivity() {
        if (this.paused) {
            return;
        }
        
        const now = Date.now();
        const timeSinceActivity = now - this.lastActivityTime;
        
        // If user was active in the last 5 minutes, log the session
        if (timeSinceActivity < this.checkInterval) {
            try {
                const response = await fetch('/log_activity', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        challenge_id: this.challengeId
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.updateWorkTimeDisplay(data.total_minutes);
                    
                    // Show encouraging message occasionally
                    if (data.total_minutes % 60 === 5) { // Every hour + 5 minutes
                        const hours = Math.floor(data.total_minutes / 60);
                        if (window.CyberTracker) {
                            window.CyberTracker.showToast(
                                `Great work! ${hours} hour${hours !== 1 ? 's' : ''} logged today`, 
                                'success'
                            );
                        }
                    }
                    
                    console.log(`Activity logged: ${data.total_minutes} minutes today`);
                } else {
                    console.error('Failed to log activity:', response.statusText);
                }
            } catch (error) {
                console.error('Error logging activity:', error);
            }
        } else {
            console.log('No activity detected in the last 5 minutes');
        }
    }
    
    updateWorkTimeDisplay(totalMinutes) {
        const element = document.getElementById('today-work-time');
        if (element) {
            const hours = (totalMinutes / 60).toFixed(1);
            
            // Animate the update
            if (window.CounterAnimator) {
                window.CounterAnimator.animateCounter(
                    element, 
                    parseFloat(hours), 
                    500, 
                    ' hours'
                );
            } else {
                element.textContent = `${hours} hours`;
            }
        }
    }
    
    saveState() {
        const state = {
            challengeId: this.challengeId,
            paused: this.paused,
            lastActivityTime: this.lastActivityTime,
            timestamp: Date.now()
        };
        
        localStorage.setItem('activityTrackerState', JSON.stringify(state));
    }
    
    loadState() {
        try {
            const saved = localStorage.getItem('activityTrackerState');
            if (saved) {
                const state = JSON.parse(saved);
                
                // Only restore if it's for the same challenge and recent (within 1 hour)
                if (state.challengeId === this.challengeId) {
                    const timeSinceSave = Date.now() - state.timestamp;
                    if (timeSinceSave < 60 * 60 * 1000) { // 1 hour
                        this.paused = state.paused;
                        this.lastActivityTime = state.lastActivityTime;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading activity tracker state:', error);
        }
    }
    
    // Public method to get current stats
    getStats() {
        const now = Date.now();
        const timeSinceActivity = now - this.lastActivityTime;
        
        return {
            isActive: timeSinceActivity < this.activityTimeout,
            isPaused: this.paused,
            lastActivity: this.lastActivityTime,
            timeSinceActivity: timeSinceActivity
        };
    }
}

// Add pause/resume controls to the UI
function addActivityControls() {
    const controlsContainer = document.querySelector('.work-time-section');
    if (controlsContainer && !document.getElementById('activity-controls')) {
        const controls = document.createElement('div');
        controls.id = 'activity-controls';
        controls.className = 'mt-2';
        controls.innerHTML = `
            <button type="button" class="btn btn-sm cyber-btn-outline" onclick="toggleActivityTracking()">
                <i class="fas fa-pause"></i> <span id="pause-text">Pause</span>
            </button>
        `;
        controlsContainer.appendChild(controls);
    }
}

// Global function to toggle tracking
window.toggleActivityTracking = function() {
    if (window.activityTracker) {
        window.activityTracker.toggle();
        
        const pauseText = document.getElementById('pause-text');
        const icon = document.querySelector('#activity-controls i');
        
        if (window.activityTracker.paused) {
            pauseText.textContent = 'Resume';
            icon.className = 'fas fa-play';
        } else {
            pauseText.textContent = 'Pause';
            icon.className = 'fas fa-pause';
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add controls to the UI
    addActivityControls();
    
    // The activity tracker will be initialized from the challenge page
    // when the challenge ID is available
});

// Export for global use
window.ActivityTracker = ActivityTracker;
