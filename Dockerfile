FROM node:lts-alpine as build
WORKDIR /app
COPY .env ./.env
COPY package* ./
COPY tsconfig.json ./
COPY google.json ./
COPY next.config.js ./
RUN npm install
COPY public ./public
COPY src ./src
COPY prisma ./prisma
RUN npm run build

FROM node:lts-alpine
WORKDIR /app
COPY --from=build /app/.env ./
COPY --from=build /app/next.config.js ./
COPY --from=build /app/google.json ./
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]