const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');

const router = express.Router();

const LIMITE_USUARIOS = 10;
const CARGOS_VALIDOS = ['Administrador', 'Operador'];

router.get('/', (req, res) => {
  const usuarios = db.prepare('SELECT id, nome, email, cargo, criado_em FROM usuarios ORDER BY nome ASC').all();
  res.json(usuarios);
});

router.post('/', (req, res) => {
  const { nome, email, senha, cargo } = req.body;

  if (!nome || !nome.trim() || !email || !email.trim() || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }
  if (!CARGOS_VALIDOS.includes(cargo)) {
    return res.status(400).json({ erro: 'Cargo inválido. Use "Administrador" ou "Operador".' });
  }

  const total = db.prepare('SELECT COUNT(*) AS c FROM usuarios').get().c;
  if (total >= LIMITE_USUARIOS) {
    return res.status(409).json({ erro: `Limite de ${LIMITE_USUARIOS} usuários atingido.` });
  }

  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
  if (existente) {
    return res.status(409).json({ erro: 'Já existe um usuário com este email.' });
  }

  const senhaHash = bcrypt.hashSync(senha, 10);
  const info = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES (?, ?, ?, ?)')
    .run(nome.trim(), email.toLowerCase().trim(), senhaHash, cargo);

  const usuario = db.prepare('SELECT id, nome, email, cargo, criado_em FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(usuario);
});

router.put('/:id', (req, res) => {
  const existente = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const { nome, email, cargo } = req.body;

  if (!nome || !nome.trim() || !email || !email.trim()) {
    return res.status(400).json({ erro: 'Nome e email são obrigatórios.' });
  }
  if (!CARGOS_VALIDOS.includes(cargo)) {
    return res.status(400).json({ erro: 'Cargo inválido. Use "Administrador" ou "Operador".' });
  }

  const emUso = db.prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), req.params.id);
  if (emUso) {
    return res.status(409).json({ erro: 'Já existe outro usuário com este email.' });
  }

  db.prepare('UPDATE usuarios SET nome=?, email=?, cargo=? WHERE id=?')
    .run(nome.trim(), email.toLowerCase().trim(), cargo, req.params.id);

  const usuario = db.prepare('SELECT id, nome, email, cargo, criado_em FROM usuarios WHERE id = ?').get(req.params.id);
  res.json(usuario);
});

router.delete('/:id', (req, res) => {
  if (parseInt(req.params.id, 10) === req.usuario.id) {
    return res.status(409).json({ erro: 'Você não pode excluir o seu próprio usuário.' });
  }

  const info = db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  res.status(204).send();
});

module.exports = router;