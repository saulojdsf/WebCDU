# WebCDU Docker Deployment Guide

## Quick Start

### Building and Running with Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Proxmox LXC Deployment

### 1. Create LXC Container
```bash
# Create Ubuntu 22.04 LXC container in Proxmox
pct create 100 local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst \
  --rootfs local-lvm:8 \
  --cores 2 \
  --memory 2048 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --features nesting=1

# Start container
pct start 100

# Enter container
pct enter 100
```

### 2. Install Docker in LXC
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Add user to docker group (if needed)
usermod -aG docker $USER
```

### 3. Deploy WebCDU
```bash
# Clone or copy your WebCDU project
git clone <your-repo> /opt/webcdu
cd /opt/webcdu

# Build and start services
docker-compose up -d --build
```

### 4. Configure Firewall (if needed)
```bash
# Allow HTTP traffic
ufw allow 80/tcp
ufw allow 8000/tcp
ufw enable
```

## Environment Configuration

### Production Environment Variables
Create a `.env` file:

```env
# Backend
PYTHONUNBUFFERED=1

# Frontend
VITE_API_URL=http://your-server-ip:8000
```

### Production Docker Compose Override
Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    environment:
      - PYTHONUNBUFFERED=1
    volumes: []  # Remove volume mount for production

  frontend:
    environment:
      - VITE_API_URL=http://your-server-ip:8000
    ports:
      - "80:80"
```

Run with: `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml if 80 or 8000 are in use
2. **Build failures**: Ensure all dependencies are properly specified
3. **CORS issues**: Update backend CORS settings for production domain

### Useful Commands

```bash
# View container logs
docker-compose logs backend
docker-compose logs frontend

# Restart specific service
docker-compose restart backend

# Rebuild specific service
docker-compose up -d --build backend

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Health Checks
Both services include health checks. Check status with:
```bash
docker-compose ps
```

## Security Considerations

1. **Change default CORS settings** in backend/main.py for production
2. **Use environment variables** for sensitive configuration
3. **Consider reverse proxy** (nginx/traefik) for SSL termination
4. **Regular updates** of base images and dependencies

## Backup Strategy

```bash
# Backup application data
docker-compose exec backend tar -czf /tmp/backup.tar.gz /app
docker cp webcdu-backend:/tmp/backup.tar.gz ./backup-$(date +%Y%m%d).tar.gz
```