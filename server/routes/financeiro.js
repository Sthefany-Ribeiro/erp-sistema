const express = require('express');
const db = require('../db/database');

const router = express.Router();

function atualizarStatusVencidos() {
  const hoje = new Date().toISOString();
  db.prepare(`UPDATE contas_receber SET status='atrasado' WHERE status='pendente' AND data_vencimento < ?`).run(hoje);
  db.prepare(`UPDATE contas_pagar SET status='atrasado' WHERE status='pendente' AND data_vencimento < ?`).run(hoje);
}

router.get('/receber', (req, res) => {
  atualizarStatusVencidos();
  const { status, busca } = req.query;
  let sql = `
    SELECT cr.*, c.nome AS cliente_nome
    FROM contas_receber cr JOIN clientes c ON c.id = cr.cliente_id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND cr.status = ?'; params.push(status); }
  if (busca) { sql += ' AND (c.nome LIKE ? OR cr.descricao LIKE ?)'; params.push(`%${busca}%`, `%${busca}%`); }
  sql += ' ORDER BY cr.data_vencimento ASC';

  res.json(db.prepare(sql).all(...params));
});

router.put('/receber/:id/pagar', (req, res) => {
  const conta = db.prepare('SELECT * FROM contas_receber WHERE id = ?').get(req.params.id);
  if (!conta) return res.status(404).json({ erro: 'Conta não encontrada.' });
  if (conta.status === 'pago') return res.status(409).json({ erro: 'Esta conta já está marcada como paga.' });

  db.prepare(`UPDATE contas_receber SET status='pago', data_pagamento=? WHERE id=?`).run(new Date().toISOString(), req.params.id);
  res.json(db.prepare('SELECT * FROM contas_receber WHERE id = ?').get(req.params.id));
});

router.get('/pagar', (req, res) => {
  atualizarStatusVencidos();
  const { status, busca, categoria } = req.query;
  let sql = 'SELECT * FROM contas_pagar WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
  if (busca) { sql += ' AND (descricao LIKE ? OR fornecedor LIKE ?)'; params.push(`%${busca}%`, `%${busca}%`); }
  sql += ' ORDER BY data_vencimento ASC';

  res.json(db.prepare(sql).all(...params));
});

router.post('/pagar', (req, res) => {
  const { descricao, categoria, fornecedor, valor, data_vencimento } = req.body;
  if (!descricao || !descricao.trim() || !valor || !data_vencimento) {
    return res.status(400).json({ erro: 'Descrição, valor e vencimento são obrigatórios.' });
  }

  const info = db.prepare(`
    INSERT INTO contas_pagar (descricao, categoria, fornecedor, valor, data_vencimento, status)
    VALUES (?, ?, ?, ?, ?, 'pendente')
  `).run(descricao.trim(), categoria || null, fornecedor || null, Number(valor), data_vencimento);

  res.status(201).json(db.prepare('SELECT * FROM contas_pagar WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/pagar/:id/pagar', (req, res) => {
  const conta = db.prepare('SELECT * FROM contas_pagar WHERE id = ?').get(req.params.id);
  if (!conta) return res.status(404).json({ erro: 'Conta não encontrada.' });
  if (conta.status === 'pago') return res.status(409).json({ erro: 'Esta conta já está marcada como paga.' });

  db.prepare(`UPDATE contas_pagar SET status='pago', data_pagamento=? WHERE id=?`).run(new Date().toISOString(), req.params.id);
  res.json(db.prepare('SELECT * FROM contas_pagar WHERE id = ?').get(req.params.id));
});

router.delete('/pagar/:id', (req, res) => {
  const info = db.prepare('DELETE FROM contas_pagar WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'Conta não encontrada.' });
  res.status(204).send();
});

module.exports = router;