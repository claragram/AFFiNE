FROM ghcr.io/toeverything/affine:stable

# Replace static assets with the custom-built Claranote frontend assets
RUN rm -rf /app/static/*
COPY static/ /app/static/
COPY admin/ /app/static/admin/
COPY mobile/ /app/static/mobile/

ENV DEPLOYMENT_TYPE=selfhosted
ENV AFFINE_INDEX_HTML_TITLE="Claranote"

EXPOSE 3010
CMD ["node", "./dist/main.js"]
