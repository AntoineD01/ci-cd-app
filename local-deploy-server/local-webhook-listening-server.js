const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const repoDir = 'C:/Users/Antoine Dupont/Documents';
const repoUrl = 'https://github.com/AntoineD01/ci-cd-app.git';

const repoName = path.basename(repoUrl, '.git');
const fullPath = path.join(repoDir, repoName);

app.post('/webhook', (req, res) => {
  console.log('🔔 Webhook received');

  try {
    if (!fs.existsSync(repoDir)) {
      fs.mkdirSync(repoDir, { recursive: true });
      console.log(`📁 Created repo directory at: ${repoDir}`);
    }

    process.chdir(repoDir);
    console.log(`📌 Changed working directory to: ${repoDir}`);

    if (!fs.existsSync(fullPath)) {
      console.log('📥 Cloning repository...');
      execSync(`git clone ${repoUrl}`);
    }

    process.chdir(fullPath);
    console.log(`📌 Changed into repository directory: ${fullPath}`);

    console.log('🔄 Checking out main branch...');
    execSync('git checkout main');

    console.log('⬇️ Pulling latest changes from origin/main...');
    execSync('git pull origin main');

    console.log('🛑 Stopping running containers...');
    try {
      execSync('docker compose down');
      console.log('✅ Containers stopped.');
    } catch (err) {
      console.warn('⚠️ Could not stop containers. They may not have been running.');
    }

    console.log('🧼 Cleaning up old Docker images...');
    const imageNames = execSync('docker compose config --services')
      .toString()
      .trim()
      .split('\n')
      .map(service => {
        try {
          const image = execSync(`docker compose config | awk '/${service}:/{flag=1;next}/image:/{if(flag){print $2;flag=0}}'`).toString().trim();
          return image || null;
        } catch {
          return null;
        }
      }).filter(Boolean);

    imageNames.forEach(image => {
      try {
        execSync(`docker rmi -f ${image}`);
        console.log(`🗑️ Removed old image: ${image}`);
      } catch {
        console.warn(`⚠️ Failed to remove image: ${image}`);
      }
    });

    console.log('📦 Pulling latest Docker images...');
    execSync('docker compose pull');
    console.log('✅ Images pulled successfully.');

    console.log('🚀 Starting containers...');
    execSync('docker compose up -d');
    console.log('✅ Containers started successfully.');

    res.status(200).send('✅ Deployment completed successfully.');
  } catch (err) {
    console.error('❌ Deployment failed:', err);
    res.status(500).send('❌ Deployment failed. Check logs for details.');
  }
});

app.listen(8000, () => {
  console.log('🌐 Webhook server listening on http://localhost:8000');
});
