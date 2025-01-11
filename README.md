# Alert System for Monitoring Failed POST Requests

## Description

This project implements a backend system that monitors a specific POST endpoint for failed requests caused by invalid headers or incorrect access tokens. It tracks the number of invalid requests from each IP address within a configurable time window, triggers alerts through email when a threshold of failed attempts is exceeded, and logs metrics for further analysis.

## Features

- Monitors `/api/submit` POST endpoint for failed requests
- Tracks invalid requests from IP addresses within a 10-minute window
- Triggers email alerts when failed attempts threshold (5 attempts) is exceeded
- Logs and stores metrics for failed requests (IP, timestamp, reason)
- Exposes an endpoint to fetch metrics
- Implements rate limiting to handle high traffic volumes
- Uses OAuth2 for secure email sending via Gmail

## Installation

1. Clone the repository:

2. put required ENVIROMENT variables.

3. Run command Node server.js

4. Use postman to test the api.
