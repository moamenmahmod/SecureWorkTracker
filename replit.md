# Overview

CyberSec Work Tracker is a Flask-based web application designed for tracking cybersecurity bug bounty challenges. The application enables users to create time-bound challenges, automatically track work sessions through activity monitoring, manage vulnerability discoveries with bounty earnings, and analyze productivity through comprehensive analytics dashboards. The app features a cybersecurity-themed dark UI with neon accents and real-time progress tracking.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Template Engine**: Jinja2 templates with Bootstrap 5 for responsive design
- **Styling**: Custom CSS with cybersecurity theme using CSS variables for neon colors and dark backgrounds
- **JavaScript Modules**: Modular architecture with separate files for activity tracking, analytics, and core app functionality
- **Real-time Updates**: Client-side timers and activity monitoring with periodic server synchronization
- **Responsive Design**: Mobile-first approach using Bootstrap grid system

## Backend Architecture
- **Framework**: Flask with SQLAlchemy ORM for database operations
- **Database**: PostgreSQL with SQLAlchemy models for persistent data storage
- **Session Management**: Flask sessions with configurable secret key from environment variables
- **Time Management**: Cairo timezone integration using World Time API with UTC+2 fallback
- **Activity Tracking**: 5-minute interval monitoring system for automatic work time calculation

## Data Models (PostgreSQL)
- **Challenge**: Core entity with days, target money, target vulnerabilities, timestamps, and active status
- **WorkSession**: Time tracking data with unique constraint per challenge/date, stores minutes and activity timestamps
- **Vulnerability**: Bug reports with severity levels, company information, bounty amounts, and descriptions
- **ActivityLog**: Granular tracking of user interactions with JSON metadata support for work time calculation

## Security Considerations
- **Proxy Support**: ProxyFix middleware for handling reverse proxy headers
- **Input Validation**: Server-side validation for all user inputs
- **Session Security**: Secure session management with environment-based secret keys

# External Dependencies

## Core Framework Dependencies
- **Flask**: Web framework for Python backend
- **Werkzeug**: WSGI utilities including ProxyFix for proxy support

## Frontend Libraries
- **Bootstrap 5**: CSS framework for responsive design and dark theme support
- **Font Awesome 6**: Icon library for cybersecurity-themed interface elements
- **Chart.js**: JavaScript charting library for analytics visualizations

## External APIs
- **World Time API**: Real-time Cairo timezone synchronization with fallback mechanisms
  - Primary: `https://worldtimeapi.org/timezone/Africa/Cairo`
  - Fallback: `http://worldtimeapi.org/api/timezone/Africa/Cairo`

## Development Tools
- **Requests**: HTTP library for external API integration
- **Logging**: Python's built-in logging for debugging and monitoring

## Database Integration
- **PostgreSQL**: Production-ready database with full ACID compliance
- **SQLAlchemy ORM**: Provides database abstraction and relationship management
- **Migration Support**: Database schema changes tracked through SQLAlchemy models
- **Data Persistence**: All challenge data, work sessions, and vulnerabilities permanently stored

## Recent Updates (2025-08-03)
- **Database Migration**: Successfully migrated from in-memory storage to PostgreSQL
- **Enhanced Data Models**: Added proper relationships, constraints, and indexes
- **Improved Reliability**: Application now maintains data across server restarts
- **Better Performance**: Database queries optimized for analytics and reporting features