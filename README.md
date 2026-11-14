# 🕵️ Infiltré

Jeu d'ambiance en français, sur un seul téléphone qu'on se passe : trouvez qui n'a pas le même mot que vous.

- **563 paires de mots** réparties dans 17 thèmes (nourriture, animaux, films et séries, métiers, lieux, tech, fantastique, soirée adultes…)
- Rôles : civils, infiltrés (mot proche) et amnésiques (pas de mot, peuvent gagner seuls en devinant le mot des civils)
- De 3 à 20 joueurs, nombre de rôles réglable
- Ajout de vos propres paires de mots
- Pas de répétition des paires tant que tout le stock n'a pas été joué
- Scores cumulés, règles intégrées
- Fonctionne hors ligne et s'installe sur l'écran d'accueil (PWA)

## Lancer

Ouvrez `index.html` dans un navigateur, ou servez le dossier :

```bash
python3 -m http.server 8000
```

Pour jouer sur téléphone, hébergez-le gratuitement (GitHub Pages, Netlify…), puis « Ajouter à l'écran d'accueil ».

## Ajouter des mots

Modifiez `words.js` : chaque thème est une liste de paires `["Mot A", "Mot B"]`.
