FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html style.css manifest.json sw.js icon-192.png icon-512.png /usr/share/nginx/html/
COPY js /usr/share/nginx/html/js
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
