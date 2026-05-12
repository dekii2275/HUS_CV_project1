# Sử dụng Python 3.11 slim để giảm dung lượng image
FROM python:3.11-slim

# Thiết lập biến môi trường
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

WORKDIR /app

# Cài đặt các dependencies hệ thống cần thiết (cho asyncpg và curl)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy và cài đặt requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn vào container
COPY . .

# Mở port 8002 cho FastAPI
EXPOSE 8002

# Lệnh khởi chạy server
CMD ["python", "app/main.py"]
