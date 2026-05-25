# VMS Microservices - Deployment Guide

## Architecture

```
GitHub Push → Jenkins (CI) → Render (CD) → 9 Microservices + Frontend
              │                 │
              ├─ Maven Build     ├─ Auto-deploy from render.yaml
              ├─ Push Docker Hub ├─ Free tier (spin down after 15min)
              └─ Trigger Render  └─ Keep-alive cron prevents sleep
```

---

## Step 1: Render Setup (10 mins)

### 1a. Create Render Account
Go to https://dashboard.render.com and sign up with GitHub.

### 1b. Connect Your Repository
- Click **New + → Blueprint**
- Select `vms-microservices` repo
- Render reads `render.yaml` and creates all 10 services

### 1c. Fill Environment Variables (secrets)
After Blueprint sync, Render will prompt for these secrets:

| Service | Secret Variables |
|---------|-----------------|
| vms-auth | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` |
| vms-vendor | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` |
| vms-orders | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` |
| vms-payments | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` |
| vms-document | `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |

Get database URLs from **Neon Dashboard** → Connection Details → Copy JDBC URL.

### 1d. Get Deploy Hook URLs
For each service in Render Dashboard → Settings → Deploy Hook → Copy URL.

---

## Step 2: Jenkins Setup (Free EC2 - 15 mins)

### 2a. Launch EC2 Instance
- Go to AWS Console → EC2 → Launch Instance
- Name: `vms-jenkins`
- AMI: Ubuntu 22.04 (free tier)
- Type: t2.micro (free tier)
- Security Group: Allow ports **22, 8080**
- Download .pem key

### 2b. SSH & Install Jenkins
```bash
ssh -i your-key.pem ubuntu@<jenkins-public-ip>

# Install Java
sudo apt update && sudo apt install openjdk-21-jdk docker.io -y

# Install Jenkins
curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list
sudo apt update && sudo apt install jenkins -y

# Add jenkins user to docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 2c. Configure Jenkins
1. Open: `http://<jenkins-public-ip>:8080`
2. Enter initial admin password
3. Install suggested plugins
4. Create admin user

### 2d. Install Plugins
Manage Jenkins → Plugins → Available Plugins:
- Pipeline
- Docker Pipeline
- GitHub Integration
- Credentials Binding

### 2e. Add Credentials
Manage Jenkins → Credentials → System → Global → Add:
- `DOCKER_HUB_USERNAME`: Your Docker Hub username
- `DOCKER_HUB_TOKEN`: Your Docker Hub access token
- Add each Render Deploy Hook URL as a secret text credential

### 2f. Create Pipeline Job
1. New Item → `vms-pipeline` → Pipeline
2. Definition: Pipeline script from SCM
3. SCM: Git → `https://github.com/Jay-JD-code/vms-microservices.git`
4. Script Path: `Jenkinsfile`
5. Save & Build

---

## Step 3: Configure Webhook (Auto-Trigger)

GitHub → Repo → Settings → Webhooks → Add webhook:
- Payload URL: `http://<jenkins-public-ip>:8080/github-webhook/`
- Content type: application/json
- Events: Push events

---

## Step 4: Verify Deployment

After Jenkins and Render finish deploying:

```bash
# Eureka Dashboard
https://vms-eureka.onrender.com

# API Gateway Health
https://vms-gateway.onrender.com/actuator/health

# Frontend
https://vms-frontend.onrender.com
```

---

## CI/CD Flow

```
Developer pushes to GitHub main branch
         │
         ▼
GitHub Webhook triggers Jenkins
         │
         ▼
Jenkins Pipeline starts:
  ├─ Stage 1: Build ALL 9 services (parallel Maven)
  ├─ Stage 2: Push Docker images to Docker Hub
  └─ Stage 3: Call Render Deploy Hooks
         │
         ▼
Render pulls latest code from GitHub
  ├─ Builds & deploys each service
  └─ Frontend auto-deploys as static site
```

---

## Cost: $0/month

| Resource | Cost |
|----------|------|
| Render (9 web services + 1 static site) | Free* |
| Render Cron Job (keep-alive) | Free |
| Jenkins on EC2 t2.micro | Free tier |
| Neon PostgreSQL | Free tier |
| Docker Hub | Free |
| GitHub | Free |

*Free services spin down after 15 min of inactivity. The keep-alive cron job prevents this.

---

## Notes

- **Spin-down**: Free Render services sleep after 15 minutes idle. First request after sleep takes ~30s.
- **Keep-alive**: The cron job pings services every 10 minutes to prevent sleep.
- **Database**: Use Neon or Render's free PostgreSQL. Render free DB also spins down.
- **Secrets**: All DB passwords, AWS keys, and mail passwords use `sync: false` in render.yaml - you must enter them manually in Render Dashboard.
