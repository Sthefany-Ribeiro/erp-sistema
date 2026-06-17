const express = require('express');
const db = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const { busca, categoria, baixoEstoque } = req.query;
  let sql = 'SELECT * FROM produtos WHERE 1=1';
  const params = [];

  if (busca) {
    sql += ' AND (nome LIKE ? OR sku LIKE ?)';
    const termo = `%${busca}%`;
    params.push(termo, termo);
  }
  if (categoria) {
    sql += ' AND categoria = ?';
    params.push(categoria);
  }
  if (baixoEstoque === 'true') {
    sql += ' AND estoque_atual <= estoque_minimo';
  }
  sql += ' ORDER BY nome ASC';

  const produtos = db.prepare(sql).all(...params);
  res.json(produtos);
});

router.get('/categorias/lista', (req, res) => {
  const categorias = db.prepare('SELECT DISTINCT categoria FROM produtos WHERE categoria IS NOT NULL ORDER BY categoria').all();
  res.json(categorias.map(c => c.categoria));
});

router.get('/:id', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const movimentacoes = db.prepare(
    'SELECT * FROM movimentacoes_estoque WHERE produto_id = ? ORDER BY criado_em DESC LIMIT 50'
  ).all(req.params.id);

  res.json({ ...produto, movimentacoes });
});

router.post('/', (req, res) => {
  const { nome, sku, categoria, unidade, preco_venda, preco_custo, estoque_atual, estoque_minimo } = req.body;

  if (!nome || !nome.trim() || !sku || !sku.trim()) {
    return res.status(400).json({ erro: 'Nome e SKU são obrigatórios.' });
  }

  const skuExistente = db.prepare('SELECT id FROM produtos WHERE sku = ?').get(sku.trim());
  if (skuExistente) {
    return res.status(409).json({ erro: 'Já existe um produto com este SKU.' });
  }

  const info = db.prepare(`
    INSERT INTO produtos (nome, sku, categoria, unidade, preco_venda, preco_custo, estoque_atual, estoque_minimo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nome.trim(), sku.trim(), categoria || null, unidade || 'UN',
    Number(preco_venda) || 0, Number(preco_custo) || 0,
    Number(estoque_atual) || 0, Number(estoque_minimo) || 0
  );

  if (Number(estoque_atual) > 0) {
    db.prepare(`INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo, referencia) VALUES (?, 'entrada', ?, 'Cadastro inicial', 'CADASTRO')`)
      .run(info.lastInsertRowid, Number(estoque_atual));
  }

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(produto);
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const { nome, sku, categoria, unidade, preco_venda, preco_custo, estoque_minimo } = req.body;

  if (!nome || !nome.trim() || !sku || !sku.trim()) {
    return res.status(400).json({ erro: 'Nome e SKU são obrigatórios.' });
  }

  const skuEmUso = db.prepare('SELECT id FROM produtos WHERE sku = ? AND id != ?').get(sku.trim(), req.params.id);
  if (skuEmUso) {
    return res.status(409).json({ erro: 'Já existe outro produto com este SKU.' });
  }

  db.prepare(`
    UPDATE produtos SET nome=?, sku=?, categoria=?, unidade=?, preco_venda=?, preco_custo=?, estoque_minimo=?
    WHERE id=?
  `).run(nome.trim(), sku.trim(), categoria || null, unidade || 'UN', Number(preco_venda) || 0, Number(preco_custo) || 0, Number(estoque_minimo) || 0, req.params.id);

  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  res.json(produto);
});

router.post('/:id/movimentacao', (req, res) => {
  const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const { tipo, quantidade, motivo } = req.body;
  const qtd = Number(quantidade);

  if (!['entrada', 'saida'].includes(tipo) || !qtd || qtd <= 0) {
    return res.status(400).json({ erro: 'Informe um tipo válido (entrada/saida) e uma quantidade maior que zero.' });
  }

  if (tipo === 'saida' && qtd > produto.estoque_atual) {
    return res.status(409).json({ erro: `Estoque insuficiente. Disponível: ${produto.estoque_atual} ${produto.unidade}.` });
  }

  const novoEstoque = tipo === 'entrada' ? produto.estoque_atual + qtd : produto.estoque_atual - qtd;

  db.prepare('UPDATE produtos SET estoque_atual = ? WHERE id = ?').run(novoEstoque, req.params.id);
  db.prepare(`INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo, referencia) VALUES (?, ?, ?, ?, 'MANUAL')`)
    .run(req.params.id, tipo, qtd, motivo || (tipo === 'entrada' ? 'Entrada manual' : 'Saída manual'));

  const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  res.json(atualizado);
});

router.delete('/:id', (req, res) => {
  const emUso = db.prepare('SELECT COUNT(*) c FROM venda_itens WHERE produto_id = ?').get(req.params.id);
  if (emUso.c > 0) {
    return res.status(409).json({ erro: 'Este produto possui vendas vinculadas e não pode ser excluído.' });
  }
  db.prepare('DELETE FROM movimentacoes_estoque WHERE produto_id = ?').run(req.params.id);
  const info = db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.status(204).send();
});

module.exports = router;