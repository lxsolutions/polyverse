# OpenGrid - Decentralized Compute Mesh for AI

OpenGrid is a decentralized compute mesh that allows requesters to submit AI compute jobs (LLM inference, SDXL rendering, small PyTorch training) to a network of volunteer providers. Jobs run in containers or micro-VMs, are verified, and providers get paid via streaming/milestone escrow on an EVM testnet.

## Project Structure

- `/daemon`: Provider agent (Rust/Go)
- `/coordinator`: Federated marketplace & scheduler (TypeScript/Node)
- `/contracts`: Smart contracts for escrow and reputation (Solidity + Foundry)
- `/cli`: Command line interface (Python)
- `/ui`: Web dashboard (Next.js + Tailwind)
- `/verifier`: Job verification service (Go)
- `/examples`: Example job containers
- `/docs`: Documentation

## Quick Start

```bash
# Run local development environment
make dev

# Submit a job
opengrid/cli/og submit examples/llm-infer/job.yaml

# Check status
opengrid/cli/og status <jobId>
```

## License

MIT