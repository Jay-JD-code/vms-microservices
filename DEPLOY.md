# VMS Deployment - Railway + Vercel (No Card Required)

## Architecture

```
GitHub

  ├── Frontend (React)
  │     └── Push to main → Vercel auto-deploys (free, no card)
  │
  ├── VMS-EUREKA-SERVER
  ├── VMS-API-GATEWAY
  ├── VMS-AUTH
  ├── VMS-VENDOR
  ├── VMS-DOCUMENT
  ├── VMS-ORDERS
  ├── VMS-PAYMENTS
  ├── VMS-DASHBOARD
  └── VMS-PERFORMANCE
        └── Push to main → Railway auto-deploys (free, no card)
```

---

## Step 1: Deploy Frontend to Vercel (5 mins)

### 1a. Create Vercel Account
1. Go to https://vercel.com
2. Click **Continue with GitHub**
3. Authorize Vercel

### 1b. Import Your Repo
1. Click **Add New → Project**
2. Select **vms-microservices**
3. Root directory: **frontend-react**
4. Framework: **Vite** (auto-detected)
5. Environment variable:
   - `VITE_API_BASE_URL` = `https://vms-gateway.up.railway.app`
6. Click **Deploy**

### 1c. Get Vercel Tokens (for GitHub Actions)
```
Vercel Dashboard → Settings → Tokens → Create Token
```
Name: `github-actions`
Scope: Full

Also get your **Project ID** and **Org ID**:
```
Vercel → Project → Settings → Project ID
Vercel → Settings → General → Your ID (Org ID)
```

### 1d. Add GitHub Secrets
```
Repo → Settings → Secrets and variables → Actions
```

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Token from step 1c |
| `VERCEL_ORG_ID` | Your Vercel Org ID |
| `VERCEL_PROJECT_ID` | Your Vercel Project ID |

---

## Step 2: Deploy Backend to Railway (10 mins)

### 2a. Create Railway Account
1. Go to https://railway.app
2. Click **Continue with GitHub**
3. No credit card needed!

### 2b. Create a New Project
1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Select **vms-microservices**

### 2c. Add Each Service

You'll create 9 services under one project. For each service:

| # | Service Name | Root Directory | Port |
|---|-------------|----------------|------|
| 1 | vms-eureka | VMS-EUREKA-SERVER | 8761 |
| 2 | vms-gateway | VMS-API-GATEWAY | 8080 |
| 3 | vms-auth | VMS-AUTH | 8081 |
| 4 | vms-vendor | VMS-VENDOR | 8082 |
| 5 | vms-document | VMS-DOCUMENT | 8083 |
| 6 | vms-orders | VMS-ORDERS | 8084 |
| 7 | vms-payments | VMS-PAYMENTS | 8085 |
| 8 | vms-dashboard | VMS-DASHBOARD | 8087 |
| 9 | vms-performance | VMS-PERFORMANCE | 8088 |

#### How to add each service:
```
Railway Project → New → Service → GitHub Repo → Select branch
  → Root Directory: VMS-AUTH (for example)
  → Railway auto-detects Dockerfile → starts building
```

> **Important**: After the first service deploys, add it manually for subsequent ones.  
> Or use CLI: `railway service --add`

### 2d. Set Environment Variables

For each service, go to its **Variables** tab and add:

**vms-eureka:**
```
PORT=8761
SPRING_PROFILES_ACTIVE=prod
EUREKA_INSTANCE_HOSTNAME=vms-eureka.up.railway.app
EUREKA_CLIENT_REGISTER_WITH_EUREKA=false
EUREKA_CLIENT_FETCH_REGISTRY=false
```

**vms-gateway:**
```
PORT=8080
SPRING_PROFILES_ACTIVE=prod
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://vms-eureka.up.railway.app:8761/eureka
```

**vms-auth:**
```
PORT=8081
SPRING_PROFILES_ACTIVE=prod
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://vms-eureka.up.railway.app:8761/eureka
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>:5432/authdb
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<your-password>
SPRING_MAIL_USERNAME=<gmail>
SPRING_MAIL_PASSWORD=<app-password>
VENDOR_SERVICE_URL=http://vms-vendor.up.railway.app:8082
```

**vms-vendor:**
```
PORT=8082
SPRING_PROFILES_ACTIVE=prod
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://vms-eureka.up.railway.app:8761/eureka
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>:5432/vendorsdb
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<your-password>
AUTH_SERVICE_URL=http://vms-auth.up.railway.app:8081
```

**vms-orders:**
```
PORT=8084
SPRING_PROFILES_ACTIVE=prod
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://vms-eureka.up.railway.app:8761/eureka
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>:5432/ordersdb
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<your-password>
```

**vms-payments:**
```
PORT=8085
SPRING_PROFILES_ACTIVE=prod
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://vms-eureka.up.railway.app:8761/eureka
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>:5432/paymentsdb
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<your-password>
```

**vms-document:**
```
PORT=8083
SPRING_PROFILES_ACTIVE=prod
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://vms-eureka.up.railway.app:8761/eureka
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon-host>:5432/documentdb
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=<your-password>
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=ap-southeast-1
```

**vms-dashboard:**
```
PORT=8087
SPRING_PROFILES_ACTIVE=prod
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://vms-eureka.up.railway.app:8761/eureka
```

**vms-performance:**
```
PORT=8088
SPRING_PROFILES_ACTIVE=prod
EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://vms-eureka.up.railway.app:8761/eureka
```

---

## Step 3: Verify

After all services deploy (takes ~5-10 min):

```bash
# Check Eureka
https://vms-eureka.up.railway.app

# Check Gateway
https://vms-gateway.up.railway.app/actuator/health

# Check Frontend
https://vms-microservices.vercel.app
```

---

## Step 4: Auto-Deploy Workflow

```
Push to GitHub main
  ├── GitHub Actions runs Maven build on all 9 services
  ├── Vercel auto-deploys frontend
  └── Railway auto-deploys each service (via GitHub integration)
```

> Railway automatically deploys when code changes in the connected service directory.

---

## Cost: $0

| Resource | Cost |
|----------|------|
| Vercel (frontend) | Free forever |
| Railway (9 services) | $5 free credit (lasts ~1+ month) |
| Railway sleep mode | Services sleep after inactivity = saves credit |
| Neon PostgreSQL | Free tier |
| GitHub Actions | Free |

> When Railway credit runs low, add $5 or use **sleep mode** to stretch it.

---

## Railway CLI (Alternative to Dashboard)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy a service
railway up --service vms-auth

# View logs
railway logs --service vms-auth

# Set variables
railway variables --service vms-auth set PORT=8081
```
