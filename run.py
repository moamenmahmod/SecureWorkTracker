#!/usr/bin/env python3
"""
Local development server for Cybersec Work Tracker
Run this file to start the application locally on port 5000
"""

from app import app

if __name__ == '__main__':
    print("\n🔒 Starting Cybersec Work Tracker")
    print("📍 Local development server")
    print("🌐 Visit: http://localhost:5000")
    print("💾 Database: SQLite (cybersec_tracker.db)")
    print("⏰ Time sync: Cairo timezone via World Time API\n")
    
    app.run(
        host='0.0.0.0',  # Allow external connections
        port=5000,
        debug=True,
        threaded=True
    )