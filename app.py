import os
import logging
import requests
from datetime import datetime, timedelta
from threading import Lock
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "cybersec-tracker-dev-key")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# In-memory data storage
data_lock = Lock()
app_data = {
    'challenges': [],
    'work_sessions': [],
    'vulnerabilities': [],
    'activity_logs': [],
    'current_challenge_id': None
}

def get_cairo_time():
    """Get current Cairo time from World Time API"""
    try:
        response = requests.get('https://worldtimeapi.org/timezone/Africa/Cairo', timeout=10)
        if response.status_code == 200:
            data = response.json()
            return datetime.fromisoformat(data['datetime'].replace('Z', '+00:00'))
        else:
            # Fallback API
            response = requests.get('http://worldtimeapi.org/api/timezone/Africa/Cairo', timeout=10)
            if response.status_code == 200:
                data = response.json()
                return datetime.fromisoformat(data['datetime'].replace('Z', '+00:00'))
    except Exception as e:
        logging.error(f"Error fetching Cairo time: {e}")
    
    # Fallback to UTC+2 (EET)
    return datetime.utcnow() + timedelta(hours=2)

@app.route('/')
def index():
    """Home page with challenge creation"""
    with data_lock:
        challenges = app_data['challenges']
        current_challenge = None
        if app_data['current_challenge_id']:
            current_challenge = next((c for c in challenges if c['id'] == app_data['current_challenge_id']), None)
    
    return render_template('index.html', challenges=challenges, current_challenge=current_challenge)

@app.route('/create_challenge', methods=['POST'])
def create_challenge():
    """Create a new bug bounty challenge"""
    try:
        days = int(request.form.get('days', 0))
        if days <= 0:
            flash('Number of days must be greater than 0', 'error')
            return redirect(url_for('index'))
        
        target_money = request.form.get('target_money')
        target_vulns = request.form.get('target_vulns')
        
        cairo_time = get_cairo_time()
        
        challenge = {
            'id': len(app_data['challenges']) + 1,
            'days': days,
            'target_money': float(target_money) if target_money else None,
            'target_vulns': int(target_vulns) if target_vulns else None,
            'start_time': cairo_time,
            'end_time': cairo_time + timedelta(days=days),
            'created_at': cairo_time,
            'is_active': True
        }
        
        with data_lock:
            # Deactivate other challenges
            for c in app_data['challenges']:
                c['is_active'] = False
            
            app_data['challenges'].append(challenge)
            app_data['current_challenge_id'] = challenge['id']
        
        flash('Challenge created successfully!', 'success')
        return redirect(url_for('challenge_page', challenge_id=challenge['id']))
        
    except Exception as e:
        logging.error(f"Error creating challenge: {e}")
        flash('Error creating challenge', 'error')
        return redirect(url_for('index'))

@app.route('/challenge/<int:challenge_id>')
def challenge_page(challenge_id):
    """Challenge tracking page"""
    with data_lock:
        challenge = next((c for c in app_data['challenges'] if c['id'] == challenge_id), None)
        if not challenge:
            flash('Challenge not found', 'error')
            return redirect(url_for('index'))
        
        # Get vulnerabilities for this challenge
        vulns = [v for v in app_data['vulnerabilities'] if v.get('challenge_id') == challenge_id]
        
        # Calculate earnings
        total_earned = sum(v.get('bounty', 0) for v in vulns)
        
        # Get today's work time
        today = get_cairo_time().date()
        today_sessions = [s for s in app_data['work_sessions'] 
                         if s.get('challenge_id') == challenge_id and s.get('date') == today]
        today_work_minutes = sum(s.get('minutes', 0) for s in today_sessions)
        
    return render_template('challenge.html', 
                         challenge=challenge, 
                         vulnerabilities=vulns,
                         total_earned=total_earned,
                         today_work_minutes=today_work_minutes)

@app.route('/add_vulnerability', methods=['POST'])
def add_vulnerability():
    """Add a new vulnerability"""
    try:
        challenge_id = int(request.form.get('challenge_id'))
        title = request.form.get('title', '').strip()
        severity = request.form.get('severity')
        company = request.form.get('company', '').strip()
        bounty = request.form.get('bounty', 0)
        description = request.form.get('description', '').strip()
        
        if not title:
            flash('Title is required', 'error')
            return redirect(url_for('challenge_page', challenge_id=challenge_id))
        
        vuln = {
            'id': len(app_data['vulnerabilities']) + 1,
            'challenge_id': challenge_id,
            'title': title,
            'severity': severity,
            'company': company,
            'bounty': float(bounty) if bounty else 0,
            'description': description,
            'created_at': get_cairo_time()
        }
        
        with data_lock:
            app_data['vulnerabilities'].append(vuln)
        
        flash('Vulnerability added successfully!', 'success')
        return redirect(url_for('challenge_page', challenge_id=challenge_id))
        
    except Exception as e:
        logging.error(f"Error adding vulnerability: {e}")
        flash('Error adding vulnerability', 'error')
        return redirect(url_for('challenge_page', challenge_id=request.form.get('challenge_id', 1)))

@app.route('/edit_vulnerability/<int:vuln_id>', methods=['POST'])
def edit_vulnerability(vuln_id):
    """Edit an existing vulnerability"""
    try:
        with data_lock:
            vuln = next((v for v in app_data['vulnerabilities'] if v['id'] == vuln_id), None)
            if not vuln:
                flash('Vulnerability not found', 'error')
                return redirect(url_for('index'))
            
            vuln['title'] = request.form.get('title', vuln['title'])
            vuln['severity'] = request.form.get('severity', vuln['severity'])
            vuln['company'] = request.form.get('company', vuln['company'])
            vuln['bounty'] = float(request.form.get('bounty', vuln['bounty']))
            vuln['description'] = request.form.get('description', vuln['description'])
            vuln['updated_at'] = get_cairo_time()
        
        flash('Vulnerability updated successfully!', 'success')
        return redirect(url_for('challenge_page', challenge_id=vuln['challenge_id']))
        
    except Exception as e:
        logging.error(f"Error editing vulnerability: {e}")
        flash('Error updating vulnerability', 'error')
        return redirect(url_for('index'))

@app.route('/delete_vulnerability/<int:vuln_id>', methods=['POST'])
def delete_vulnerability(vuln_id):
    """Delete a vulnerability"""
    try:
        with data_lock:
            vuln = next((v for v in app_data['vulnerabilities'] if v['id'] == vuln_id), None)
            if vuln:
                challenge_id = vuln['challenge_id']
                app_data['vulnerabilities'] = [v for v in app_data['vulnerabilities'] if v['id'] != vuln_id]
                flash('Vulnerability deleted successfully!', 'success')
                return redirect(url_for('challenge_page', challenge_id=challenge_id))
            else:
                flash('Vulnerability not found', 'error')
        
    except Exception as e:
        logging.error(f"Error deleting vulnerability: {e}")
        flash('Error deleting vulnerability', 'error')
    
    return redirect(url_for('index'))

@app.route('/log_activity', methods=['POST'])
def log_activity():
    """Log user activity for time tracking"""
    try:
        challenge_id = request.json.get('challenge_id')
        if not challenge_id:
            return jsonify({'error': 'No active challenge'}), 400
        
        now = get_cairo_time()
        today = now.date()
        
        # Add 5 minutes to today's work session
        with data_lock:
            # Find or create today's session
            session = next((s for s in app_data['work_sessions'] 
                           if s.get('challenge_id') == challenge_id and s.get('date') == today), None)
            
            if session:
                session['minutes'] += 5
                session['last_activity'] = now
            else:
                session = {
                    'id': len(app_data['work_sessions']) + 1,
                    'challenge_id': challenge_id,
                    'date': today,
                    'minutes': 5,
                    'last_activity': now
                }
                app_data['work_sessions'].append(session)
            
            # Log the activity
            app_data['activity_logs'].append({
                'id': len(app_data['activity_logs']) + 1,
                'challenge_id': challenge_id,
                'timestamp': now,
                'activity_type': 'work_session'
            })
        
        return jsonify({'success': True, 'total_minutes': session['minutes']})
        
    except Exception as e:
        logging.error(f"Error logging activity: {e}")
        return jsonify({'error': 'Failed to log activity'}), 500

@app.route('/analytics')
def analytics():
    """Analytics and reporting page"""
    with data_lock:
        challenges = app_data['challenges']
        work_sessions = app_data['work_sessions']
        vulnerabilities = app_data['vulnerabilities']
    
    return render_template('analytics.html', 
                         challenges=challenges,
                         work_sessions=work_sessions,
                         vulnerabilities=vulnerabilities)

@app.route('/api/analytics_data/<int:challenge_id>')
def get_analytics_data(challenge_id):
    """Get analytics data for charts"""
    with data_lock:
        # Work sessions data
        sessions = [s for s in app_data['work_sessions'] if s.get('challenge_id') == challenge_id]
        
        # Vulnerabilities data
        vulns = [v for v in app_data['vulnerabilities'] if v.get('challenge_id') == challenge_id]
        
        # Daily work hours
        daily_work = {}
        for session in sessions:
            date_str = session['date'].strftime('%Y-%m-%d')
            daily_work[date_str] = session['minutes'] / 60  # Convert to hours
        
        # Vulnerability severity breakdown
        severity_counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}
        daily_earnings = {}
        
        for vuln in vulns:
            severity_counts[vuln['severity']] += 1
            date_str = vuln['created_at'].strftime('%Y-%m-%d')
            if date_str not in daily_earnings:
                daily_earnings[date_str] = 0
            daily_earnings[date_str] += vuln.get('bounty', 0)
    
    return jsonify({
        'daily_work': daily_work,
        'severity_counts': severity_counts,
        'daily_earnings': daily_earnings
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
