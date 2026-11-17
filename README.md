# 🕵️ Infiltré

Jeu d'ambiance en français : trouvez qui n'a pas le même mot que vous. On joue sur **un seul téléphone** qu'on se passe, ou **en ligne**, chacun sur son téléphone.

- **563 paires de mots** tirées au hasard (17 thèmes mélangés, jamais affichés aux joueurs)
- Rôles tirés au hasard : civils, infiltrés (mot proche) et amnésiques (pas de mot, peuvent gagner seuls en devinant le mot des civils). Le nombre d'imposteurs dépend du nombre de joueurs
- Ajout de vos propres paires de mots
- Pas de répétition des paires tant que tout le stock n'a pas été joué
- **Mode en ligne** : un hôte crée une salle (code de 4 lettres ou lien à partager), chacun reçoit son mot sur son téléphone, écrit son indice à son tour, puis tout le monde vote. L'hôte peut passer le tour d'un joueur absent, clore un vote ou relancer une partie
- Scores cumulés, règles intégrées
- Fonctionne hors ligne et s'installe sur l'écran d'accueil (PWA)

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:8888, mode en ligne compris (salles gardées en mémoire)
```

Le mode « un seul téléphone » marche aussi en ouvrant simplement `index.html`.

## Déployer sur Netlify

Le mode en ligne utilise une fonction Netlify (`netlify/functions/room.mjs`) et Netlify Blobs pour stocker les salles. Rien à configurer :

1. Sur Netlify : « Add new site » → « Import an existing project » → choisissez ce dépôt GitHub.
2. Laissez la commande de build vide ; le dossier publié est `.` (déjà dans `netlify.toml`).
3. Déployez. Ouvrez l'adresse sur vos téléphones, puis « Ajouter à l'écran d'accueil ».

⚠️ Le glisser-déposer (Netlify Drop) ne déploie pas les fonctions : seul le mode « un seul téléphone » marcherait. Passez par GitHub ou par `netlify deploy`.

## Ajouter des mots

Modifiez `words.js` : chaque thème est une liste de paires `["Mot A", "Mot B"]`.
