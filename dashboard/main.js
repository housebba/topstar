/* main.js - Vite 엔트리 포인트 */
import { SigningStargateClient, StargateClient, GasPrice, defaultRegistryTypes } from "@cosmjs/stargate";

import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { msgTypes as mytokenMsgTypes } from "./ts-client/topstar.mytoken.v1/registry";

// Registry 설정
const registry = new Registry([...defaultRegistryTypes, ...mytokenMsgTypes]);


// ============================================
// CONFIG & VERSION
// ============================================
const VERSION = '1.0.3';
const CONFIG = {
    CHAIN_ID: 'topstar-testnet-1',
    DENOM: 'umytoken',
    // 안전한 주소 로딩 로직
    RPC: (typeof import.meta.env.VITE_RPC_URL === 'string' && import.meta.env.VITE_RPC_URL.length > 10)
        ? import.meta.env.VITE_RPC_URL
        : 'http://localhost:26657',

    API: (typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.length > 10)
        ? import.meta.env.VITE_API_URL
        : 'http://localhost:1317',

    NODES: [
        {
            id: 'node-01',
            name: 'Validator Node 01',
            url: (import.meta.env.VITE_NODE1_URL && import.meta.env.VITE_NODE1_URL.length > 12)
                ? import.meta.env.VITE_NODE1_URL
                : 'http://localhost:26657'
        },
        {
            id: 'node-02',
            name: 'Validator Node 02',
            url: (import.meta.env.VITE_NODE2_URL && import.meta.env.VITE_NODE2_URL.length > 12)
                ? import.meta.env.VITE_NODE2_URL
                : 'http://localhost:26657'
        },
        {
            id: 'node-03',
            name: 'Validator Node 03',
            url: (import.meta.env.VITE_NODE3_URL && import.meta.env.VITE_NODE3_URL.length > 12)
                ? import.meta.env.VITE_NODE3_URL
                : 'http://localhost:26657'
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
    cosmjsReady: false,

    async init() {
        console.log(`%c 🚀 TOPSTAR Dashboard v${VERSION} `, 'background: #222; color: #bada55; padding: 5px;');
        console.log('📡 RPC:', CONFIG.RPC);
        console.log('📡 API:', CONFIG.API);

        this.log(`🚀 시스템 초기화 중... (v${VERSION})`, 'system');

        try {
            for (const [key, account] of Object.entries(CONFIG.ACCOUNTS)) {
                // 니모닉에서 지갑 생성
                this.wallets[key] = await DirectSecp256k1HdWallet.fromMnemonic(
                    account.mnemonic,
                    { prefix: 'cosmos' }
                );

                const [acc] = await this.wallets[key].getAccounts();
                account.address = acc.address;

                // UI에 주소 표시
                const addrElem = document.querySelector(`#user-${key} .address`);
                if (addrElem) addrElem.textContent = account.address;

                this.log(`${account.name} 지갑 준비됨: ${account.address.slice(0, 15)}...`, 'system');
            }

            this.cosmjsReady = true;
            this.updateBalances();
            setInterval(() => this.updateBalances(), 10000);

            // 버튼 이벤트 리스너 등록
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

                if (action === 'mint') {
                    await this.mint(btn.dataset.user);
                } else if (action === 'burn') {
                    await this.burn(btn.dataset.user);
                } else if (action === 'transfer') {
                    await this.transfer(btn.dataset.from, btn.dataset.to);
                }
            });
        });
    },

    async updateBalances() {
        for (const [key, account] of Object.entries(CONFIG.ACCOUNTS)) {
            if (!account.address) continue;

            let amount = 0;
            let success = false;

            // 시도 1: RPC (StargateClient) - 가장 정확함
            try {
                const client = await StargateClient.connect(CONFIG.RPC);
                const balance = await client.getBalance(account.address, CONFIG.DENOM);
                amount = balance ? parseInt(balance.amount) : 0;
                success = true;
            } catch (rpcError) {
                // 시도 2: REST API (Fetch) - RPC가 Mixed Content로 막힐 때의 백업
                try {
                    const response = await fetch(`${CONFIG.API}/cosmos/bank/v1beta1/balances/${account.address}/by_denom?denom=${CONFIG.DENOM}`);
                    if (response.ok) {
                        const data = await response.json();
                        amount = data.balance ? parseInt(data.balance.amount) : 0;
                        success = true;
                    }
                } catch (apiError) {
                    // 둘 다 실패
                }
            }

            if (success) {
                const amtElem = document.querySelector(`#user-${key} .amount`);
                if (amtElem) amtElem.textContent = amount.toLocaleString();
            } else {
                console.warn(`${key} 잔액 업데이트 실패 (RPC/API 모두 응답 없음)`);
            }
        }
    },



    async mint(userKey) {
        const account = CONFIG.ACCOUNTS[userKey];
        if (!account?.address) {
            return this.log('지갑이 준비되지 않았습니다.', 'error');
        }

        const msg = {
            typeUrl: '/topstar.mytoken.v1.MsgMint',
            value: {
                creator: account.address,
                amount: '100'
            }
        };


        await this.sendTx(userKey, [msg], 'Mint 100 MYTOKEN');
    },

    async burn(userKey) {
        const account = CONFIG.ACCOUNTS[userKey];
        if (!account?.address) {
            return this.log('지갑이 준비되지 않았습니다.', 'error');
        }

        const msg = {
            typeUrl: '/topstar.mytoken.v1.MsgBurn',
            value: {
                creator: account.address,
                amount: '50'
            }
        };

        await this.sendTx(userKey, [msg], 'Burn 50 MYTOKEN');
    },

    async transfer(fromKey, toKey) {
        const fromAccount = CONFIG.ACCOUNTS[fromKey];
        const toAccount = CONFIG.ACCOUNTS[toKey];

        if (!fromAccount?.address || !toAccount?.address) {
            return this.log('지갑이 준비되지 않았습니다.', 'error');
        }

        const msg = {
            typeUrl: '/cosmos.bank.v1beta1.MsgSend',
            value: {
                fromAddress: fromAccount.address,
                toAddress: toAccount.address,
                amount: [{ denom: CONFIG.DENOM, amount: '10' }]
            }
        };

        await this.sendTx(fromKey, [msg], `Transfer 10 to ${toAccount.name}`);
    },

    async sendTx(userKey, msgs, memo) {
        if (!this.cosmjsReady) {
            return this.log('시스템이 아직 준비되지 않았습니다.', 'error');
        }

        try {
            const wallet = this.wallets[userKey];
            const [account] = await wallet.getAccounts();

            this.log(`⏳ ${memo} 전송 중...`, 'system');

            const client = await SigningStargateClient.connectWithSigner(
                CONFIG.RPC,
                wallet,
                {
                    registry, // 커스텀 레지스트리 등록
                    gasPrice: GasPrice.fromString("0stake")
                }
            );


            const result = await client.signAndBroadcast(
                account.address,
                msgs,
                "auto",
                memo
            );

            if (result.code === 0) {
                this.log(`✅ 성공! [${memo}]`, 'success', result.transactionHash);
                setTimeout(() => this.updateBalances(), 2000);
            } else {
                this.log(`❌ 실패: ${result.rawLog}`, 'error');
            }

            return result;
        } catch (e) {
            console.error('트랜잭션 에러:', e);
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
// NODE STATUS (script.js 기능)
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
            catchingUp: data.result.sync_info.catching_up,
            latestBlockTime: data.result.sync_info.latest_block_time
        };
    } catch (e) {
        console.warn(`Error fetching node ${node.id}:`, e.message);
        return { ...node, online: false };
    }
}

function renderNodeCard(node) {
    const card = document.createElement('div');
    card.className = `node-card ${node.online ? (node.catchingUp ? 'syncing' : 'online') : 'offline'}`;

    const statusText = node.online
        ? (node.catchingUp ? 'Syncing...' : 'Online')
        : 'Offline';

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
    const results = await Promise.all(
        CONFIG.NODES.map(node => fetchNodeStatus(node))
    );

    const container = document.getElementById('nodes-container');
    if (container) {
        container.innerHTML = '';
        results.forEach(node => container.appendChild(renderNodeCard(node)));
    }

    // 통계 업데이트
    const onlineNodes = results.filter(n => n.online);
    const activeNodesElem = document.getElementById('active-nodes');
    if (activeNodesElem) {
        activeNodesElem.textContent = `${onlineNodes.length} / ${CONFIG.NODES.length}`;
    }

    if (onlineNodes.length > 0) {
        const maxHeight = Math.max(...onlineNodes.map(n => n.blockHeight));
        const highestBlockElem = document.getElementById('highest-block');
        if (highestBlockElem) {
            highestBlockElem.textContent = maxHeight.toLocaleString();
        }
    }
}

// ============================================
// INIT
// ============================================
window.interact = interact; // 디버깅용

document.addEventListener('DOMContentLoaded', () => {
    interact.init();
    refreshAll();
    setInterval(refreshAll, 5000);
});
