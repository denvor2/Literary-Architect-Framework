FROM nginx:1.27-alpine

RUN apk add --no-cache openssl bash

COPY nginx.conf /etc/nginx/nginx.conf
COPY init-certs.sh /docker-entrypoint-initdb.d/init-certs.sh

RUN chmod +x /docker-entrypoint-initdb.d/init-certs.sh

EXPOSE 80 443

CMD ["sh", "-c", "/docker-entrypoint-initdb.d/init-certs.sh && nginx -g 'daemon off;'"]
