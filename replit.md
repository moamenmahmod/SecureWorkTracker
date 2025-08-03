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
- **Framework**: Flask with minimal configuration for rapid development
- **Data Storage**: In-memory data structures with thread-safe operations using Python's threading.Lock
- **Session Management**: Flask sessions with configurable secret key from environment variables
- **Time Management**: Cairo timezone integration using World Time API with UTC+2 fallback
- **Activity Tracking**: 5-minute interval monitoring system for automatic work time calculation

## Data Models
- **Challenges**: Core entity containing days, target money, target vulnerabilities, and timestamps
- **Work Sessions**: Time tracking data linked to specific challenges and dates
- **Vulnerabilities**: Bug reports with severity levels, company information, and bounty amounts
- **Activity Logs**: Granular tracking of user interactions for work time calculation

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

Note: The application currently uses in-memory storage but is architecturally prepared for database integration (MongoDB as specified in project requirements).