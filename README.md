# 🕵️ Infiltré

Jeu d'ambiance en français, sur un seul téléphone qu'on se passe : trouvez qui n'a pas le même mot que vous.

- **563 paires de mots** tirées au hasard (17 thèmes mélangés, jamais affichés aux joueurs)
- Rôles : civils, infiltrés (mot proche) et amnésiques (pas de mot, peuvent gagner seuls en devinant le mot des civils)
- De 3 à 12 joueurs, chacun reçoit son mot en secret, nombre de rôles réglable
- Ajout de vos propres paires de mots
- Pas de répétition des paires tant que tout le stock n'a pas été joué
- Scores cumulés, règles intégrées
- Fonctionne hors ligne et s'installe sur l'écran d'accueil (PWA)

## Lancer

Ouvrez `index.html` dans un navigateur, ou servez le dossier :

```bash
python3 -m http.server 8000
```

## Déployer sur Netlify

Le dépôt contient `netlify.toml` (site statique, aucun build) :

- **Glisser-déposer** : sur app.netlify.com/drop, déposez le dossier du projet.
- **Depuis GitHub** : « Add new site » → « Import from Git » → choisissez ce dépôt. Laissez la commande de build vide ; le dossier publié est `.`.

Sur téléphone, ouvrez l'adresse Netlify puis « Ajouter à l'écran d'accueil ».

## Ajouter des mots

Modifiez `words.js` : chaque thème est une liste de paires `["Mot A", "Mot B"]`.
