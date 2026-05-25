# Step 1: Set Up GitHub Actions Secrets

Go to **Repo → Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|--------|-------|
| `DOCKER_USER` | Your Docker Hub username |
| `DOCKER_PASS` | Docker Hub access token (Settings → Security → Access Tokens) |

After adding secrets, push to main:
```bash
git add . && git commit -m "update" && git push
```
GitHub Actions will build all 9 Docker images and push them to Docker Hub.

---

# Step 2: Connect to Each EC2 Instance

Open **AWS Console → EC2 → Instances** → Select instance → Click **Connect**

Choose **EC2 Instance Connect** (browser terminal, no SSH needed)

| Instance | Public IP | Services |
|----------|-----------|----------|
| **1** | 13.232.112.215 | Eureka + Gateway |
| **2** | 13.234.231.156 | Auth + Vendor + Dashboard |
| **3** | 43.205.238.9 | Orders + Payments + Document + Performance |

---

# Step 3: Setup Instance 1 (Eureka + Gateway)

Connect via browser terminal (EC2 Console → Connect), then paste:

```bash
# Install Docker
sudo apt update && sudo apt install docker.io docker-compose -y
sudo systemctl start docker && sudo systemctl enable docker

# Clone repo
git clone https://github.com/Jay-JD-code/vms-microservices.git /home/ubuntu/vms
cd /home/ubuntu/vms

# Create .env file
cat > .env << 'EOF'
DOCKER_USER=your-dockerhub-username
EUREKA_IP=13.232.112.215
EOF

# Download docker-compose file
curl -sL https://raw.githubusercontent.com/Jay-JD-code/vms-microservices/main/docker-compose.instance1.yml -o docker-compose.yml

# Docker login
docker login -u "$(grep DOCKER_USER .env | cut -d= -f2)"
# (enter your Docker Hub password/token when prompted)

# Start services
docker compose up -d

# Verify
docker compose ps
curl http://localhost:8761
curl http://localhost:8080/actuator/health

# Allow firewall
sudo ufw allow 8761/tcp && sudo ufw allow 8080/tcp && sudo ufw --force enable
```

---

# Step 4: Setup Instance 2 (Auth + Vendor + Dashboard)

Connect via browser terminal, then paste:

```bash
sudo apt update && sudo apt install docker.io docker-compose -y
sudo systemctl start docker && sudo systemctl enable docker

git clone https://github.com/Jay-JD-code/vms-microservices.git /home/ubuntu/vms
cd /home/ubuntu/vms

cat > .env << 'EOF'
DOCKER_USER=your-dockerhub-username
EUREKA_IP=13.232.112.215
AUTH_IP=13.234.231.156
VENDOR_IP=13.234.231.156
DB_USER=neondb_owner
DB_PASS=<your-neon-password>
AUTH_DB_URL=jdbc:postgresql://<neon-host>:5432/authdb
VENDOR_DB_URL=jdbc:postgresql://<neon-host>:5432/vendorsdb
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
EOF

curl -sL https://raw.githubusercontent.com/Jay-JD-code/vms-microservices/main/docker-compose.instance2.yml -o docker-compose.yml

docker login -u "$(grep DOCKER_USER .env | cut -d= -f2)"

docker compose up -d

sudo ufw allow 8081/tcp && sudo ufw allow 8082/tcp && sudo ufw allow 8087/tcp && sudo ufw --force enable
```

---

# Step 5: Setup Instance 3 (Orders + Payments + Document + Performance)

Connect via browser terminal, then paste:

```bash
sudo apt update && sudo apt install docker.io docker-compose -y
sudo systemctl start docker && sudo systemctl enable docker

git clone https://github.com/Jay-JD-code/vms-microservices.git /home/ubuntu/vms
cd /home/ubuntu/vms

cat > .env << 'EOF'
DOCKER_USER=your-dockerhub-username
EUREKA_IP=13.232.112.215
DB_USER=neondb_owner
DB_PASS=<your-neon-password>
ORDERS_DB_URL=jdbc:postgresql://<neon-host>:5432/ordersdb
PAYMENTS_DB_URL=jdbc:postgresql://<neon-host>:5432/paymentsdb
DOCUMENT_DB_URL=jdbc:postgresql://<neon-host>:5432/documentdb
AWS_ACCESS_KEY=your-aws-key
AWS_SECRET_KEY=your-aws-secret
AWS_REGION=ap-south-1
EOF

curl -sL https://raw.githubusercontent.com/Jay-JD-code/vms-microservices/main/docker-compose.instance3.yml -o docker-compose.yml

docker login -u "$(grep DOCKER_USER .env | cut -d= -f2)"

docker compose up -d

sudo ufw allow 8083/tcp && sudo ufw allow 8084/tcp && sudo ufw allow 8085/tcp && sudo ufw allow 8088/tcp && sudo ufw --force enable
```

---

# Step 6: Deploy Frontend (Vercel - Free, No Card)

1. Go to https://vercel.com → Sign up with GitHub
2. **Add New → Project** → Select `vms-microservices`
3. Root directory: `frontend-react`
4. Framework: **Vite**
5. Env variable: `VITE_API_BASE_URL` = `http://13.232.112.215:8080`
6. Click **Deploy**

---

# Step 7: Verify

| Service | URL |
|---------|-----|
| Eureka | http://13.232.112.215:8761 |
| API Gateway | http://13.232.112.215:8080 |
| Frontend | https://vms-microservices.vercel.app |

---

# Updating (After Code Changes)

1. Push code to GitHub → GitHub Actions builds new Docker images
2. On each EC2, run:
```bash
cd /home/ubuntu/vms
docker compose pull
docker compose up -d
```
