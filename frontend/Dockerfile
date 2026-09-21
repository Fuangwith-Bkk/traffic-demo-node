# Red Hat UBI Node.js 20 image: no Docker Hub rate limits, runs as non-root on OpenShift
FROM registry.access.redhat.com/ubi9/nodejs-20

# Default working directory of the UBI Node.js image is /opt/app-root/src
COPY --chown=1001:0 package*.json ./
RUN npm ci --omit=dev

COPY --chown=1001:0 . .

EXPOSE 3000

USER 1001
CMD ["node", "index.js"]
