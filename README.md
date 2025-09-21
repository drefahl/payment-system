# Payment System API

Sistema de pagamento construído com NestJS, TypeORM e PostgreSQL.

## 🚀 Tecnologias

- **Framework**: NestJS 11.x
- **ORM**: TypeORM 0.3.x
- **Banco de Dados**: PostgreSQL (produção) / SQLite (testes)
- **Autenticação**: JWT + Passport
- **Validação**: class-validator + class-transformer
- **Documentação**: Swagger
- **Code Quality**: ESLint + Prettier

## 📁 Estrutura do Projeto

```
src/
├── config/           # Configurações (banco, ambiente)
├── users/           # Módulo de usuários
│   ├── dto/        # Data Transfer Objects
│   ├── entities/   # Entidades TypeORM
│   └── tests/      # Testes unitários
└── auth/           # Módulo de autenticação (em desenvolvimento)
```

## ⚙️ Configuração do Ambiente

O projeto usa configurações de ambiente dinâmicas baseadas no `NODE_ENV`:

### Arquivos de Ambiente

- **`.env.development`**: Configurações para desenvolvimento
- **`.env.test`**: Configurações para testes (SQLite)
- **`.env.production`**: Template para produção
- **`.env.local`**: Overrides pessoais (não commitado)

### Precedência de Carregamento

1. `.env.{NODE_ENV}` (específico do ambiente)
2. `.env.local` (overrides pessoais)
3. `.env` (fallback, se existir)

## 🐳 Setup com Docker

```bash
# Subir PostgreSQL e Redis
docker-compose up -d
```

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# O projeto já vem com arquivos .env configurados
# Para overrides pessoais, crie um .env.local
```

## 🏃‍♂️ Executando o Projeto

```bash
# Desenvolvimento (usa .env.development)
pnpm run start:dev

# Produção (usa .env.production)
pnpm run start:prod

# Debug
pnpm run start:debug
```

## 🧪 Testes

```bash
# Testes unitários (usa .env.test com SQLite)
pnpm run test

# Testes em modo watch
pnpm run test:watch

# Coverage
pnpm run test:cov

# Testes e2e
pnpm run test:e2e
```

## 🎯 Roadmap

- [x] ✅ Configuração base do projeto
- [x] ✅ TypeORM com PostgreSQL
- [x] ✅ Configuração de ambiente dinâmica
- [x] ✅ Módulo de usuários (CRUD)
- [x] ✅ SQLite para testes
- [ ] 🔄 Testes unitários completos
- [ ] 📋 Autenticação JWT
- [ ] 🛡️ AuthGuards
- [ ] 📚 Documentação Swagger
- [ ] 💳 Sistema de pagamentos
- [ ] 🔔 Webhooks

## 🏗️ Arquitetura

### Bancos de Dados

- **Desenvolvimento**: PostgreSQL (docker-compose)
- **Testes**: SQLite (in-memory)
- **Produção**: PostgreSQL (configurar no .env.production)

### Autenticação

- JWT tokens com refresh
- Passport.js para estratégias
- bcrypt para hash de senhas

## 📝 Scripts Úteis

```bash
# Formatação de código
pnpm run format

# Lint
pnpm run lint

# Build
pnpm run build
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

## 📄 License

[MIT licensed](LICENSE).
