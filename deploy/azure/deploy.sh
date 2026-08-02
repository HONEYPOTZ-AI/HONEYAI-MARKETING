#!/usr/bin/env bash
# HONEYAI-MARKETING Azure VM Deployment Script
# Provisions an Azure VM, installs Docker, and deploys the full stack
set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────
RG="${AZURE_RG:-honeyai-marketing-rg}"
LOCATION="${AZURE_LOCATION:-eastus2}"
VM_NAME="${AZURE_VM_NAME:-honeyai-marketing-vm}"
VM_SIZE="${AZURE_VM_SIZE:-Standard_B2s}"
VM_USER="${AZURE_VM_USER:-azureuser}"
VM_IP_NAME="${VM_NAME}-ip"
NSG_NAME="${VM_NAME}-nsg"

echo "Honey AI Marketing — Azure Deployment"
echo "================================================"

# ── 1. Login & Create Resource Group ──────────────────────────────────────
echo "Setting up resource group: $RG"
az group create --name "$RG" --location "$LOCATION" --output none 2>/dev/null || true

# ── 2. Create NSG ──────────────────────────────────────────────────────────
echo "Creating network security group..."
az network nsg create --resource-group "$RG" --name "$NSG_NAME" --output none 2>/dev/null || true

# Allow SSH, HTTP, HTTPS, and app ports
for port in 22 80 443 3000 3001; do
  az network nsg rule create --resource-group "$RG" --nsg-name "$NSG_NAME" \
    --name "allow-$port" --priority $((100 + port)) \
    --destination-port-ranges "$port" --access Allow \
    --protocol Tcp --output none 2>/dev/null || true
done

# ── 3. Public IP ────────────────────────────────────────────────────────────
echo "Creating public IP..."
az network public-ip create --resource-group "$RG" --name "$VM_IP_NAME" \
  --sku Standard --allocation-method Static --output none 2>/dev/null || true

# ── 4. VM ────────────────────────────────────────────────────────────────────
echo "Creating VM: $VM_NAME ($VM_SIZE)..."
az vm create \
  --resource-group "$RG" \
  --name "$VM_NAME" \
  --image Ubuntu2204 \
  --size "$VM_SIZE" \
  --admin-username "$VM_USER" \
  --generate-ssh-keys \
  --public-ip-address "$VM_IP_NAME" \
  --nsg "$NSG_NAME" \
  --output table 2>/dev/null || true

# ── 5. Get IP ────────────────────────────────────────────────────────────────
VM_IP=$(az vm show --resource-group "$RG" --name "$VM_NAME" --show-details \
  --query publicIps -o tsv 2>/dev/null || echo "")
echo "VM Public IP: $VM_IP"

if [ -z "$VM_IP" ]; then
  echo "Failed to get VM IP. Exiting."
  exit 1
fi

# ── 6. Install Docker ─────────────────────────────────────────────────────
echo "Installing Docker on VM..."
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" 'bash -s' << 'DOCKER_SETUP'
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker.io docker-compose-v2
  sudo systemctl enable --now docker
  sudo usermod -aG docker $USER
  echo "Docker ready: $(docker --version)"
DOCKER_SETUP

# ── 7. Copy files ──────────────────────────────────────────────────────────
echo "Copying project to VM..."
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" 'mkdir -p ~/honeyai-marketing'
scp -o StrictHostKeyChecking=no -r \
  Dockerfile docker-compose.yml server client shared package.json package-lock.json \
  "$VM_USER@$VM_IP:~/honeyai-marketing/"

# ── 8. Create .env ──────────────────────────────────────────────────────────
echo "Setting up environment..."
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" "cat > ~/honeyai-marketing/.env << 'EOF'
DB_PASSWORD=\${DB_PASSWORD:-changeme123!}
JWT_SECRET=\${JWT_SECRET:-super-secret-jwt-key-change-in-production}
CLIENT_URL=http://$VM_IP:3000
AZURE_OPENAI_API_KEY=\${AZURE_OPENAI_API_KEY:-}
AZURE_OPENAI_DEPLOYMENT=gpt-4
LINKEDIN_CLIENT_ID=\${LINKEDIN_CLIENT_ID:-}
LINKEDIN_CLIENT_SECRET=\${LINKEDIN_CLIENT_SECRET:-}
SENDGRID_API_KEY=\${SENDGRID_API_KEY:-}
SENDGRID_FROM_EMAIL=noreply@honeypotz.net
TWILIO_ACCOUNT_SID=\${TWILIO_ACCOUNT_SID:-}
TWILIO_AUTH_TOKEN=\${TWILIO_AUTH_TOKEN:-}
TWILIO_PHONE_NUMBER=\${TWILIO_PHONE_NUMBER:-}
STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY:-}
STRIPE_WEBHOOK_SECRET=\${STRIPE_WEBHOOK_SECRET:-}
EOF"

# ── 9. Deploy ──────────────────────────────────────────────────────────────
echo "Building and deploying..."
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" << 'DEPLOY'
  cd ~/honeyai-marketing
  docker compose up -d --build
  sleep 10
  docker compose ps
DEPLOY

# ── 10. Done ──────────────────────────────────────────────────────────────
echo ""
echo "================================================"
echo "Honey AI Marketing deployed!"
echo "API:  http://$VM_IP:3001/api/health"
echo "SSH:  ssh $VM_USER@$VM_IP"
echo "================================================"