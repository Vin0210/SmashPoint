@echo off
cd /d C:\wamp64\www\pickleball-booking\backend
C:\wamp64\bin\php\php5.6.40\php.exe artisan schedule:run >> storage\logs\scheduler.log 2>&1
