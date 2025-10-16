# Use official Node.js image as base
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for caching
COPY package*.json ./

# Install all dependencies (not only production yet)
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the application port
EXPOSE 8080

# Start the app
CMD ["node", "app.js"]

