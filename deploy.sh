#!/bin/bash
# ============================================
# Chatboot - Script de deploy para Ubuntu
# ============================================
# Uso: bash deploy.sh [setup|deploy|ssl|renew|logs|restart|backup]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Directorio del proyecto
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

log() { echo -e "${GREEN}[CHATBOOT]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================
# 1. SETUP INICIAL (una sola vez)
# ============================================
cmd_setup() {
    log "=== Setup inicial del servidor Ubuntu ==="

    # Actualizar sistema
    log "Actualizando paquetes del sistema..."
    sudo apt update && sudo apt upgrade -y

    # Instalar dependencias basicas
    log "Instalando dependencias..."
    sudo apt install -y curl git ufw

    # Instalar Docker
    if ! command -v docker &> /dev/null; then
        log "Instalando Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        rm get-docker.sh
        sudo usermod -aG docker $USER
        log "Docker instalado. Cerra sesion y volve a entrar para usar docker sin sudo."
    else
        log "Docker ya esta instalado."
    fi

    # Instalar Docker Compose plugin
    if ! docker compose version &> /dev/null; then
        log "Instalando Docker Compose plugin..."
        sudo apt install -y docker-compose-plugin
    else
        log "Docker Compose ya esta instalado."
    fi

    # Configurar firewall
    log "Configurando firewall (UFW)..."
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw --force enable
    log "Firewall configurado (SSH + HTTP + HTTPS)"

    # Verificar .env.production
    if [ ! -f .env.production ]; then
        warn "No se encontro .env.production"
        log "Copiando template..."
        cp .env.production.example .env.production
        warn "EDITA .env.production con tus valores reales antes de continuar:"
        warn "  nano .env.production"
        exit 0
    fi

    log "=== Setup completo ==="
    log "Siguiente paso: bash deploy.sh deploy"
}

# ============================================
# 2. DEPLOY (build + start)
# ============================================
cmd_deploy() {
    log "=== Iniciando deploy ==="

    # Verificar .env.production
    if [ ! -f .env.production ]; then
        error "No existe .env.production. Ejecuta: bash deploy.sh setup"
    fi

    # Verificar que POSTGRES_PASSWORD no sea el default
    if grep -q "CAMBIAR_POR_PASSWORD_SEGURO" .env.production; then
        error "Cambia POSTGRES_PASSWORD en .env.production antes de deployar"
    fi

    # Cargar variables de entorno
    source .env.production

    # Verificar si ya hay certificado SSL
    if [ -d "/etc/letsencrypt/live/${DOMAIN:-nodominio}" ] || \
       docker compose -f docker-compose.prod.yml exec certbot test -d "/etc/letsencrypt/live/${DOMAIN:-nodominio}" 2>/dev/null; then
        log "Certificado SSL encontrado, usando config HTTPS..."
        cp nginx/default.conf nginx/active.conf
    else
        log "Sin certificado SSL, usando config HTTP temporalmente..."
        cp nginx/http-only.conf nginx/active.conf
        warn "Despues del deploy, ejecuta: bash deploy.sh ssl"
    fi

    # Usar active.conf como la config de nginx
    # Actualizar docker-compose para montar active.conf
    log "Construyendo imagenes..."
    docker compose -f docker-compose.prod.yml build --no-cache

    log "Iniciando servicios..."
    docker compose -f docker-compose.prod.yml up -d

    log "Esperando que los servicios esten listos..."
    sleep 10

    # Verificar health
    if docker compose -f docker-compose.prod.yml exec app wget -q --spider http://localhost:5050/api/health 2>/dev/null; then
        log "App esta corriendo correctamente!"
    else
        warn "La app puede estar iniciando todavia. Revisa los logs:"
        warn "  bash deploy.sh logs"
    fi

    log "=== Deploy completo ==="
    if [ ! -d "/etc/letsencrypt/live/${DOMAIN:-nodominio}" ]; then
        warn "Falta configurar SSL. Ejecuta: bash deploy.sh ssl"
    fi
}

# ============================================
# 3. SSL (obtener certificado Let's Encrypt)
# ============================================
cmd_ssl() {
    log "=== Configurando SSL con Let's Encrypt ==="

    if [ ! -f .env.production ]; then
        error "No existe .env.production"
    fi

    source .env.production

    if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "TUDOMINIO.com" ]; then
        error "Configura DOMAIN en .env.production"
    fi

    if [ -z "$EMAIL" ] || [ "$EMAIL" = "tu-email@ejemplo.com" ]; then
        error "Configura EMAIL en .env.production"
    fi

    # Asegurar que nginx esta corriendo con HTTP
    log "Verificando que nginx este corriendo..."
    cp nginx/http-only.conf nginx/active.conf
    docker compose -f docker-compose.prod.yml up -d nginx

    sleep 5

    # Obtener certificado
    log "Obteniendo certificado SSL para ${DOMAIN}..."
    docker compose -f docker-compose.prod.yml run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

    if [ $? -eq 0 ]; then
        log "Certificado SSL obtenido exitosamente!"

        # Actualizar nginx config con el dominio real
        log "Configurando nginx con HTTPS..."
        sed "s/TUDOMINIO.com/${DOMAIN}/g" nginx/default.conf > nginx/active.conf

        # Reiniciar nginx con HTTPS
        docker compose -f docker-compose.prod.yml restart nginx

        log "=== SSL configurado! ==="
        log "Tu app esta disponible en: https://${DOMAIN}"

        # Configurar renovacion automatica
        log "Configurando renovacion automatica de SSL..."
        (crontab -l 2>/dev/null; echo "0 3 * * * cd ${PROJECT_DIR} && docker compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker compose -f docker-compose.prod.yml restart nginx") | crontab -
        log "Cron job agregado para renovar SSL cada dia a las 3am"
    else
        error "Fallo al obtener certificado SSL. Verifica que el dominio apunte a este servidor."
    fi
}

# ============================================
# 4. RENOVAR SSL
# ============================================
cmd_renew() {
    log "Renovando certificado SSL..."
    docker compose -f docker-compose.prod.yml run --rm certbot renew
    docker compose -f docker-compose.prod.yml restart nginx
    log "Renovacion completada"
}

# ============================================
# 5. LOGS
# ============================================
cmd_logs() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        docker compose -f docker-compose.prod.yml logs -f "$service"
    else
        docker compose -f docker-compose.prod.yml logs -f
    fi
}

# ============================================
# 6. RESTART
# ============================================
cmd_restart() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        log "Reiniciando ${service}..."
        docker compose -f docker-compose.prod.yml restart "$service"
    else
        log "Reiniciando todos los servicios..."
        docker compose -f docker-compose.prod.yml restart
    fi
    log "Reinicio completado"
}

# ============================================
# 7. BACKUP de base de datos
# ============================================
cmd_backup() {
    log "Creando backup de la base de datos..."

    local BACKUP_DIR="${PROJECT_DIR}/backups"
    mkdir -p "$BACKUP_DIR"

    local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    local BACKUP_FILE="${BACKUP_DIR}/chatboot_${TIMESTAMP}.sql.gz"

    docker compose -f docker-compose.prod.yml exec -T postgres \
        pg_dump -U "${POSTGRES_USER:-chatboot}" "${POSTGRES_DB:-chatboot}" | gzip > "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        log "Backup creado: ${BACKUP_FILE}"
        log "Tamano: $(du -h "$BACKUP_FILE" | cut -f1)"

        # Mantener solo los ultimos 7 backups
        ls -t "${BACKUP_DIR}"/chatboot_*.sql.gz | tail -n +8 | xargs -r rm
        log "Backups antiguos limpiados (se mantienen los ultimos 7)"
    else
        error "Fallo al crear backup"
    fi
}

# ============================================
# 8. STATUS
# ============================================
cmd_status() {
    log "Estado de los servicios:"
    docker compose -f docker-compose.prod.yml ps
}

# ============================================
# 9. STOP
# ============================================
cmd_stop() {
    log "Deteniendo todos los servicios..."
    docker compose -f docker-compose.prod.yml down
    log "Servicios detenidos"
}

# ============================================
# 10. UPDATE (pull + rebuild + restart)
# ============================================
cmd_update() {
    log "=== Actualizando Chatboot ==="

    log "Bajando cambios de git..."
    git pull origin main

    log "Reconstruyendo imagen..."
    docker compose -f docker-compose.prod.yml build --no-cache app

    log "Reiniciando app..."
    docker compose -f docker-compose.prod.yml up -d app

    sleep 10

    log "=== Actualizacion completa ==="
    cmd_status
}

# ============================================
# MAIN
# ============================================
case "${1:-help}" in
    setup)   cmd_setup ;;
    deploy)  cmd_deploy ;;
    ssl)     cmd_ssl ;;
    renew)   cmd_renew ;;
    logs)    cmd_logs "$2" ;;
    restart) cmd_restart "$2" ;;
    backup)  cmd_backup ;;
    status)  cmd_status ;;
    stop)    cmd_stop ;;
    update)  cmd_update ;;
    help|*)
        echo ""
        echo "  Chatboot - Script de Deploy"
        echo "  ==========================="
        echo ""
        echo "  Uso: bash deploy.sh <comando>"
        echo ""
        echo "  Comandos:"
        echo "    setup     - Instalar Docker, firewall, preparar servidor (1ra vez)"
        echo "    deploy    - Construir y levantar todos los servicios"
        echo "    ssl       - Obtener certificado SSL con Let's Encrypt"
        echo "    renew     - Renovar certificado SSL"
        echo "    update    - Pull git + rebuild + restart"
        echo "    logs      - Ver logs (opcional: logs app|postgres|redis|nginx)"
        echo "    restart   - Reiniciar servicios (opcional: restart app)"
        echo "    backup    - Backup de la base de datos"
        echo "    status    - Ver estado de los servicios"
        echo "    stop      - Detener todos los servicios"
        echo "    help      - Mostrar esta ayuda"
        echo ""
        ;;
esac
