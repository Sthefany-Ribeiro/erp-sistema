# ERP Sistema — Gestão Empresarial

Sistema de gestão empresarial (ERP) construído do zero, com módulos de Vendas/CRM,
Estoque e Financeiro interligados — uma venda baixa estoque automaticamente e
gera uma conta a receber, do mesmo jeito que um ERP real funciona.

Projeto de portfólio, em desenvolvimento.

## Funcionalidades

- **Clientes** — cadastro, busca, histórico de vendas por cliente
- **Estoque** — catálogo de produtos, movimentações de entrada/saída, alerta de estoque baixo
- **Vendas** — criação transacional (valida estoque → debita → gera conta a receber), cancelamento reversível
- **Financeiro** — contas a receber e a pagar, baixa de pagamento, status automático de atraso
- **Dashboard** — KPIs de receita, saldo projetado, produtos críticos e vendas recentes

## Stack

- **Backend:** Node.js + Express
- **Banco de dados:** SQLite (`node:sqlite`)
- **Autenticação:** JWT + bcrypt
- **Frontend:** HTML/CSS/JS, design feito no Figma

## Como rodar localmente

```bash
npm install
npm run seed   # popula o banco com dados de demonstração
npm start
```

Acesse `http://localhost:3000`. Login de demonstração: `admin@empresa.com` / `admin123`.

## Estrutura do projeto

```
├── db/               # schema e seed do banco
├── middleware/        # autenticação JWT
├── routes/            # endpoints da API por módulo
├── public/            # frontend (html/css/js)
└── server.js
```

## Decisões de arquitetura

- A criação de uma venda roda dentro de uma transação (`BEGIN`/`COMMIT`/`ROLLBACK`):
  valida estoque de todos os itens, debita estoque, registra movimentação e gera
  a conta a receber — tudo ou nada, pra nunca ficar com estado inconsistente.
- Clientes e produtos com vendas vinculadas não podem ser excluídos, apenas
  marcados como inativos — preserva o histórico.
- Contas a receber/pagar têm seu status de atraso recalculado a cada consulta,
  sem depender de job agendado.

## Roadmap

- [ ] Autenticação (login + middleware JWT)
- [ ] Módulo de Clientes (CRUD)
- [ ] Módulo de Produtos/Estoque (CRUD + movimentações)
- [ ] Módulo de Vendas (transação completa)
- [ ] Módulo Financeiro (contas a receber/pagar)
- [ ] Dashboard com KPIs
- [ ] Frontend integrado (Figma → HTML/CSS/JS)
- [ ] Migração para PostgreSQL + Docker Compose

## Licença

MIT
