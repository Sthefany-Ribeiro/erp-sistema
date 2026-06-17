const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'erp.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT 'Administrador',
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  tipo_pessoa TEXT NOT NULL DEFAULT 'PJ',
  documento TEXT,
  email TEXT,
  telefone TEXT,
  cidade TEXT,
  estado TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  categoria TEXT,
  unidade TEXT NOT NULL DEFAULT 'UN',
  preco_venda REAL NOT NULL DEFAULT 0,
  preco_custo REAL NOT NULL DEFAULT 0,
  estoque_atual REAL NOT NULL DEFAULT 0,
  estoque_minimo REAL NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  tipo TEXT NOT NULL,
  quantidade REAL NOT NULL,
  motivo TEXT,
  referencia TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT NOT NULL UNIQUE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  data_venda TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'confirmada',
  forma_pagamento TEXT NOT NULL DEFAULT 'boleto',
  prazo_dias INTEGER NOT NULL DEFAULT 30,
  total REAL NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS venda_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id),
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  quantidade REAL NOT NULL,
  preco_unitario REAL NOT NULL,
  subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER REFERENCES vendas(id),
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  data_vencimento TEXT NOT NULL,
  data_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL,
  categoria TEXT,
  fornecedor TEXT,
  valor REAL NOT NULL,
  data_vencimento TEXT NOT NULL,
  data_pagamento TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;