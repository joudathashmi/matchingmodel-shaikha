# Node + Express + TypeScript + Prisma (Postgres) 

Ganerate JWT_ACCESS_TOKEN_SECRET and JWT_REFRESH_TOKEN_SECRET using Node.js and add it into .env
- node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
- Run this twice — once for the access token and once for the refresh token.

Quick start:
1. npm install
2. npx prisma generate
3. npx prisma migrate dev --name init
4. npx prisma migrate deploy
5. npx prisma db push
6. npm run dev

View Docker Logs : 
docker logs -f rhq-backend-api-
docker logs rhq-backend-api-dev --follow

View only the last N lines :
docker logs --tail 100 rhq-backend-api-dev
docker logs rhq-backend-api-dev --tail=100

Find errors
docker logs rhq-backend-api-dev 2>&1 | grep -i "error"