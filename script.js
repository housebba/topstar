const nodes = CONFIG.NODES;

async function fetchNodeStatus(node) {
    const startTime = Date.now();
    try {
        // Cosmos SDK RPC status endpoint
        const response = await fetch(`${node.url}/status`, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        const latency = Date.now() - startTime;

        return {
            online: true,
            height: data.result.sync_info.latest_block_height,
            moniker: data.result.node_info.moniker,
            latency: latency,
            id: node.id
        };
    } catch (error) {
        console.error(`Error fetching node ${node.id}:`, error);
        return { online: false, id: node.id };
    }
}

async function fetchPeers(node) {
    try {
        const response = await fetch(`${node.url}/net_info`);
        const data = await response.json();
        return data.result.n_peers;
    } catch {
        return 0;
    }
}

function updateUI(nodeId, status, peers) {
    const card = document.getElementById(nodeId);
    if (!card) return;

    card.classList.remove('skeleton');

    if (status.online) {
        card.classList.add('online');
        card.querySelector('value').textContent = parseInt(status.height).toLocaleString();
        card.querySelectorAll('value')[1].textContent = peers;
        card.querySelector('.latency span').textContent = `${status.latency}ms`;
    } else {
        card.classList.remove('online');
        card.querySelector('value').textContent = 'OFFLINE';
        card.querySelectorAll('value')[1].textContent = '0';
        card.querySelector('.latency span').textContent = '--ms';
    }
}

async function refreshAll() {
    const results = await Promise.all(nodes.map(async node => {
        const status = await fetchNodeStatus(node);
        let peers = 0;
        if (status.online) {
            peers = await fetchPeers(node);
        }
        updateUI(node.id, status, peers);
        return status;
    }));

    // Update Overview
    const onlineNodes = results.filter(r => r.online);
    document.getElementById('active-nodes').textContent = `${onlineNodes.length} / ${nodes.length}`;

    if (onlineNodes.length > 0) {
        const highest = Math.max(...onlineNodes.map(r => parseInt(r.height)));
        document.getElementById('highest-block').textContent = highest.toLocaleString();
    } else {
        document.getElementById('highest-block').textContent = '---';
    }
}

// Initial refresh and setup interval
refreshAll();
setInterval(refreshAll, 5000);
