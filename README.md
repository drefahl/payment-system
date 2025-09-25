# Sistema de Pagamentos

API REST moderna para processamento de pagamentos construída com NestJS, TypeORM e BullMQ.

## 📋 Funcionalidades

- **Autenticação JWT**: Sistema completo de login com bcrypt
- **Gerenciamento de Usuários**: CRUD completo com validações
- **Catálogo de Produtos**: Gestão de produtos com soft delete
- **Checkout**: Criação e gerenciamento de carrinhos de compra
- **Processamento de Pagamentos**: Sistema assíncrono com filas Redis
- **Múltiplos Métodos**: Cartão de crédito/débito, PIX, transferência bancária
- **Filas Inteligentes**: Priorização, agendamento e retry automático
- **Documentação Swagger**: API totalmente documentada

## 🚀 Tecnologias

- **Framework**: NestJS 11.x
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL com TypeORM
- **Cache/Filas**: Redis com BullMQ
- **Autenticação**: JWT + Passport
- **Validação**: class-validator + class-transformer
- **Documentação**: Swagger/OpenAPI
- **Testes**: Jest com cobertura completa

## 🛠️ Pré-requisitos

- Node.js 18+
- pnpm (gerenciador de pacotes)
- Docker & Docker Compose
- Git

## ⚡ Início Rápido

### 1. Clone o repositório

```bash
git clone <repository-url>
cd payment-system
```

### 2. Instale as dependências

```bash
pnpm install
```

### 3. Configure o ambiente

```bash
# Copie e ajuste as variáveis de ambiente
cp .env.development.example .env.development
cp .env.test.example .env.test
```

### 4. Inicie a infraestrutura

```bash
docker-compose up -d
```

### 5. Execute a aplicação

```bash
# Desenvolvimento (com hot reload)
pnpm start:dev

# Produção
pnpm start:prod
```

A API estará disponível em `http://localhost:3000`

## 📚 Documentação

### Swagger UI

Acesse `http://localhost:3000/api` para ver a documentação interativa da API.

### Principais Endpoints

#### Autenticação

- `POST /auth/login` - Login do usuário
- `POST /auth/register` - Registro de novo usuário

#### Usuários

- `GET /users` - Listar usuários (paginado)
- `GET /users/:id` - Buscar usuário por ID
- `POST /users` - Criar usuário
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Excluir usuário (soft delete)

#### Produtos

- `GET /products` - Listar produtos (paginado)
- `GET /products/:id` - Buscar produto por ID
- `POST /products` - Criar produto
- `PATCH /products/:id` - Atualizar produto
- `DELETE /products/:id` - Excluir produto (soft delete)

#### Checkout

- `GET /checkout` - Listar checkouts
- `GET /checkout/:id` - Buscar checkout por ID
- `POST /checkout` - Criar checkout
- `PATCH /checkout/:id` - Atualizar checkout
- `DELETE /checkout/:id` - Excluir checkout

#### Pagamentos

- `GET /payments` - Listar pagamentos (paginado)
- `GET /payments/:id` - Buscar pagamento por ID
- `POST /payments` - Criar pagamento
- `GET /payments/:id/status` - Status do pagamento
- `POST /payments/:id/cancel` - Cancelar pagamento

#### Filas de Pagamento

- `POST /payments/priority` - Pagamento com prioridade
- `POST /payments/delayed` - Pagamento agendado
- `POST /payments/:id/retry` - Tentar novamente
- `GET /payments/queue/status` - Status das filas
- `POST /payments/queue/pause` - Pausar fila
- `POST /payments/queue/resume` - Retomar fila
- `DELETE /payments/queue/clean` - Limpar filas

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Testes com watch mode
pnpm test:watch

# Cobertura de testes
pnpm test:cov

# Testes end-to-end
pnpm test:e2e
```

## 🔧 Configuração

### Variáveis de Ambiente

#### Desenvolvimento (.env.development)

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=payment_system

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

#### Teste (.env.test)

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=payment_system_test

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h
```

## 🏗️ Arquitetura

### Estrutura do Projeto

```
src/
├── auth/           # Autenticação e autorização
├── users/          # Gerenciamento de usuários
├── products/       # Catálogo de produtos
├── checkout/       # Carrinhos de compra
├── payments/       # Processamento de pagamentos
├── common/         # Utilitários compartilhados
└── config/         # Configurações da aplicação
```

### Módulos Principais

#### Auth Module

- Estratégias JWT e Local
- Guards de proteção
- DTOs de autenticação

#### Users Module

- Entidade User com timestamps
- CRUD completo com validações
- Hash de senhas com bcrypt

#### Products Module

- Entidade Product com soft delete
- Controle de estoque
- Validações de preço

#### Checkout Module

- Carrinho com múltiplos itens
- Relacionamento com produtos
- Cálculos de total

#### Payments Module

- Processamento assíncrono com BullMQ
- Múltiplos métodos de pagamento
- Sistema de retry automático
- Notificações de status

## 🔄 Sistema de Filas

### Processadores BullMQ

- **payment-processing**: Processa pagamentos
- **payment-notifications**: Envia notificações

### Funcionalidades Avançadas

- **Priorização**: Jobs com diferentes prioridades
- **Agendamento**: Execução com delay
- **Retry**: Tentativas automáticas com backoff
- **Monitoramento**: Status em tempo real
- **Controle**: Pausar/retomar filas

## 📊 Banco de Dados

### Entidades Principais

- **User**: Usuários do sistema
- **Product**: Catálogo de produtos
- **Checkout**: Carrinhos de compra
- **CheckoutItem**: Itens do carrinho
- **Payment**: Registros de pagamento

### Relacionamentos

- User 1:N Checkout
- Checkout 1:N CheckoutItem
- Product 1:N CheckoutItem
- Checkout 1:1 Payment

## 🛡️ Segurança

- **Autenticação JWT**: Tokens seguros com expiração
- **Hash de Senhas**: bcrypt com salt rounds
- **Validação de Entrada**: class-validator em todos os DTOs
- **Guards**: Proteção de rotas sensíveis
- **CORS**: Configuração adequada para produção

## 📝 Desenvolvimento

### Comandos Úteis

```bash
# Formatar código
pnpm format

# Lint
pnpm lint

# Build
pnpm build

# Debug
pnpm start:debug
```

### Padrões de Código

- ESLint + Prettier configurados
- TypeScript strict mode
- Documentação Swagger obrigatória
- Testes para todas as funcionalidades

## 🚀 Deploy

### Preparação para Produção

1. Configure variáveis de ambiente de produção
2. Execute `pnpm build`
3. Configure banco PostgreSQL
4. Configure Redis para filas
5. Execute `pnpm start:prod`

### Docker

```bash
# Build da imagem
docker build -t payment-system .

# Executar container
docker run -p 3000:3000 payment-system
```

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação Swagger
2. Verifique os logs da aplicação
3. Execute os testes para validar
4. Abra uma issue no repositório

---

**Desenvolvido com ❤️ usando NestJS**
