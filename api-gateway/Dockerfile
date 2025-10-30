FROM node:20-alpine
WORKDIR /app
COPY api-gateway/package.json .
RUN npm install --production
COPY api-gateway/server.js .
COPY ./proto ./proto
ENV PORT=3001
EXPOSE 3001
CMD ["node", "server.js"]
