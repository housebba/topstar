# 🚀 TOPSTAR: Multi-Node Blockchain Testnet

**TOPSTAR**는 Cosmos SDK 기반의 블록체인 네트워크입니다. 
**OCI(Oracle Cloud Infrastructure) 환경에서 3중화 노드를 구축하고 GitHub Actions를 통해 전체 배포 파이프라인을 자동화**한 테스트넷 프로젝트입니다.

---

## 🌐 Live Network Monitoring
실시간으로 중단 없이 블록을 생성 중인 TOPSTAR 테스트넷의 상태를 확인하세요.

### 👉 [실시간 네트워크 대시보드 확인하기](https://housebba.github.io/topstar/)
*(주의: 실시간 노드 통신을 위해 브라우저 설정에서 '안전하지 않은 콘텐츠 허용'이 필요할 수 있습니다.)*

---

## 🏗 System Architecture

본 프로젝트는 분산 원장의 핵심 가치인 '가용성'과 '자동화'에 초점을 맞추어 설계되었습니다.

- **Infrastructure:** OCI ARM64 리눅스 인스턴스 3개 (Compute Cluster)
- **CI/CD:** GitHub Actions 기반의 완전 자동화 배포
- **Node Type:** 1-Validator (Master), 2-Peered Nodes
- **Monitoring:** Vanilla JS 기반의 라이트웨이트 실시간 대시보드

---

## 🛠 Engineering Highlights

### 1. Zero-Manual Deployment (완전 자동화)
- `git push` 한 번으로 바이너리 빌드부터 3대의 원격 서버 배포, 서비스 재시작까지 전 과정을 자동화했습니다.
- **SSH Automation:** 각 서버에 수동 접속 없이 GitHub Actions가 `systemd` 서비스를 등록하고 관리합니다.

### 2. Infrastructure as Code (IaC) 기반 설정 조작
- `sed` 및 쉘 스크립트를 활용하여 각 노드의 `genesis.json`, `config.toml`, `app.toml` 설정을 배포 시점에 동적으로 주입합니다.
- 특히 **P2P 자동 피어링** 로직을 통해 마스터 노드의 정보를 하위 노드들이 자동으로 인식하여 네트워크를 형성합니다.

### 3. 실시간 분산 네트워크 통신
- 각 노드의 RPC(26657) 및 API(1317) 포트를 안전하게 개방하고, **CORS 설정**을 자동화하여 웹 대시보드와의 실시간 데이터 바인딩을 구현했습니다.

### 4. 고가용성 서비스 운영
- `systemd` 데몬을 통해 프로세스가 예기치 않게 종료되어도 즉시 재시작되는 **Self-healing** 구조를 갖추고 있습니다.

---

## 💻 Tech Stack

- **Core:** Cosmos SDK, Tendermint (CometBFT)
- **Language:** Go (Golang)
- **DevOps:** GitHub Actions, Shell Scripting, YAML
- **Platform:** OCI (Oracle Cloud Infrastructure), Ubuntu (ARM64)
- **Frontend:** HTML5, CSS3 (Glassmorphism design), Vanilla JavaScript

---

## 📖 How to Run Locally

### Prerequisites
- [Go](https://golang.org/doc/install) 1.25 이상
- [Ignite CLI](https://ignite.com/cli)

### Install & Run
```bash
# 바이너리 빌드 및 로컬 테스트넷 시작
ignite chain serve
```

---

## 👤 Author
- **Name:** Won (housebba)
- **Project Goal:** 실무급 블록체인 인프라 구축 및 자동화 파이프라인 증명

---
*본 프로젝트는 학습 및 포트폴리오 목적으로 구축되었으며, 모든 코드는 오픈소스입니다.*
