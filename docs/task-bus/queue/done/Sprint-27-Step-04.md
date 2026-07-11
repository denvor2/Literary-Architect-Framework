# Sprint-27-Step-04: Production docker-compose + Nginx

id: Sprint-27-Step-04
name: Production docker-compose + Nginx
type: infrastructure

scope:
  allowed_paths:
    - docker-compose.prod.yml
    - nginx/nginx.conf
    - nginx/Dockerfile
    - nginx/init-certs.sh
    - .gitignore
    - docs/project/DEPLOYMENT.md
    - README.md
  forbidden_paths:
    - docker-compose.yml
    - apps/studio/Dockerfile
    - apps/studio/src/**
    - prisma/schema.prisma

objective: Create production-ready Docker Compose configuration with PostgreSQL, Studio app, and Nginx HTTPS reverse proxy, including auto-generated self-signed certificates and comprehensive deployment documentation.

inputs:
  - ROADMAP_18-27.md (Sprint 27 production hardening)
  - ADR-0003 (Technology Stack Strategy)

outputs:
  - docker-compose.prod.yml with PostgreSQL, Studio, Nginx services
  - nginx/Dockerfile for Nginx image
  - nginx/nginx.conf with HTTPS reverse proxy configuration
  - nginx/init-certs.sh for automatic self-signed certificate generation
  - Updated DEPLOYMENT.md with production deployment guide
  - Updated README.md with link to DEPLOYMENT.md

validation:
  - npm run build succeeds (tsc, eslint, prettier all clean)
  - docker-compose -f docker-compose.prod.yml config succeeds (valid YAML)
  - PostgreSQL service isolated inside container, not exposed to host
  - Studio app only accessible through Nginx (no direct port 3000 exposure)
  - Nginx listens on 80 (HTTP redirect) and 443 (HTTPS)
  - Certificates auto-generated on first run or replaceable with real Let's Encrypt/commercial certs

done_when:
  - ARP file created in docs/task-bus/queue/active/ with full validation logs
  - All tsc/eslint/prettier/build checks pass
  - ready for architect-reviewer and tester gates
