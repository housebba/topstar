# 🚀 TOPSTAR: Multi-Node Blockchain Testnet

**TOPSTAR**는 Cosmos SDK 기반의 블록체인 네트워크입니다. 
**OCI(Oracle Cloud Infrastructure) 환경에서 3중화 노드를 구축하고 GitHub Actions를 통해 전체 배포 파이프라인을 자동화**한 테스트넷 프로젝트입니다.

---

## 🌐 Live Network Monitoring
실시간으로 중단 없이 블록을 생성 중인 TOPSTAR 테스트넷의 상태를 확인하세요.

### 👉 [실시간 인터랙티브 대시보드 바로가기](https://housebba.github.io/topstar/)

> 🚀 **주요 기능**: 실시간 노드 상태 모니터링 + **MYTOKEN 민팅, 소각, 전송** 인터랙션


> 💡 **중요: 실시간 데이터 확인 방법**
> 
> 대시보드는 HTTPS 환경이나 노드는 HTTP 통신을 사용하므로 브라우저 보안 설정을 변경해야 데이터가 보입니다. (Chrome 기준)
> 1. 아래 링크를 주소창에 붙여넣어 해당 사이트의 설정으로 이동합니다.
>    `chrome://settings/content/siteDetails?site=https%3A%2F%2Fhousebba.github.io`
> 2. 하단의 **[안전하지 않은 콘텐츠] (Insecure content)** 항목을 **[허용] (Allow)**으로 변경합니다.
> 3. 대시보드 페이지를 새로고침합니다.

---

## 🏗 System Architecture

본 프로젝트는 분산 원장의 핵심 가치인 '가용성'과 '자동화'에 초점을 맞추어 설계되었습니다.

- **Infrastructure:** OCI ARM64 리눅스 인스턴스 3개 (Compute Cluster)
- **CI/CD:** GitHub Actions 기반의 완전 자동화 배포 (Binaries + Frontend Build)
- **Node Type:** 1-Validator (Master), 2-Peered Nodes
- **Frontend Dashboard:** Vite + CosmJS 기반의 인터랙티브 웹 앱 (Real-time TX execution)


---

## 🛠 Engineering Highlights

### 1. Zero-Manual Deployment (완전 자동화)
- `git push` 한 번으로 바이너리 빌드부터 3대의 원격 서버 배포, 서비스 재시작까지 전 과정을 자동화했습니다.
- **SSH Automation:** 각 서버에 수동 접속 없이 GitHub Actions가 `systemd` 서비스를 등록하고 관리합니다.

### 2. Infrastructure as Code (IaC) 기반 설정 조작
- `sed` 및 쉘 스크립트를 활용하여 각 노드의 `genesis.json`, `config.toml`, `app.toml` 설정을 배포 시점에 동적으로 주입합니다.
- 특히 **P2P 자동 피어링** 로직을 통해 마스터 노드의 정보를 하위 노드들이 자동으로 인식하여 네트워크를 형성합니다.

### 3. 실시간 인터랙티브 트랜잭션 (CosmJS)
- **Direct Interaction:** 대시보드에서 직접 블록체인 노드(RPC)와 통신하여 `MsgMint`, `MsgBurn`, `MsgSend` 트랜잭션을 실행합니다.
- **Custom Module Support:** Ignite CLI를 통해 생성된 TypeScript 클라이언트를 통합하여 커스텀 모듈(`mytoken`)의 메시지 타입을 완벽하게 지원합니다.


### 4. 고가용성 서비스 운영
- `systemd` 데몬을 통해 프로세스가 예기치 않게 종료되어도 즉시 재시작되는 **Self-healing** 구조를 갖추고 있습니다.

---

## 💻 Tech Stack

- **Core:** Cosmos SDK, Tendermint (CometBFT)
- **Language:** Go (Golang)
- **DevOps:** GitHub Actions, Shell Scripting, YAML
- **Platform:** OCI (Oracle Cloud Infrastructure), Ubuntu (ARM64)
- **Frontend:** Vite, CosmJS, HTML5, CSS3 (Premium Glassmorphism), JavaScript (ES6+)
- **Testing Tools:** Ignite CLI (TS Client Generation), Keplr-compatible interface


---

## 📖 How to Run Locally

### Prerequisites
- [Go](https://golang.org/doc/install) 1.25 이상
- [Ignite CLI](https://ignite.com/cli)

### 1. Blockchain Node Run
```bash
# 로컬 테스트넷 시작
ignite chain serve
```

### 2. Web Dashboard Run
```bash
# 대시보드 빌드 및 실행
cd dashboard
npm install
npm run dev
```


---

## 👤 Author
- **Name:** Won (housebba)
- **Project Goal:** 실무급 블록체인 인프라 구축 및 자동화 파이프라인 증명

---
*본 프로젝트는 학습 및 포트폴리오 목적으로 구축되었으며, 모든 코드는 오픈소스입니다.*
