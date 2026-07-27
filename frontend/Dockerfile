FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY index.html app.js rppg-worker.js styles.css /usr/share/nginx/html/

EXPOSE 80
