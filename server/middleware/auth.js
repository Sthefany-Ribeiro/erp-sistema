const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'erp-portfolio-segredo-dev-2026';

function verificarToken(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Token de acesso não fornecido.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

function apenasAdmin(req, res, next) {
  if (!req.usuario || req.usuario.cargo !== 'Administrador') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
}

module.exports = { verificarToken, apenasAdmin, JWT_SECRET };