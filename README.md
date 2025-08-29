
# Polyverse Monorepo

A consolidated monorepo containing all Polyverse projects and services.

## 🏗️ Monorepo Structure

```
polyverse/
├── apps/
│   └── polyverse/          # Main Polyverse frontend application
├── services/
│   └── opengrid/           # OpenGrid server/powerhouse
├── packages/
│   ├── truth-archive/      # TruthFoundry archive builder
│   ├── aegisgov/           # AegisGov policy/compliance tools
│   ├── opengrid-client/    # OpenGrid TypeScript client SDK
│   └── truth-archive-js/   # Truth Archive JavaScript client
├── infra/
│   ├── docker/             # Docker configurations
│   └── ci/                 # CI/CD configurations
└── .github/workflows/      # GitHub Actions workflows
```

## 📦 Package Details

### Apps
- **@polyverse/app** - Main Polyverse frontend application

### Services  
- **@polyverse/opengrid** - OpenGrid server backend
- **@polyverse/truth-archive** - TruthFoundry archive service
- **@polyverse/aegisgov** - AegisGov policy engine

### Packages
- **@polyverse/opengrid-client** - TypeScript client for OpenGrid API
- **@polyverse/truth-archive-js** - JavaScript client for Truth Archive

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.10+ (for Python packages)

### Installation
```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development servers
pnpm dev
```

### Development
```bash
# Work on a specific package
cd packages/truth-archive
pip install -r requirements.txt
python -m pytest

# Work on the main app
cd apps/polyverse
pnpm dev
```

## 🔗 Integration Map

| Source Repository | Monorepo Path | Status |
|-------------------|---------------|---------|
| [lxsolutions/polyverse](https://github.com/lxsolutions/polyverse) | `/apps/polyverse` | ✅ Migrated |
| [lxsolutions/opengrid](https://github.com/lxsolutions/opengrid) | `/services/opengrid` | ✅ Imported |
| [lxsolutions/truthfoundry](https://github.com/lxsolutions/truthfoundry) | `/packages/truth-archive` | ✅ Imported |
| [lxsolutions/aegisgov](https://github.com/lxsolutions/aegisgov) | `/packages/aegisgov` | ✅ Imported |

## 📋 CI/CD

The monorepo uses GitHub Actions for CI/CD:

- **Linting**: ESLint, Prettier, and Python linting
- **Testing**: Unit tests for all packages
- **Building**: Turbo build pipeline
- **Deployment**: Docker image builds (when configured)

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

Individual packages may have their own license files preserved from original repositories.

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 🆘 Support

For issues and questions, please open an issue in this repository.

---

**Migration Date**: August 29, 2025  
**Monorepo Version**: 1.0.0
