import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

/**
 * PAGE DE DÉMONSTRATION du live — outil de TEST uniquement (pas le produit).
 *
 * Usage en salle : lancer l'API, ouvrir http://<ip-du-pc>:3000/live-demo sur
 * les téléphones du même réseau Wi-Fi. Chacun se connecte avec son compte,
 * rejoint le débat en cours et vote — les compteurs bougent sur tous les
 * écrans en temps réel. Le staff (modérateur/point focal/admin) dispose en
 * plus d'un panneau pour soumettre/fermer les affirmations et voir les
 * signalements arriver en direct.
 *
 * L'application mobile réelle consommera exactement les mêmes API + WebSocket.
 */
@ApiExcludeController()
@Controller('live-demo')
export class LiveDemoController {
  @Get()
  @Header('content-type', 'text/html; charset=utf-8')
  page(): string {
    return PAGE_HTML;
  }
}

const PAGE_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AlgoDémo — Live (démo)</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #f4f5f7; color: #1c2733; }
  .ecran { max-width: 480px; margin: 0 auto; padding: 16px; }
  h1 { font-size: 1.2rem; } h2 { font-size: 1rem; margin: 16px 0 8px; }
  .carte { background: #fff; border-radius: 10px; padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
  input, button, textarea { font-size: 1rem; border-radius: 8px; border: 1px solid #cfd6dd; padding: 10px; width: 100%; box-sizing: border-box; }
  button { background: #14532d; color: #fff; border: 0; cursor: pointer; margin-top: 8px; }
  button.sec { background: #64748b; } button.rouge { background: #b91c1c; }
  .ligne { display: flex; gap: 8px; } .ligne > * { flex: 1; }
  .jauge { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: #e5e7eb; margin-top: 6px; }
  .jauge .v { background: #16a34a; } .jauge .i { background: #dc2626; }
  .muet { color: #6b7280; font-size: .85rem; }
  .badge { display: inline-block; background: #14532d; color: #fff; border-radius: 999px; padding: 2px 10px; font-size: .8rem; }
  #signalements div { border-left: 3px solid #b91c1c; padding: 6px 8px; margin-top: 6px; background: #fef2f2; font-size: .9rem; }
  .cache { display: none; }
</style>
</head>
<body>
<div class="ecran">
  <h1>🗳️ AlgoDémo — Débat en direct <span class="muet">(page de test)</span></h1>

  <div id="ecranLogin" class="carte">
    <h2>Connexion</h2>
    <input id="email" type="email" placeholder="Email" autocomplete="username">
    <input id="mdp" type="password" placeholder="Mot de passe" autocomplete="current-password" style="margin-top:8px">
    <button onclick="seConnecter()">Se connecter</button>
    <p id="loginMsg" class="muet"></p>
  </div>

  <div id="ecranDebats" class="carte cache">
    <h2>Débats en cours</h2>
    <div id="listeDebats" class="muet">Chargement…</div>
  </div>

  <div id="ecranLive" class="cache">
    <div class="carte">
      <h2 id="titreDebat"></h2>
      <span class="badge" id="nbParticipants">0 participant</span>
      <span class="badge" id="monRole" style="background:#334155"></span>
      <p id="etatDebat" class="muet"></p>
    </div>

    <div class="carte">
      <h2>Affirmations au vote</h2>
      <div id="affirmations" class="muet">En attente d'une affirmation du modérateur…</div>
    </div>

    <div class="carte">
      <h2>🚩 Signaler une fausse information</h2>
      <textarea id="msgSignal" rows="2" placeholder="Qu'avez-vous entendu de faux ?"></textarea>
      <button class="rouge" onclick="signaler()">Signaler au modérateur</button>
    </div>

    <div id="panneauStaff" class="carte cache">
      <h2>🎙️ Panneau modérateur</h2>
      <textarea id="texteAffirmation" rows="2" placeholder="Nouvelle affirmation à soumettre au vote"></textarea>
      <button onclick="soumettreAffirmation()">Soumettre au vote de la salle</button>
      <h2>Signalements reçus</h2>
      <div id="signalements" class="muet">Aucun pour l'instant.</div>
    </div>
  </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
var token = null, socket = null, debatId = null, staff = false;
var etatAffirmations = {}; // id -> {texte, statut, valides, invalides}

function el(id) { return document.getElementById(id); }

async function seConnecter() {
  el('loginMsg').textContent = 'Connexion…';
  try {
    var r = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: el('email').value.trim(), motDePasse: el('mdp').value }) });
    var d = await r.json();
    if (!r.ok || !d.accessToken) { el('loginMsg').textContent = 'Échec : ' + (d.message || r.status); return; }
    token = d.accessToken;
    el('ecranLogin').classList.add('cache');
    el('ecranDebats').classList.remove('cache');
    chargerDebats();
  } catch (e) { el('loginMsg').textContent = 'Erreur réseau : ' + e.message; }
}

async function chargerDebats() {
  var r = await fetch('/debats?filtre=en-cours');
  var debats = await r.json();
  if (!debats.length) { el('listeDebats').innerHTML = 'Aucun débat en cours. <button class="sec" onclick="chargerDebats()">Actualiser</button>'; return; }
  el('listeDebats').innerHTML = debats.map(function (d) {
    return '<button onclick="rejoindre(\\'' + d.id + '\\')">▶ ' + d.titre + '</button>';
  }).join('');
}

function rejoindre(id) {
  debatId = id;
  socket = io('/debats', { auth: { token: token } });
  socket.on('connect', function () {
    socket.emit('rejoindre', { debatId: debatId }, function (rep) {
      if (!rep.ok) { alert(rep.message); return; }
      el('ecranDebats').classList.add('cache');
      el('ecranLive').classList.remove('cache');
      el('titreDebat').textContent = rep.debat.titre;
      el('monRole').textContent = rep.roleParticipation;
      staff = rep.roleParticipation !== 'SPECTATEUR';
      if (staff) el('panneauStaff').classList.remove('cache');
      rep.affirmations.forEach(function (a) { etatAffirmations[a.id] = a; });
      rendreAffirmations();
    });
  });
  socket.on('participants.maj', function (p) { el('nbParticipants').textContent = p.nombre + ' participant(s)'; });
  socket.on('affirmation.nouvelle', function (a) {
    etatAffirmations[a.id] = { id: a.id, texte: a.texte, statut: 'OUVERTE', valides: 0, invalides: 0 };
    rendreAffirmations();
  });
  socket.on('vote.maj', function (d) { majDecompte(d, 'OUVERTE'); });
  socket.on('affirmation.fermee', function (d) { majDecompte(d, 'FERMEE'); });
  socket.on('signalement.nouveau', function (s) {
    if (el('signalements').textContent.indexOf('Aucun') === 0) el('signalements').innerHTML = '';
    el('signalements').innerHTML += '<div><b>' + s.de + '</b> : ' + s.message + '</div>';
  });
  socket.on('debat.cloture', function () { el('etatDebat').textContent = '🔴 Le débat est terminé. Merci de votre participation !'; });
}

function majDecompte(d, statut) {
  var a = etatAffirmations[d.affirmationId];
  if (!a) return;
  a.valides = d.valides; a.invalides = d.invalides; a.statut = statut;
  rendreAffirmations();
}

function rendreAffirmations() {
  var ids = Object.keys(etatAffirmations);
  if (!ids.length) return;
  el('affirmations').innerHTML = ids.map(function (id) {
    var a = etatAffirmations[id];
    var total = a.valides + a.invalides, pv = total ? Math.round(100 * a.valides / total) : 50;
    var html = '<div style="margin-bottom:14px"><b>' + a.texte + '</b>';
    html += '<div class="jauge"><div class="v" style="width:' + pv + '%"></div><div class="i" style="width:' + (100 - pv) + '%"></div></div>';
    html += '<div class="muet">✅ ' + a.valides + ' valident · ❌ ' + a.invalides + ' invalident' + (a.statut === 'FERMEE' ? ' — vote fermé' : '') + '</div>';
    if (a.statut === 'OUVERTE') {
      html += '<div class="ligne"><button onclick="voter(\\'' + id + '\\',true)">✅ Valider</button>';
      html += '<button class="rouge" onclick="voter(\\'' + id + '\\',false)">❌ Invalider</button></div>';
      if (staff) html += '<button class="sec" onclick="fermer(\\'' + id + '\\')">Fermer le vote</button>';
    }
    return html + '</div>';
  }).join('');
}

function voter(affirmationId, valide) {
  socket.emit('voter', { affirmationId: affirmationId, valide: valide }, function (rep) {
    if (!rep.ok) alert(rep.message);
  });
}

function signaler() {
  var message = el('msgSignal').value.trim();
  if (!message) return;
  socket.emit('signaler', { debatId: debatId, message: message }, function (rep) {
    if (rep.ok) { el('msgSignal').value = ''; alert('Signalement transmis au modérateur ✔'); }
    else alert(rep.message);
  });
}

async function soumettreAffirmation() {
  var texte = el('texteAffirmation').value.trim();
  if (!texte) return;
  var r = await fetch('/debats/' + debatId + '/affirmations', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ texte: texte }) });
  if (r.ok) el('texteAffirmation').value = '';
  else alert('Refusé (rôle POINT_FOCAL/ADMIN requis)');
}

async function fermer(affirmationId) {
  await fetch('/debats/affirmations/' + affirmationId + '/fermer', { method: 'PATCH',
    headers: { Authorization: 'Bearer ' + token } });
}
</script>
</body>
</html>`;
