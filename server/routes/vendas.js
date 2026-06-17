const express = require('express');
const db = require('../db/database');
const { apenasAdmin } = require('../middleware/auth');

const router = express.Router();

function gerarNumeroVenda() {
  const ultima = db.prepare('SELECT numero FROM vendas ORDER BY id DESC LIMIT 1').get();
  const proximo = ultima ? parseInt(ultima.numero.split('-')[1], 10) + 1 : 1;
  return `VD-${String(proximo).padStart(5, '0')}`;
}

router.get('/', (req, res) => {
  const { busca, status, clienteId } = req.query;
  let sql = `
    SELECT v.*, c.nome AS cliente_nome
    FROM vendas v
    JOIN clientes c ON c.id = v.cliente_id
    WHERE 1=1
  `;
  const params = [];

  if (busca) {
    sql += ' AND (v.numero LIKE ? OR c.nome LIKE ?)';
    const termo = `%${busca}%`;
    params.push(termo, termo);
  }
  if (status) {
    sql += ' AND v.status = ?';
    params.push(status);
  }
  if (clienteId) {
    sql += ' AND v.cliente_id = ?';
    params.push(clienteId);
  }
  sql += ' ORDER BY v.data_venda DESC';

  const vendas = db.prepare(sql).all(...params);
  res.json(vendas);
});

router.get('/:id', (req, res) => {
  const venda = db.prepare(`
    SELECT v.*, c.nome AS cliente_nome, c.documento AS cliente_documento
    FROM vendas v JOIN clientes c ON c.id = v.cliente_id
    WHERE v.id = ?
  `).get(req.params.id);

  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada.' });

  const itens = db.prepare(`
    SELECT vi.*, p.nome AS produto_nome, p.sku AS produto_sku
    FROM venda_itens vi JOIN produtos p ON p.id = vi.produto_id
    WHERE vi.venda_id = ?
  `).all(req.params.id);

  const contaReceber = db.prepare('SELECT * FROM contas_receber WHERE venda_id = ?').get(req.params.id);

  res.json({ ...venda, itens, contaReceber });
});

router.post('/', (req, res) => {
  const { cliente_id, forma_pagamento, prazo_dias, itens } = req.body;

  if (!cliente_id) {
    return res.status(400).json({ erro: 'Selecione um cliente.' });
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Adicione ao menos um item à venda.' });
  }

  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(cliente_id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado.' });

  for (const item of itens) {
    const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(item.produto_id);
    if (!produto) return res.status(404).json({ erro: `Produto ${item.produto_id} não encontrado.` });
    if (Number(item.quantidade) <= 0) return res.status(400).json({ erro: `Quantidade inválida para ${produto.nome}.` });
    if (Number(item.quantidade) > produto.estoque_atual) {
      return res.status(409).json({ erro: `Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque_atual} ${produto.unidade}.` });
    }
  }

  db.exec('BEGIN');
  try {
    let total = 0;
    const numero = gerarNumeroVenda();
    const prazo = Number(prazo_dias) || 0;

    const infoVenda = db.prepare(`
      INSERT INTO vendas (numero, cliente_id, status, forma_pagamento, prazo_dias, total)
      VALUES (?, ?, 'confirmada', ?, ?, 0)
    `).run(numero, cliente_id, forma_pagamento || 'boleto', prazo);

    const vendaId = infoVenda.lastInsertRowid;
    const insItem = db.prepare('INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)');
    const updEstoque = db.prepare('UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id = ?');
    const insMov = db.prepare(`INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo, referencia) VALUES (?, 'saida', ?, 'Venda', ?)`);

    for (const item of itens) {
      const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(item.produto_id);
      const qtd = Number(item.quantidade);
      const precoUnit = produto.preco_venda;
      const subtotal = Math.round(qtd * precoUnit * 100) / 100;
      total += subtotal;

      insItem.run(vendaId, item.produto_id, qtd, precoUnit, subtotal);
      updEstoque.run(qtd, item.produto_id);
      insMov.run(item.produto_id, qtd, numero);
    }

    total = Math.round(total * 100) / 100;
    db.prepare('UPDATE vendas SET total = ? WHERE id = ?').run(total, vendaId);

    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + (prazo || 1));
    db.prepare(`
      INSERT INTO contas_receber (venda_id, cliente_id, descricao, valor, data_vencimento, status)
      VALUES (?, ?, ?, ?, ?, 'pendente')
    `).run(vendaId, cliente_id, `Recebimento ref. venda ${numero}`, total, vencimento.toISOString());

    db.exec('COMMIT');

    const vendaCompleta = db.prepare('SELECT * FROM vendas WHERE id = ?').get(vendaId);
    res.status(201).json(vendaCompleta);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ erro: 'Não foi possível concluir a venda. Tente novamente.' });
  }
});

router.put('/:id/cancelar', apenasAdmin, (req, res) => {
  const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id);
  if (!venda) return res.status(404).json({ erro: 'Venda não encontrada.' });
  if (venda.status === 'cancelada') return res.status(409).json({ erro: 'Esta venda já está cancelada.' });

  db.exec('BEGIN');
  try {
    const itens = db.prepare('SELECT * FROM venda_itens WHERE venda_id = ?').all(req.params.id);
    const updEstoque = db.prepare('UPDATE produtos SET estoque_atual = estoque_atual + ? WHERE id = ?');
    const insMov = db.prepare(`INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo, referencia) VALUES (?, 'entrada', ?, 'Cancelamento de venda', ?)`);

    itens.forEach(item => {
      updEstoque.run(item.quantidade, item.produto_id);
      insMov.run(item.produto_id, item.quantidade, venda.numero);
    });

    db.prepare(`UPDATE contas_receber SET status='cancelado' WHERE venda_id = ? AND status != 'pago'`).run(req.params.id);
    db.prepare(`UPDATE vendas SET status='cancelada' WHERE id = ?`).run(req.params.id);

    db.exec('COMMIT');
    res.json(db.prepare('SELECT * FROM vendas WHERE id = ?').get(req.params.id));
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ erro: 'Não foi possível cancelar a venda.' });
  }
});

module.exports = router;