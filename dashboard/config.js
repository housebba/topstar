// 대시보드에서 조회할 노드들의 IP 주소를 설정하세요.
// 포트 26657(RPC)이 외부에서 접근 가능해야 합니다.

const CONFIG = {
    NODES: [
        {
            id: 'node-01',
            name: 'Validator Node 01',
            url: 'http://YOUR_SERVER_1_IP:26657'
        },
        {
            id: 'node-02',
            name: 'Validator Node 02',
            url: 'http://YOUR_SERVER_2_IP:26657'
        },
        {
            id: 'node-03',
            name: 'Validator Node 03',
            url: 'http://YOUR_SERVER_3_IP:26657'
        }
    ]
};
