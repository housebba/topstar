/* main.js - Vite 엔트리 포인트 */
import { SigningStargateClient, StargateClient, GasPrice, defaultRegistryTypes } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { msgTypes as mytokenMsgTypes } from "./ts-client/topstar.mytoken.v1/registry";
import { Buffer } from "buffer";

// Vite/Browser Polyfills
window.Buffer = Buffer;
window.process = { env: {} };

// Registry 설정
const registry = new Registry([...defaultRegistryTypes, ...mytokenMsgTypes]);

const CONFIG = {
    CHAIN_ID: 'topstar-testnet-1',
    DENOM: 'umytoken',
    RPC: import.meta.env.VITE_RPC_URL || 'http://localhost:26657',
    API: import.meta.env.VITE_API_URL || 'http://localhost:1317',

    NODES: [
        {
            id: 'node-01',
            name: 'Validator Node 01',
            url: import.meta.env.VITE_NODE1_URL || 'http://localhost:26657'
        },
        {
            id: 'node-02',
            name: 'Validator Node 02',
            url: import.meta.env.VITE_NODE2_URL || 'http://localhost:26657'
        },
        {
            id: 'node-03',
            name: 'Validator Node 03',
            url: import.meta.env.VITE_NODE3_URL || 'http://localhost:26657'
        }
    ],

    ACCOUNTS: {
        alice: {
            name: 'Alice (Admin)',
            mnemonic: 'duty cricket season pair core apology lava announce liberty prison flip viable assist cook armor blind strong agree online phone fold shaft heavy slow',
            address: null
        },
        bob: {
            name: 'Bob (User)',
            mnemonic: 'media cluster angry because size athlete wrist advice couch room border angle response whip bless fruit canvas iron jaguar craft virtual gold member today',
            address: null
        }
    }
};

// ============================================
// INTERACT MODULE
// ============================================
const interact = {
    wallets: {},
    rpcClient: null,
    cosmjsReady: false,

    async init() {
        this.log('🚀 시스템 초기화 중...', 'system');

        try {
            // 초기 RPC 연결 시도
            try {
                this.rpcClient = await StargateClient.connect(CONFIG.RPC);
            } catch (e) {
                console.warn('RPC 초기 연결 실패 (백업 API 사용):', e.message);
            }

            for (const [key, account] of Object.entries(CONFIG.ACCOUNTS)) {
                this.wallets[key] = await DirectSecp256k1HdWallet.fromMnemonic(
                    account.mnemonic,
                    { prefix: 'cosmos' }
                );

                const [acc] = await this.wallets[key].getAccounts();
                account.address = acc.address;

                const addrElem = document.querySelector(`#user-${key} .address`);
                if (addrElem) addrElem.textContent = account.address;

                this.log(`${account.name} 지갑 준비됨`, 'system');
            }

            this.cosmjsReady = true;
            this.updateBalances();
            setInterval(() => this.updateBalances(), 10000);
            this.setupButtonListeners();

            this.log('✅ 모든 시스템 준비 완료', 'success');
        } catch (e) {
            console.error('초기화 에러:', e);
            this.log('❌ 초기화 실패: ' + e.message, 'error');
        }
    },

    setupButtonListeners() {
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const action = btn.dataset.action;
                if (action === 'mint') await this.mint(btn.dataset.user);
                else if (action === 'burn') await this.burn(btn.dataset.user);
                else if (action === 'transfer') await this.transfer(btn.dataset.from, btn.dataset.to);
            });
        });
    },

    async updateBalances() {
        for (const [key, account] of Object.entries(CONFIG.ACCOUNTS)) {
            if (!account.address) continue;

            let amount = 0;
            let success = false;

            // 시도 1: RPC (StargateClient)
            try {
                if (!this.rpcClient) this.rpcClient = await StargateClient.connect(CONFIG.RPC);
                const balance = await this.rpcClient.getBalance(account.address, CONFIG.DENOM);
                amount = balance ? parseInt(balance.amount) : 0;
                success = true;
            } catch (e) {
                this.rpcClient = null;
            }

            // 시도 2: REST API 백업 (전체 조회 후 필터링)
            if (!success) {
                try {
                    const response = await fetch(`${CONFIG.API}/cosmos/bank/v1beta1/balances/${account.address}`);
                    if (response.ok) {
                        const data = await response.json();
                        const found = (data.balances || []).find(b => b.denom === CONFIG.DENOM);
                        amount = found ? parseInt(found.amount) : 0;
                        success = true;
                    }
                } catch (e) { }
            }

            if (success) {
                const amtElem = document.querySelector(`#user-${key} .amount`);
                if (amtElem) amtElem.textContent = amount.toLocaleString();
            }
        }
    },

    async mint(userKey) {
        const account = CONFIG.ACCOUNTS[userKey];
        if (!account?.address) return this.log('지갑이 준비되지 않았습니다.', 'error');

        const amountInput = document.getElementById(`mint-amount-${userKey}`);
        const amount = amountInput ? amountInput.value : '100';

        const msg = {
            typeUrl: '/topstar.mytoken.v1.MsgMint',
            value: { creator: account.address, amount: amount }
        };
        await this.sendTx(userKey, [msg], `Mint ${amount} MYTOKEN`);
    },

    async burn(userKey) {
        const account = CONFIG.ACCOUNTS[userKey];
        if (!account?.address) return this.log('지갑이 준비되지 않았습니다.', 'error');

        const amountInput = document.getElementById(`burn-amount-${userKey}`);
        const amount = amountInput ? amountInput.value : '50';

        const msg = {
            typeUrl: '/topstar.mytoken.v1.MsgBurn',
            value: { creator: account.address, amount: amount }
        };
        await this.sendTx(userKey, [msg], `Burn ${amount} MYTOKEN`);
    },

    async transfer(fromKey, toKey) {
        const fromAccount = CONFIG.ACCOUNTS[fromKey];
        const toAccount = CONFIG.ACCOUNTS[toKey];

        if (!fromAccount?.address || !toAccount?.address) {
            return this.log('지갑이 준비되지 않았습니다.', 'error');
        }

        const amountInput = document.getElementById('transfer-amount');
        const amount = amountInput ? amountInput.value : '10';

        // Use the new custom message type with tax
        const msg = {
            typeUrl: '/topstar.mytoken.v1.MsgTransferWithTax',
            value: {
                fromAddress: fromAccount.address,
                toAddress: toAccount.address,
                amount: amount
            }
        };
        await this.sendTx(fromKey, [msg], `Taxed Transfer ${amount} to ${toAccount.name}`);
    },

    async sendTx(userKey, msgs, memo) {
        if (!this.cosmjsReady) return this.log('시스템이 아직 준비되지 않았습니다.', 'error');

        try {
            const wallet = this.wallets[userKey];
            const [account] = await wallet.getAccounts();
            this.log(`⏳ ${memo} 전송 중...`, 'system');

            const client = await SigningStargateClient.connectWithSigner(
                CONFIG.RPC,
                wallet,
                {
                    registry,
                    gasPrice: GasPrice.fromString("0stake")
                }
            );

            const result = await client.signAndBroadcast(account.address, msgs, "auto", memo);

            if (result.code === 0) {
                this.log(`✅ 성공! [${memo}]`, 'success', result.transactionHash);
                setTimeout(() => this.updateBalances(), 2000);
            } else {
                this.log(`❌ 실패: ${result.rawLog}`, 'error');
            }
            return result;
        } catch (e) {
            this.log(`❌ 에러: ${e.message}`, 'error');
        }
    },

    log(msg, type, hash = null) {
        console.log(`[${type}]`, msg);
        const logContainer = document.getElementById('tx-log');
        if (!logContainer) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.innerHTML = `<span>[${new Date().toLocaleTimeString()}] ${msg}</span>` +
            (hash ? `<br><small>TX: ${hash.substring(0, 20)}...</small>` : '');
        logContainer.prepend(entry);
    }
};

// ============================================
// NODE STATUS
// ============================================
async function fetchNodeStatus(node) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${node.url}/status`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();
        return {
            ...node,
            online: true,
            blockHeight: parseInt(data.result.sync_info.latest_block_height),
            catchingUp: data.result.sync_info.catching_up
        };
    } catch (e) {
        return { ...node, online: false };
    }
}

function renderNodeCard(node) {
    const card = document.createElement('div');
    card.className = `node-card ${node.online ? (node.catchingUp ? 'syncing' : 'online') : 'offline'}`;
    const statusText = node.online ? (node.catchingUp ? 'Syncing...' : 'Online') : 'Offline';

    card.innerHTML = `
        <div class="node-status-dot"></div>
        <h3>${node.name}</h3>
        <div class="node-info">
            <span>Block Height</span>
            <strong>${node.online ? node.blockHeight.toLocaleString() : '---'}</strong>
        </div>
        <div class="node-info">
            <span>Status</span>
            <strong>${statusText}</strong>
        </div>
    `;
    return card;
}

async function refreshAll() {
    const results = await Promise.all(CONFIG.NODES.map(node => fetchNodeStatus(node)));
    const container = document.getElementById('nodes-container');
    if (container) {
        container.innerHTML = '';
        results.forEach(node => container.appendChild(renderNodeCard(node)));
    }

    const onlineNodes = results.filter(n => n.online);
    const activeNodesElem = document.getElementById('active-nodes');
    if (activeNodesElem) activeNodesElem.textContent = `${onlineNodes.length} / ${CONFIG.NODES.length}`;

    if (onlineNodes.length > 0) {
        const maxHeight = Math.max(...onlineNodes.map(n => n.blockHeight));
        const highestBlockElem = document.getElementById('highest-block');
        if (highestBlockElem) highestBlockElem.textContent = maxHeight.toLocaleString();
    }
}

// ============================================
// INIT
// ============================================
window.interact = interact;
document.addEventListener('DOMContentLoaded', () => {
    interact.init();
    refreshAll();
    setInterval(refreshAll, 6000);
});
