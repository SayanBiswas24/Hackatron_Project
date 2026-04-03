# LocalNet Setup Guide for Linux

Follow these steps to prepare your environment for PennyStalker LocalNet testing.

## 1. Install Docker
AlgoKit relies on Docker to run the Algorand nodes locally.

```bash
# Update and install pre-requisites
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg

# Add Docker's official GPG key:
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker Engine and Compose
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl enable --now docker

# Add your user to the docker group (to run docker without sudo)
# IMPORTANT: You must LOG OUT and LOG IN again for this to take effect!
sudo usermod -aG docker $USER
```

## 2. Install AlgoKit
The Algorand development CLI.

```bash
# Ensure pipx is installed
sudo apt install pipx
pipx ensurepath

# Install AlgoKit
pipx install algokit

# Verify installation (Restart terminal after install)
algokit --version
```

## 3. Initialize LocalNet
Once Docker is running, launch the local blockchain.

```bash
# Start LocalNet
algokit localnet start

# Check status
algokit localnet status
```

## 4. PennyStalker Bootstrap
After I complete the codebase changes, you will run this script to deploy the contract and create Mock USDC on your LocalNet.

```bash
cd backend
npx tsx scripts/bootstrap-localnet.ts
```

> [!IMPORTANT]
> Keep Docker running in the background. If LocalNet feels sluggish, run `algokit localnet reset` to start fresh.
