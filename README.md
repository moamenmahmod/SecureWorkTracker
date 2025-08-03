# Cybersec Work Tracker

A Flask-based cybersecurity work tracker with automatic activity monitoring, earnings tracking, and vulnerability logging featuring a dark cybersecurity theme.

## Features

- **Bug Bounty Challenge Management**: Create time-bound challenges with countdown timers
- **Automatic Activity Tracking**: Monitors work sessions every 5 minutes
- **Earnings Tracking**: Track money earned from vulnerabilities with analytics
- **Vulnerability Logging**: Record discovered bugs with severity levels and bounty amounts
- **Real-time Cairo Time**: Synchronized with World Time API
- **Dark Cybersecurity Theme**: Modern UI with neon accents

## Local Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Clone or download** this project to your local machine

2. **Install dependencies**:
   ```bash
   pip install Flask Flask-SQLAlchemy requests Werkzeug
   ```

3. **Run the application**:
   ```bash
   python run.py
   ```

4. **Open in browser**:
   Visit `http://localhost:5000`

### Database

The application uses SQLite for local storage. The database file `cybersec_tracker.db` will be created automatically in the project folder when you first run the app.

### File Structure

```
cybersec-tracker/
├── app.py              # Main Flask application
├── models.py           # Database models
├── run.py              # Local development server
├── README.md           # This file
├── templates/          # HTML templates
├── static/             # CSS, JS, and assets
└── cybersec_tracker.db # SQLite database (created automatically)
```

## Usage

1. **Create Challenge**: Set days and target goals for vulnerabilities and earnings
2. **Track Activity**: Application automatically monitors your work time
3. **Log Vulnerabilities**: Record discovered bugs with details and bounty amounts  
4. **View Analytics**: Monitor progress with charts and statistics
5. **Cairo Time Sync**: All timestamps use Cairo timezone via World Time API

## Technology Stack

- **Backend**: Flask, SQLAlchemy
- **Database**: SQLite (local file storage)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **UI Framework**: Bootstrap 5 with custom cybersecurity theme
- **Charts**: Chart.js for analytics visualization
- **Time API**: World Time API for Cairo timezone synchronization

## Development

The application is configured for local development with:
- Debug mode enabled
- SQLite database for easy portability
- Automatic table creation
- Hot reload on file changes

To modify the database schema, edit `models.py` and restart the application. Tables will be created automatically.