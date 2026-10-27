# Use an official lightweight Python runtime
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies (needed for OpenCV, image processing, or ML packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition first (leverages Docker layer caching)
COPY requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source code
COPY . /app/

# Expose backend port (adjust if your backend uses 8000, 5000, or 8080)
EXPOSE 8000

# Start command (defaults to Uvicorn for FastAPI; adjust if using main.py, app.py, or Flask)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]