FROM python:3.11-slim

WORKDIR /app

# System deps (for confluent-kafka)
RUN apt-get update && apt-get install -y \
    gcc \
    librdkafka-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV PYTHONUNBUFFERED=1

# Default (overridden per service)
CMD ["python", "-m", "app.main"]
