from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

class Challenge(db.Model):
    __tablename__ = 'challenges'
    
    id = db.Column(db.Integer, primary_key=True)
    days = db.Column(db.Integer, nullable=False)
    target_money = db.Column(db.Float, nullable=True)
    target_vulns = db.Column(db.Integer, nullable=True)
    start_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    end_time = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    work_sessions = db.relationship('WorkSession', backref='challenge', lazy=True, cascade='all, delete-orphan')
    vulnerabilities = db.relationship('Vulnerability', backref='challenge', lazy=True, cascade='all, delete-orphan')
    activity_logs = db.relationship('ActivityLog', backref='challenge', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'days': self.days,
            'target_money': self.target_money,
            'target_vulns': self.target_vulns,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'created_at': self.created_at,
            'is_active': self.is_active
        }

class WorkSession(db.Model):
    __tablename__ = 'work_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    minutes = db.Column(db.Integer, default=0)
    last_activity = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Unique constraint to ensure one session per challenge per day
    __table_args__ = (db.UniqueConstraint('challenge_id', 'date', name='unique_challenge_date'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'date': self.date,
            'minutes': self.minutes,
            'last_activity': self.last_activity,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

class Vulnerability(db.Model):
    __tablename__ = 'vulnerabilities'
    
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    severity = db.Column(db.String(50), nullable=False)  # Critical, High, Medium, Low
    company = db.Column(db.String(200), nullable=True)
    bounty = db.Column(db.Float, default=0.0)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'title': self.title,
            'severity': self.severity,
            'company': self.company,
            'bounty': self.bounty,
            'description': self.description,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenges.id'), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    activity_type = db.Column(db.String(100), default='work_session')
    extra_data = db.Column(db.JSON, nullable=True)  # Additional data as JSON
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'timestamp': self.timestamp,
            'activity_type': self.activity_type,
            'extra_data': self.extra_data
        }