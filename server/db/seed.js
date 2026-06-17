const bcrypt = require('bcryptjs');
const db = require('./database');

function alreadySeeded() {
  const row = db.prepare('SELECT COUNT(*) as c FROM usuarios').get();
  return row.c > 0;
}

function run() {
  if (alreadySeeded()) {
    console.log('Banco já contém dados. Seed ignorado (apague db/erp.db para repopular).');
    return;
  }

  console.log('Populando banco de dados com dados de demonstração...');

  const senhaHash = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES (?, ?, ?, ?)`)
    .run('Administrador', 'admin@empresa.com', senhaHash, 'Administrador');

  const clientes = [
    ['Comercial Estrela Azul Ltda', 'PJ', '12.345.678/0001-90', 'contato@estrelaazul.com.br', '(11) 4002-8922', 'São Paulo', 'SP'],
    ['Distribuidora Nova Era ME', 'PJ', '23.456.789/0001-11', 'financeiro@novaera.com.br', '(11) 3555-1290', 'Campinas', 'SP'],
    ['Mercado Bom Preço', 'PJ', '34.567.890/0001-22', 'compras@bompreco.com.br', '(19) 3211-4040', 'Sorocaba', 'SP'],
    ['Construtora Horizonte S.A.', 'PJ', '45.678.901/0001-33', 'suprimentos@horizonte.com.br', '(11) 5050-6060', 'São Paulo', 'SP'],
    ['Ana Carolina Ferreira', 'PF', '123.456.789-00', 'ana.ferreira@gmail.com', '(11) 98877-6655', 'Guarulhos', 'SP'],
    ['Papelaria Criativa Ltda', 'PJ', '56.789.012/0001-44', 'pedidos@criativa.com.br', '(11) 2233-4455', 'Osasco', 'SP'],
    ['Rodrigo Almeida Souza', 'PF', '234.567.890-11', 'rodrigo.souza@outlook.com', '(11) 97766-5544', 'São Paulo', 'SP'],
    ['Tech Supply Importadora', 'PJ', '67.890.123/0001-55', 'comercial@techsupply.com.br', '(11) 4111-2233', 'Barueri', 'SP'],
  ];
  const insCliente = db.prepare(`INSERT INTO clientes (nome, tipo_pessoa, documento, email, telefone, cidade, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const clienteIds = clientes.map(c => insCliente.run(...c).lastInsertRowid);

  const produtos = [
    ['Papel A4 75g (pacote 500fl)', 'PAP-A4-500', 'Papelaria', 'PCT', 24.90, 14.50, 320, 50],
    ['Caneta Esferográfica Azul', 'CAN-AZ-01', 'Papelaria', 'UN', 1.80, 0.70, 1200, 200],
    ['Notebook 15" i5 8GB SSD256', 'NTB-I5-256', 'Eletrônicos', 'UN', 3299.00, 2450.00, 18, 5],
    ['Monitor LED 24" Full HD', 'MON-24-FHD', 'Eletrônicos', 'UN', 749.00, 520.00, 34, 10],
    ['Cadeira de Escritório Ergonômica', 'CAD-ERG-01', 'Mobiliário', 'UN', 589.00, 380.00, 22, 8],
    ['Mesa de Escritório 120x60cm', 'MESA-120', 'Mobiliário', 'UN', 420.00, 290.00, 15, 5],
    ['Toner HP CF217A Preto', 'TON-CF217A', 'Suprimentos', 'UN', 189.90, 110.00, 47, 15],
    ['Pendrive 64GB USB 3.0', 'PEN-64GB', 'Eletrônicos', 'UN', 39.90, 22.00, 8, 20],
    ['Mouse Óptico USB', 'MOU-USB-01', 'Eletrônicos', 'UN', 29.90, 14.00, 95, 30],
    ['Teclado ABNT2 USB', 'TEC-ABNT2', 'Eletrônicos', 'UN', 59.90, 32.00, 60, 20],
    ['Caixa de Som Bluetooth', 'CXS-BT-01', 'Eletrônicos', 'UN', 149.90, 90.00, 3, 10],
    ['Pasta Suspensa Kraft', 'PAS-KRA-01', 'Papelaria', 'UN', 2.40, 1.10, 400, 100],
  ];
  const insProduto = db.prepare(`INSERT INTO produtos (nome, sku, categoria, unidade, preco_venda, preco_custo, estoque_atual, estoque_minimo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  const produtoIds = produtos.map(p => insProduto.run(...p).lastInsertRowid);

  const insMov = db.prepare(`INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo, referencia, criado_em) VALUES (?, ?, ?, ?, ?, ?)`);
  produtoIds.forEach((pid, idx) => {
    insMov.run(pid, 'entrada', produtos[idx][6], 'Estoque inicial', 'AJUSTE-INICIAL', daysAgo(60));
  });

  const insVenda = db.prepare(`INSERT INTO vendas (numero, cliente_id, data_venda, status, forma_pagamento, prazo_dias, total) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insItem = db.prepare(`INSERT INTO venda_itens (venda_id, produto_id, quantidade, preco_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`);
  const insReceber = db.prepare(`INSERT INTO contas_receber (venda_id, cliente_id, descricao, valor, data_vencimento, data_pagamento, status, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  const formasPagamento = ['boleto', 'pix', 'cartao', 'boleto'];
  let vendaCounter = 1;

  for (let mesAtras = 5; mesAtras >= 0; mesAtras--) {
    const vendasNoMes = 2 + Math.floor(Math.random() * 3);
    for (let v = 0; v < vendasNoMes; v++) {
      const clienteId = clienteIds[Math.floor(Math.random() * clienteIds.length)];
      const numItens = 1 + Math.floor(Math.random() * 3);
      const itensVenda = [];
      let total = 0;
      for (let i = 0; i < numItens; i++) {
        const pIdx = Math.floor(Math.random() * produtos.length);
        const qtd = 1 + Math.floor(Math.random() * 8);
        const preco = produtos[pIdx][4];
        const subtotal = qtd * preco;
        itensVenda.push({ produtoId: produtoIds[pIdx], qtd, preco, subtotal });
        total += subtotal;
      }
      const dataVenda = daysAgo(mesAtras * 30 + Math.floor(Math.random() * 25));
      const numero = `VD-${String(vendaCounter).padStart(5, '0')}`;
      vendaCounter++;
      const forma = formasPagamento[Math.floor(Math.random() * formasPagamento.length)];
      const prazo = forma === 'pix' || forma === 'cartao' ? 0 : 30;
      const vendaId = insVenda.run(numero, clienteId, dataVenda, 'confirmada', forma, prazo, round2(total)).lastInsertRowid;

      itensVenda.forEach(it => {
        insItem.run(vendaId, it.produtoId, it.qtd, it.preco, round2(it.subtotal));
      });

      const vencimento = addDaysToDate(dataVenda, prazo || 1);
      const isPast = new Date(vencimento) < new Date();
      const pago = isPast && Math.random() > 0.25;
      insReceber.run(
        vendaId, clienteId, `Recebimento ref. venda ${numero}`, round2(total),
        vencimento, pago ? vencimento : null, pago ? 'pago' : (isPast ? 'atrasado' : 'pendente'),
        dataVenda
      );
    }
  }

  const contasPagarSeed = [
    ['Aluguel do galpão - matriz', 'Instalações', 'Imobiliária Centro SP', 6800.00, -3],
    ['Energia elétrica', 'Utilidades', 'Enel Distribuição', 1240.50, -1],
    ['Internet e telefonia', 'Utilidades', 'Vivo Empresas', 389.90, 5],
    ['Folha de pagamento - equipe', 'Pessoal', 'Interno', 38500.00, 2],
    ['Fornecedor - papel e suprimentos', 'Compras', 'Distribuidora Papel Brasil', 5200.00, 10],
    ['Fornecedor - equipamentos eletrônicos', 'Compras', 'Tech Import Distribuidora', 18900.00, 15],
    ['Contabilidade mensal', 'Serviços', 'Contábil Souza & Associados', 950.00, 8],
    ['Manutenção de frota', 'Operacional', 'Auto Center Silva', 1380.00, -10],
    ['Software de gestão (licença)', 'Tecnologia', 'CloudSoft Sistemas', 690.00, 20],
    ['Material de limpeza', 'Operacional', 'Distribuidora Higiene Total', 410.00, -5],
  ];
  const insPagar = db.prepare(`INSERT INTO contas_pagar (descricao, categoria, fornecedor, valor, data_vencimento, data_pagamento, status, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  contasPagarSeed.forEach(([descricao, categoria, fornecedor, valor, diasOffset]) => {
    const vencimento = addDaysToDate(new Date().toISOString(), diasOffset);
    const isPast = new Date(vencimento) < new Date();
    const pago = isPast && Math.random() > 0.3;
    insPagar.run(descricao, categoria, fornecedor, valor, vencimento, pago ? vencimento : null, pago ? 'pago' : (isPast ? 'atrasado' : 'pendente'), daysAgo(30));
  });

  console.log('Seed concluído.');
  console.log('Login de demonstração -> email: admin@empresa.com | senha: admin123');
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function addDaysToDate(isoDate, n) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

run();