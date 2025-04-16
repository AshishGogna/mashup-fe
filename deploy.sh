#!/bin/bash

# Install dependencies
npm install

# Build the application
npm run build

# Create standalone build
npm run build:standalone

# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/conf.d/mashup.conf

# Restart Nginx
sudo systemctl restart nginx

# Start the application using PM2
pm2 start npm --name "mashup-fe" -- start 