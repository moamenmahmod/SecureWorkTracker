import os
import logging
import requests
from datetime import datetime, timedelta, date
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
# Removed ProxyFix import - not needed for local development
from sqlalchemy.exc import IntegrityError
from models import db, Challenge, WorkSession, Vulnerability, ActivityLog

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create the Flask app
app = Flask(__name__)
app.secret_key = "cybersec-tracker-local-dev-key-2025"
# Removed ProxyFix middleware - not needed for local development

# Configure the database - Local SQLite only
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///cybersec_tracker.db"
# SQLite doesn't need connection pooling options
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

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
    challenges = Challenge.query.order_by(Challenge.created_at.desc()).all()
    current_challenge = Challenge.query.filter_by(is_active=True).first()
    
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
        
        # Deactivate other challenges
        Challenge.query.filter_by(is_active=True).update({'is_active': False})
        
        # Create new challenge
        challenge = Challenge(
            days=days,
            target_money=float(target_money) if target_money else None,
            target_vulns=int(target_vulns) if target_vulns else None,
            start_time=cairo_time,
            end_time=cairo_time + timedelta(days=days),
            created_at=cairo_time,
            is_active=True
        )
        
        db.session.add(challenge)
        db.session.commit()
        
        flash('Challenge created successfully!', 'success')
        return redirect(url_for('challenge_page', challenge_id=challenge.id))
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error creating challenge: {e}")
        flash('Error creating challenge', 'error')
        return redirect(url_for('index'))

@app.route('/challenge/<int:challenge_id>')
def challenge_page(challenge_id):
    """Challenge tracking page"""
    challenge = Challenge.query.get_or_404(challenge_id)
    
    # Get vulnerabilities for this challenge
    vulnerabilities = Vulnerability.query.filter_by(challenge_id=challenge_id).order_by(Vulnerability.created_at.desc()).all()
    
    # Calculate earnings
    total_earned = sum(v.bounty for v in vulnerabilities)
    
    # Get today's work time
    today = get_cairo_time().date()
    today_session = WorkSession.query.filter_by(challenge_id=challenge_id, date=today).first()
    today_work_minutes = today_session.minutes if today_session else 0
    
    return render_template('challenge.html', 
                         challenge=challenge, 
                         vulnerabilities=vulnerabilities,
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
        
        # Verify challenge exists
        challenge = Challenge.query.get_or_404(challenge_id)
        
        vulnerability = Vulnerability(
            challenge_id=challenge_id,
            title=title,
            severity=severity,
            company=company,
            bounty=float(bounty) if bounty else 0,
            description=description,
            created_at=get_cairo_time()
        )
        
        db.session.add(vulnerability)
        db.session.commit()
        
        flash('Vulnerability added successfully!', 'success')
        return redirect(url_for('challenge_page', challenge_id=challenge_id))
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error adding vulnerability: {e}")
        flash('Error adding vulnerability', 'error')
        return redirect(url_for('challenge_page', challenge_id=request.form.get('challenge_id', 1)))

@app.route('/edit_vulnerability/<int:vuln_id>', methods=['POST'])
def edit_vulnerability(vuln_id):
    """Edit an existing vulnerability"""
    try:
        vulnerability = Vulnerability.query.get_or_404(vuln_id)
        
        vulnerability.title = request.form.get('title', vulnerability.title)
        vulnerability.severity = request.form.get('severity', vulnerability.severity)
        vulnerability.company = request.form.get('company', vulnerability.company)
        vulnerability.bounty = float(request.form.get('bounty', vulnerability.bounty))
        vulnerability.description = request.form.get('description', vulnerability.description)
        vulnerability.updated_at = get_cairo_time()
        
        db.session.commit()
        
        flash('Vulnerability updated successfully!', 'success')
        return redirect(url_for('challenge_page', challenge_id=vulnerability.challenge_id))
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error editing vulnerability: {e}")
        flash('Error updating vulnerability', 'error')
        return redirect(url_for('index'))

@app.route('/delete_vulnerability/<int:vuln_id>', methods=['POST'])
def delete_vulnerability(vuln_id):
    """Delete a vulnerability"""
    try:
        vulnerability = Vulnerability.query.get_or_404(vuln_id)
        challenge_id = vulnerability.challenge_id
        
        db.session.delete(vulnerability)
        db.session.commit()
        
        flash('Vulnerability deleted successfully!', 'success')
        return redirect(url_for('challenge_page', challenge_id=challenge_id))
        
    except Exception as e:
        db.session.rollback()
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
        
        # Verify challenge exists
        challenge = Challenge.query.get_or_404(challenge_id)
        
        now = get_cairo_time()
        today = now.date()
        
        # Find or create today's work session
        session = WorkSession.query.filter_by(challenge_id=challenge_id, date=today).first()
        
        if session:
            session.minutes += 5
            session.last_activity = now
            session.updated_at = now
        else:
            session = WorkSession(
                challenge_id=challenge_id,
                date=today,
                minutes=5,
                last_activity=now,
                created_at=now,
                updated_at=now
            )
            db.session.add(session)
        
        # Log the activity
        activity_log = ActivityLog(
            challenge_id=challenge_id,
            timestamp=now,
            activity_type='work_session'
        )
        db.session.add(activity_log)
        
        db.session.commit()
        
        return jsonify({'success': True, 'total_minutes': session.minutes})
        
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error logging activity: {e}")
        return jsonify({'error': 'Failed to log activity'}), 500

@app.route('/analytics')
def analytics():
    """Analytics and reporting page"""
    challenges = Challenge.query.order_by(Challenge.created_at.desc()).all()
    work_sessions = WorkSession.query.all()
    vulnerabilities = Vulnerability.query.all()
    
    return render_template('analytics.html', 
                         challenges=challenges,
                         work_sessions=work_sessions,
                         vulnerabilities=vulnerabilities)

@app.route('/api/analytics_data/<int:challenge_id>')
def get_analytics_data(challenge_id):
    """Get analytics data for charts"""
    # Verify challenge exists
    challenge = Challenge.query.get_or_404(challenge_id)
    
    # Work sessions data
    sessions = WorkSession.query.filter_by(challenge_id=challenge_id).all()
    
    # Vulnerabilities data
    vulnerabilities = Vulnerability.query.filter_by(challenge_id=challenge_id).all()
    
    # Daily work hours
    daily_work = {}
    for session in sessions:
        date_str = session.date.strftime('%Y-%m-%d')
        daily_work[date_str] = session.minutes / 60  # Convert to hours
    
    # Vulnerability severity breakdown
    severity_counts = {'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0}
    daily_earnings = {}
    
    for vuln in vulnerabilities:
        severity_counts[vuln.severity] += 1
        date_str = vuln.created_at.strftime('%Y-%m-%d')
        if date_str not in daily_earnings:
            daily_earnings[date_str] = 0
        daily_earnings[date_str] += vuln.bounty
    
    return jsonify({
        'daily_work': daily_work,
        'severity_counts': severity_counts,
        'daily_earnings': daily_earnings
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
