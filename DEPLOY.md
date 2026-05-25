# Jenkins + Render Deployment on Oracle Cloud Free Tier

## What You Get

| Resource | Spec | Cost |
|----------|------|------|
| Oracle VM | 4 ARM cores, 24GB RAM, 200GB SSD | **Free forever** |
| Jenkins | CI/CD server | Free |
| Render | 9 microservices + frontend | Free |
| Neon DB | PostgreSQL | Free |

---

## Step 1: Create Oracle Cloud Account

1. Go to https://cloud.oracle.com
2. Click **Free Tier** → **Start for free**
3. Enter payment info (for verification only, won't charge)
4. After signup, login to the dashboard

---

## Step 2: Create VM Instance

1. Dashboard → **Compute** → **Instances** → **Create Instance**
2. Name: `vms-jenkins`
3. Image: **Canonical Ubuntu 22.04** (Minimal)
4. Shape: **VM.Standard.A1.Flex** (ARM, Ampere)
   - OCPU count: **4**
   - Memory: **24 GB**
5. Add SSH key: **Generate a key pair** → Download both files
6. Create **Boot volume**: **200 GB** (free)
7. Click **Create**

Wait 2 minutes for the instance to be ready.

---

## Step 3: Connect to Your VM

```bash
# From your local terminal
ssh -i <downloaded-private-key> ubuntu@<instance-public-ip>

# Example:
ssh -i oracle-key.pem ubuntu@123.45.67.89
```

---

## Step 4: Install Everything (Copy-Paste)

Run this entire script on your Oracle VM:

```bash
# ============================================
# Oracle Setup Script - Jenkins + Docker
# ============================================

# Update system
sudo apt update && sudo apt upgrade -y

# Install Java 21
sudo apt install openjdk-21-jdk-headless -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Install Jenkins
curl -fsSL https://pkg.jenkins.io/debian/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list
sudo apt update
sudo apt install jenkins -y

# Add users to docker group
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 8080/tcp
sudo ufw --force enable

# Restart Jenkins
sudo systemctl restart jenkins

# Install Maven
sudo apt install maven -y

# Install useful tools
sudo apt install git curl jq -y

echo "============================================"
echo "Jenkins URL: http://$(curl -s ifconfig.me):8080"
echo "Initial Admin Password:"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
echo ""
echo "============================================"
```

---

## Step 5: Configure Jenkins

### 5a. Access Jenkins
```
http://<ORACLE_PUBLIC_IP>:8080
```
Paste the initial admin password printed above.

### 5b. Install Plugins
Select **Install suggested plugins**. Then add these additional ones:

- **Pipeline**
- **Docker Pipeline**
- **GitHub Integration**
- **Credentials Binding**
- **Blue Ocean** (nicer UI)

### 5c. Create Admin User
Fill in your details when prompted.

### 5d. Add GitHub Webhook in Jenkins
1. Dashboard → Manage Jenkins → System
2. Find **GitHub** section → Add GitHub Server
3. API URL: `https://api.github.com`
4. Credentials → Add → Kind: Secret text → Paste your GitHub token
5. Test connection → Save

---

## Step 6: Get Render Deploy Hook URLs

For each service in Render Dashboard:
1. Go to the service
2. **Settings** → **Deploy Hook**
3. Copy the URL

Services to get hooks for:

| Service | Name in Render |
|---------|---------------|
| Eureka | `vms-eureka` |
| Gateway | `vms-gateway` |
| Auth | `vms-auth` |
| Vendor | `vms-vendor` |
| Orders | `vms-orders` |
| Payments | `vms-payments` |
| Document | `vms-document` |
| Dashboard | `vms-dashboard` |
| Performance | `vms-performance` |
| Frontend | `vms-frontend` |

---

## Step 7: Add Credentials to Jenkins

Dashboard → **Manage Jenkins** → **Credentials** → **System** → **Global credentials** → **Add Credentials**:

| Kind | ID | Value |
|------|----|-------|
| Username with password | `DOCKER_HUB_USERNAME` | Your Docker Hub username (blank password) |
| Secret text | `DOCKER_HUB_TOKEN` | Docker Hub access token |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_EUREKA` | Deploy hook URL for Eureka |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_GATEWAY` | Deploy hook URL for Gateway |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_AUTH` | Deploy hook URL for Auth |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_VENDOR` | Deploy hook URL for Vendor |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_ORDERS` | Deploy hook URL for Orders |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_PAYMENTS` | Deploy hook URL for Payments |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_DOCUMENT` | Deploy hook URL for Document |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_DASHBOARD` | Deploy hook URL for Dashboard |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_PERFORMANCE` | Deploy hook URL for Performance |
| Secret text | `RENDER_DEPLOY_HOOK_VMS_FRONTEND` | Deploy hook URL for Frontend |

---

## Step 8: Create Jenkins Pipeline Job

1. Dashboard → **New Item**
2. Name: `vms-microservices`
3. Type: **Pipeline**
4. Click **OK**

### Configure:

**General** tab:
- Check **GitHub project**
- Project URL: `https://github.com/Jay-JD-code/vms-microservices`

**Build Triggers** tab:
- Check **GitHub hook trigger for GITScm polling**

**Pipeline** tab:
- **Definition**: Pipeline script from SCM
- **SCM**: Git
- **Repository URL**: `https://github.com/Jay-JD-code/vms-microservices.git`
- **Script Path**: `Jenkinsfile`
- Click **Save**

---

## Step 9: Set Up GitHub Webhook

1. GitHub → **Your repo** → **Settings** → **Webhooks** → **Add webhook**
2. Payload URL: `http://<ORACLE_PUBLIC_IP>:8080/github-webhook/`
3. Content type: `application/json`
4. Events: **Just the push event**
5. Click **Add webhook**

---

## Step 10: Test the Pipeline

1. Push any change to GitHub:
```bash
git add . && git commit -m "test deploy" && git push
```

2. Watch Jenkins run:
   - Dashboard → `vms-microservices` → **Build History**
   - Click the build number → **Console Output**

3. Check Render:
   - Each service should show "Deploy in progress"
   - Then "Deploy successful"

---

## CI/CD Flow Summary

```
        ┌─────────────────────────────────────┐
        │   PUSH CODE TO GITHUB               │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │   GITHUB WEBHOOK                    │
        │   Triggers Jenkins                   │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │   JENKINS (Oracle Free VM)          │
        │   ├─ Pulls code from GitHub         │
        │   ├─ Builds ALL 9 services (Maven)  │
        │   ├─ Pushes Docker images to Hub    │
        │   └─ Calls Render Deploy Hooks      │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │   RENDER                            │
        │   ├─ Receives deploy hook           │
        │   ├─ Pulls code from GitHub         │
        │   ├─ Builds & deploys each service  │
        │   └─ Frontend deploys as static     │
        └──────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────────────┐
        │   DEPLOYED ✅                        │
        │   https://vms-gateway.onrender.com   │
        │   https://vms-frontend.onrender.com  │
        └─────────────────────────────────────┘
```

---

## Cost Breakdown: $0/month

| Resource | Details | Cost |
|----------|---------|------|
| Oracle VM | 4 CPU, 24GB RAM, 200GB SSD | **$0** |
| Render | 9 web services + static site | **$0** |
| Render Cron | Keep-alive job | **$0** |
| Docker Hub | Public image storage | **$0** |
| Neon PostgreSQL | Free tier | **$0** |
| GitHub | Free account | **$0** |

**Total: $0/month**

---

## Commands Cheat Sheet

```bash
# SSH into Oracle VM
ssh -i oracle-key.pem ubuntu@<oracle-ip>

# Check Jenkins status
sudo systemctl status jenkins

# Check Jenkins logs
sudo journalctl -u jenkins -f

# Restart Jenkins
sudo systemctl restart jenkins

# Check Docker
docker ps
sudo docker system prune -f

# View Maven build cache
ls ~/.m2/repository/

# Test Render hook manually
curl -X POST <deploy-hook-url>
```
