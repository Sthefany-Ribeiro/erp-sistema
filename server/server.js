const express = require('express');
const cors = require('cors');
const path = require('node:path');

const { verificarToken, apenasAdmin } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const produtosRoutes = require('./routes/produtos');
const vendasRoutes = require('./routes/vendas');
const financeiroRoutes = require('./routes/financeiro');
const dashboardRoutes = require('./routes/dashboard');
const usuariosRoutes = require('./routes/usuarios');

require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', verificarToken, clientesRoutes);
app.use('/api/produtos', verificarToken, produtosRoutes);
app.use('/api/vendas', verificarToken, vendasRoutes);
app.use('/api/financeiro', verificarToken, apenasAdmin, financeiroRoutes);
app.use('/api/dashboard', verificarToken, dashboardRoutes);
app.use('/api/usuarios', verificarToken, apenasAdmin, usuariosRoutes);

// Em produção, depois de rodar `npm run build` dentro de client/, descomente
// as duas linhas abaixo para o Express servir o front já buildado:
// app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
// app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html')));

app.listen(PORT, () => {
  console.log(`\n  Servidor rodando em http://localhost:${PORT}\n`);
});