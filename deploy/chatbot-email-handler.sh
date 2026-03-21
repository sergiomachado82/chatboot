#!/bin/bash
# Postfix pipe: recibe email por stdin, lo envia al chatbot via HTTP
# Instalacion en VPS:
#   cp deploy/chatbot-email-handler.sh /usr/local/bin/chatbot-email-handler.sh
#   chmod +x /usr/local/bin/chatbot-email-handler.sh
#
# Configurar en /etc/postfix/virtual:
#   info@lasgrutasdepartamentos.com sergiomachado82@gmail.com, chatbot-pipe@localhost
#
# Configurar en /etc/aliases:
#   chatbot-pipe: "|INTERNAL_EMAIL_KEY=<secret> /usr/local/bin/chatbot-email-handler.sh"
#
# Luego ejecutar:
#   postmap /etc/postfix/virtual
#   newaliases
#   systemctl reload postfix

RAW=$(cat | base64 -w0)
curl -sf -X POST http://127.0.0.1:5050/api/internal/incoming-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${INTERNAL_EMAIL_KEY}" \
  --max-time 30 \
  -d "{\"rawEmail\": \"$RAW\"}" > /dev/null 2>&1

exit 0  # Siempre exit 0 para no generar bounce
