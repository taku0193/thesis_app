FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Tokyo

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ffmpeg \
        tzdata \
        pkg-config \
        libavcodec-dev \
        libavdevice-dev \
        libavformat-dev \
        libavutil-dev \
        libswresample-dev \
        libswscale-dev \
        python3.10 \
        python3.10-venv \
        python3.10-distutils \
        python3.10-dev \
        python3-pip \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cu121
RUN python3.10 -m pip install --no-cache-dir -r /app/requirements.txt

COPY . /app/backend

EXPOSE 8000

CMD ["python3.10", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
