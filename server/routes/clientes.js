const express = require('express');
const db = require('../db/database');
const { apenasAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { busca, status } = req.query;
  let sql = 'SELECT * FROM clientes WHERE 1=1';
  const params = [];

  if (busca) {
    sql += ' AND (nome LIKE ? OR documento LIKE ? OR email LIKE ?)';
    const termo = `%${busca}%`;
    params.push(termo, termo, termo);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  sql += ' ORDER BY nome ASC';

  const clientes = db.prepare(sql).all(...params);
  res.json(clientes);
});

router.get('/:id', (req, res) => {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado.' });

  const historicoVendas = db.prepare(
    'SELECT id, numero, data_venda, status, total FROM vendas WHERE cliente_id = ? ORDER BY data_venda DESC'
  ).all(req.params.id);

  res.json({ ...cliente, historicoVendas });
});

router.post('/', (req, res) => {
  const { nome, tipo_pessoa, documento, email, telefone, cidade, estado } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'O nome do cliente é obrigatório.' });
  }

  const info = db.prepare(`
    INSERT INTO clientes (nome, tipo_pessoa, documento, email, telefone, cidade, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(nome.trim(), tipo_pessoa || 'PJ', documento || null, email || null, telefone || null, cidade || null, estado || null);

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(cliente);
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Cliente não encontrado.' });

  const { nome, tipo_pessoa, documento, email, telefone, cidade, estado, status } = req.body;

  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: 'O nome do cliente é obrigatório.' });
  }

  db.prepare(`
    UPDATE clientes SET nome=?, tipo_pessoa=?, documento=?, email=?, telefone=?, cidade=?, estado=?, status=?
    WHERE id=?
  `).run(nome.trim(), tipo_pessoa, documento || null, email || null, telefone || null, cidade || null, estado || null, status || 'ativo', req.params.id);

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  res.json(cliente);
});

router.delete('/:id', apenasAdmin, (req, res) => {
  const emUso = db.prepare('SELECT COUNT(*) c FROM vendas WHERE cliente_id = ?').get(req.params.id);
  if (emUso.c > 0) {
    return res.status(409).json({ erro: 'Este cliente possui vendas vinculadas e não pode ser excluído. Marque como inativo.' });
  }
  const info = db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'Cliente não encontrado.' });
  res.status(204).send();
});

module.exports = router;