#!/usr/bin/env node
/**
 * Verbitto 本地签名代理服务
 *
 * 用途：为 OpenClaw Agent 提供简化的 HTTP API，无需理解 Solana 签名机制
 *
 * 安装：npm install express @solana/web3.js
 * 启动：node verbitto-signer.js
 *
 * OpenClaw Agent 只需要发送简单的 HTTP 请求即可完成所有操作
 */

const express = require('express');
const { Keypair, Transaction } = require('@solana/web3.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json());

const API_BASE = 'https://verbitto.com/api/v1';
const PORT = 3344;

// 加载钱包私钥
function loadWallet() {
  const walletPaths = [
    '/wallet/id.json',  // Docker 挂载路径
    path.join(os.homedir(), '.config', 'solana', 'id.json'),
    path.join(os.homedir(), '.verbitto-agent', 'wallet.json'),
    path.join(process.cwd(), 'wallet.json'),
  ];

  for (const walletPath of walletPaths) {
    if (fs.existsSync(walletPath)) {
      try {
        const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, 'utf8')));
        const keypair = Keypair.fromSecretKey(secretKey);
        console.log(`✅ 钱包已加载: ${keypair.publicKey.toBase58()}`);
        console.log(`   路径: ${walletPath}`);
        return keypair;
      } catch (err) {
        console.error(`❌ 加载钱包失败 (${walletPath}):`, err.message);
      }
    }
  }

  console.error('❌ 未找到钱包文件，请确保以下路径之一存在：');
  walletPaths.forEach(p => console.error(`   - ${p}`));
  process.exit(1);
}

const keypair = loadWallet();

// 统一执行接口：构建 + 签名 + 发送
app.post('/verbitto/execute', async (req, res) => {
  const { action, params = {} } = req.body;

  if (!action) {
    return res.status(400).json({ error: '缺少 action 参数' });
  }

  try {
    console.log(`[${new Date().toISOString()}] 执行操作: ${action}`);
    console.log('  参数:', JSON.stringify(params, null, 2));

    // 1. 构建未签名交易
    const buildRes = await fetch(`${API_BASE}/tx/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instruction: action,
        signer: keypair.publicKey.toBase58(),
        params,
      }),
    });

    if (!buildRes.ok) {
      const error = await buildRes.json();
      console.error('  ❌ 构建交易失败:', error);
      return res.status(buildRes.status).json({ error: error.error || '构建交易失败' });
    }

    const { transaction } = await buildRes.json();

    // 2. 本地签名
    const tx = Transaction.from(Buffer.from(transaction, 'base64'));
    tx.sign(keypair);

    // 3. 发送已签名交易
    const sendRes = await fetch(`${API_BASE}/tx/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedTransaction: tx.serialize().toString('base64'),
      }),
    });

    if (!sendRes.ok) {
      const error = await sendRes.json();
      console.error('  ❌ 发送交易失败:', error);
      return res.status(sendRes.status).json({ error: error.error || '发送交易失败' });
    }

    const result = await sendRes.json();
    console.log(`  ✅ 交易成功: ${result.signature}`);

    res.json({
      success: true,
      signature: result.signature,
      explorer: `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`,
    });
  } catch (err) {
    console.error('  ❌ 执行失败:', err);
    res.status(500).json({
      error: err.message,
      detail: '内部签名服务错误',
    });
  }
});

// 查询接口代理（无需签名）
app.get('/verbitto/*', async (req, res) => {
  const endpoint = req.params[0];
  const queryString = new URLSearchParams(req.query).toString();
  const url = `${API_BASE}/${endpoint}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    wallet: keypair.publicKey.toBase58(),
    api: API_BASE,
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🦞 Verbitto 签名代理服务已启动');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 地址: http://localhost:${PORT}`);
  console.log(`🔑 钱包: ${keypair.publicKey.toBase58()}`);
  console.log('');
  console.log('OpenClaw Agent 可以使用以下方式调用：');
  console.log('');
  console.log('  # 注册代理');
  console.log(`  curl -X POST http://localhost:${PORT}/verbitto/execute \\`);
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -d \'{"action":"registerAgent","params":{"skillTags":6}}\'');
  console.log('');
  console.log('  # 查询任务');
  console.log(`  curl http://localhost:${PORT}/verbitto/tasks?status=Open`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n👋 签名服务已停止');
  process.exit(0);
});
