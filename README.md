










# OpenGrid - Decentralized Compute Mesh for AI

OpenGrid is an open-source platform that enables decentralized AI compute job execution. It allows requesters to submit machine learning and rendering jobs (like LLM inference, SDXL image generation, PyTorch training) to a network of volunteer providers who run these tasks in containers or micro-VMs.

## Key Features

- **Decentralized Marketplace**: Akash-style leasing with Render-style GPU aggregation
- **Provider/Requestor Model**: Golem-inspired roles with Bittensor-like validator scoring
- **Verification & Security**: Quorum voting, canary tasks, and optional TEEs for result verification
- **Payment System**: Streaming/milestone escrow using USDC test tokens on Base Sepolia

## Architecture Overview

```
[Requesters] <-> [Coordinator API] <-> [Provider Network]
         |                     |
         v                     v
   [Job Submission UI]    [Smart Contracts (Escrow)]
```

## Getting Started

### Prerequisites

- Docker and docker-compose
- Node.js 18+
- Rust toolchain
- Go 1.20+
- Python 3.8+

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/lxsolutions/opengrid.git
cd opengrid

# Start development environment (requires Docker)
make dev
```

This will spin up:
- Two provider agents
- One coordinator node
- IPFS daemon
- Anvil EVM testnet

### Running Examples

```bash
# Submit an LLM inference job
opengrid/cli/og submit examples/llm-infer/job.yaml

# Check job status
opengrid/cli/og status <job_id>

# View provider logs
opengrid/cli/og logs --provider <id>
```

## Components

### `/daemon` - Provider Agent (Rust)
- Detects CPU/GPU resources
- Advertises via libp2p DHT/pubsub
- Runs jobs in containerd with gVisor/Firecracker sandboxing
- Streams metrics and signed receipts back to coordinators

### `/coordinator` - Marketplace & Scheduler (TypeScript)
- Order book matching for price/SLA/resource fit
- Redundant assignment (N-of-M) + canary tasks
- Reputation system integration with smart contracts

### `/contracts` - Smart Contracts (Solidity)
- `JobEscrow`: USDC escrow, streaming payments, partial refunds
- `ReputationRegistry`: non-transferable proof-of-service scores
- `ProviderRegistry`: stake-to-serve model with attestation storage

### `/cli` - Command Line Interface (Python)
- Submit jobs: `og submit job.yaml`
- Check status: `og status <job>`
- View logs: `og logs --provider <id>`
- Withdraw earnings: `og withdraw`

### `/ui` - Web Dashboard (Next.js + Tailwind)
- Job submission interface
- Live monitoring of running jobs via websockets
- Provider earnings dashboard

## Example Jobs

The `/examples` directory contains sample job specifications:

- **LLM Inference**: llama.cpp container for text generation
- **SDXL Generation**: ComfyUI/InvokeAI container producing PNGs to IPFS
- **PyTorch Training**: MNIST micro-training with checkpoint uploads
- **Blender Rendering**: Headless scene rendering

## Security Hardening (MVP)

- Container isolation via gVisor/Firecracker
- Pull-only images from local registry with cosign verification
- No outbound egress by default; allow-list via spec
- Secrets mounted from short-lived vaulted files, destroyed post-run

## Economics

- Stablecoin (USDC testnet) escrow with 1% protocol fee
- Small provider bond requirement for registration
- Reputation increases for verified completions, decays over time

## Roadmap

- ZK-compute proofs integration
- Rollup-based payments optimization
- Mobile-GPU lightweight providers
- Enterprise trust tiers and SLA guarantees

## License

MIT License - see [LICENSE](LICENSE) file.

---

**OpenGrid is an open-source initiative to create a decentralized compute mesh for AI workloads. Join us in building the future of distributed computing!**





