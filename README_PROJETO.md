# 💳 Sistema de Pagamentos (Simulação) com NestJS

## 🎯 Objetivo
Criar uma API backend em NestJS que simula um **sistema de pagamentos**, incluindo:
- Cadastro de usuários
- Criação de transações (checkout)
- Processamento de pagamentos (simulado)
- Webhooks/eventos para alterar status dos pagamentos
- Integração com filas (Bull + Redis)
- Notificações assíncronas (e-mail fictício, logs, etc.)

---

## 🛠️ Tecnologias Utilizadas
- **NestJS** (framework principal)
- **TypeORM** (ORM + Postgres)
- **JWT** (autenticação)
- **Bull + Redis** (fila para processamento assíncrono)
- **Swagger** (documentação)
- **Class-validator / class-transformer** (validação DTOs)
- **ConfigModule** (configurações baseadas em env)

---

## 🚀 Instalação

```bash
# Instalar dependências
$ pnpm install

# Configurar variáveis de ambiente
$ cp .env.example .env
# Edite o arquivo .env com suas configurações

# Executar banco de dados (Docker)
$ docker-compose up -d postgres redis

# Executar migrações
$ pnpm run migration:run
```

## 🏃‍♂️ Executando o projeto

```bash
# Desenvolvimento
$ pnpm run start

# Modo watch
$ pnpm run start:dev

# Produção
$ pnpm run start:prod
```

## 🧪 Testes

```bash
# Unit tests
$ pnpm run test

# E2E tests
$ pnpm run test:e2e

# Cobertura
$ pnpm run test:cov
```

---

## 🗒️ Roadmap de Implementação

### ✅ 1. **Configuração do Projeto**
- [x] Criar o projeto com `nest new payment-system`
- [ ] Configurar o **TypeORM** com Postgres
- [ ] Criar `.env` para configs sensíveis (DB, JWT_SECRET, REDIS_URL)

---

### 2. **Módulo de Usuários + Autenticação**
- [ ] Entidade `User` com: `id`, `name`, `email`, `password(hash)`
- [ ] CRUD básico de usuários
- [ ] Módulo `Auth` com:
  - [ ] Login e geração de JWT
  - [ ] `AuthGuard` para proteger rotas
- [ ] Documentação no Swagger

---

### 3. **Módulo de Pagamentos**
- [ ] Entidade `Payment` com:
  - `id`, `userId`, `amount`, `status (pending/processing/success/failed)`, `createdAt`
- [ ] DTO para criação de pagamento:
  ```ts
  { userId: string, amount: number }
  ```
- [ ] Controller para **criar checkout** (`POST /payments`)
- [ ] Service que dispara job para processar na fila

---

### 4. **Processamento Assíncrono (Bull + Redis)**
- [ ] Configurar o **BullModule** (conectar ao Redis)
- [ ] Criar fila `payment-queue`
- [ ] Processor que:
  - Simula delay de 2–5s
  - Define status: `success` ou `failed` (aleatório)
  - Atualiza registro no banco
  - Emite evento para `notifications`

---

### 5. **Eventos e Notificações**
- [ ] Criar `NotificationsModule`
- [ ] Usar EventEmitter do Nest:
  - Ao atualizar status de pagamento → disparar evento
- [ ] Listener que:
  - Se sucesso → "Envia e-mail de confirmação"
  - Se falha → "Envia e-mail de falha"
  - (pode ser logado no console, sem serviço externo real)

---

### 6. **Histórico de Transações**
- [ ] Criar entidade `Transaction` vinculada ao usuário
- [ ] Cada `Payment` gera uma `Transaction` (status final)
- [ ] Endpoint para listar transações por usuário (`GET /transactions/me`)

---

### 7. **Extras (Avançado)**
- [ ] Criar endpoint de **webhook** (`/webhooks/payment`) que emula callback de gateway externo → atualiza status do pagamento
- [ ] Implementar Retry no processor para falhas na fila
- [ ] Implementar Middleware de logging para cada request
- [ ] Criar Interceptor para padronizar respostas

---

## 📖 Referências
- [NestJS Docs](https://docs.nestjs.com/)
- [Bull - NestJS Queues](https://docs.nestjs.com/techniques/queues)
- [TypeORM Docs](https://typeorm.io/)
- [Class-validator](https://github.com/typestack/class-validator)

---

## 🚀 Desafios Extra para Fixar
- Adicionar suporte a múltiplos métodos de pagamento (cartão/boleto/pix fictício)
- Implementar pagination nos históricos
- Deploy em Docker com Redis + Postgres
- Gerar relatórios de pagamentos por usuário

---

## 📄 Licença

Este projeto está sob a licença MIT.