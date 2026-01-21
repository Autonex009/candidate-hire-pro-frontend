"""
AWS Elastic Beanstalk entry point
EB expects application.py with 'application' variable
"""
from app.main import app

# AWS EB expects 'application' as the WSGI callable
application = app
