docker stop 44router
docker rm 44router
docker build -t 44router .
docker run -d --name 44router -p 20128:20128 --env-file .env -v 44router-data:/app/data 44router