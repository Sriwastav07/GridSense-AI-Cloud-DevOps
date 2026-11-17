FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev
COPY backend ./backend
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "backend/server.js"]
