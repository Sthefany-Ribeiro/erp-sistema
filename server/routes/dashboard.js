const express = require('express');
const db = require('../db/database');

const router = express.Router();

function inicioMes(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get('/resumo', (req, res) => {
  const agora = new Date();
  const inicioMesAtual = inicioMes(0).toISOString();
  const inicioMesAnterior = inicioMes(1).toISOString();

  const receitaMesAtual = db.prepare(`
    SELECT COALESCE(SUM(total), 0) AS soma FROM vendas
    WHERE status = 'confirmada' AND data_venda >= ?
  `).get(inicioMesAtual).soma;

  const receitaMesAnterior = db.prepare(`
    SELECT COALESCE(SUM(total), 0) AS soma FROM vendas
    WHERE status = 'confirmada' AND data_venda >= ? AND data_venda < ?
  `).get(inicioMesAnterior, inicioMesAtual).soma;

  const variacaoReceita = receitaMesAnterior > 0
    ? Math.round(((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 1000) / 10
    : null;

  db.prepare(`UPDATE contas_receber SET status='atrasado' WHERE status='pendente' AND data_vencimento < ?`).run(agora.toISOString());
  db.prepare(`UPDATE contas_pagar SET status='atrasado' WHERE status='pendente' AND data_vencimento < ?`).run(agora.toISOString());

  const receberPendente = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) AS soma, COUNT(*) AS qtd FROM contas_receber WHERE status IN ('pendente', 'atrasado')
  `).get();

  const receberAtrasado = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) AS soma, COUNT(*) AS qtd FROM contas_receber WHERE status = 'atrasado'
  `).get();

  const pagarPendente = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) AS soma, COUNT(*) AS qtd FROM contas_pagar WHERE status IN ('pendente', 'atrasado')
  `).get();

  const pagarAtrasado = db.prepare(`
    SELECT COALESCE(SUM(valor), 0) AS soma, COUNT(*) AS qtd FROM contas_pagar WHERE status = 'atrasado'
  `).get();

  const totalClientesAtivos = db.prepare(`SELECT COUNT(*) AS qtd FROM clientes WHERE status = 'ativo'`).get().qtd;

  const produtosBaixoEstoque = db.prepare(`
    SELECT id, nome, sku, estoque_atual, estoque_minimo, unidade FROM produtos
    WHERE estoque_atual <= estoque_minimo ORDER BY (estoque_atual - estoque_minimo) ASC LIMIT 8
  `).all();

  const vendasRecentes = db.prepare(`
    SELECT v.id, v.numero, v.data_venda, v.status, v.total, c.nome AS cliente_nome
    FROM vendas v JOIN clientes c ON c.id = v.cliente_id
    ORDER BY v.data_venda DESC LIMIT 6
  `).all();

  const vendasPorMes = [];
  for (let i = 5; i >= 0; i--) {
    const ini = inicioMes(i);
    const fim = inicioMes(i - 1);
    const soma = db.prepare(`
      SELECT COALESCE(SUM(total), 0) AS soma FROM vendas
      WHERE status = 'confirmada' AND data_venda >= ? AND data_venda < ?
    `).get(ini.toISOString(), fim.toISOString()).soma;
    vendasPorMes.push({
      mes: ini.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      total: Math.round(soma * 100) / 100
    });
  }

  const topProdutos = db.prepare(`
    SELECT p.nome, SUM(vi.quantidade) AS qtd_vendida, SUM(vi.subtotal) AS receita
    FROM venda_itens vi
    JOIN produtos p ON p.id = vi.produto_id
    JOIN vendas v ON v.id = vi.venda_id
    WHERE v.status = 'confirmada'
    GROUP BY p.id ORDER BY receita DESC LIMIT 5
  `).all();

  res.json({
    receitaMesAtual: Math.round(receitaMesAtual * 100) / 100,
    variacaoReceita,
    receberPendente,
    receberAtrasado,
    pagarPendente,
    pagarAtrasado,
    saldoProjetado: Math.round((receberPendente.soma - pagarPendente.soma) * 100) / 100,
    totalClientesAtivos,
    produtosBaixoEstoque,
    vendasRecentes,
    vendasPorMes,
    topProdutos
  });
});

module.exports = router;