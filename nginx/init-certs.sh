#!/bin/bash
set -e

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/cert.pem"
KEY_FILE="$CERT_DIR/key.pem"

mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  echo "Generating self-signed certificates..."
  openssl req -x509 -newkey rsa:2048 -keyout "$KEY_FILE" -out "$CERT_FILE" -days 365 -nodes \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
  echo "Certificates generated: $CERT_FILE, $KEY_FILE"
else
  echo "Certificates already exist"
fi
