#!/bin/sh
# Entrypoint script for backend development

# Copy node_modules from image to volume if not already present
if [ ! -d "/app/node_modules/.bin" ]; then
    echo "Copying node_modules from image..."
    cp -r /app/node_modules_bak/* /app/node_modules/
fi

# Run the development server
exec npm run dev