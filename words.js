// Paires de mots : [mot A, mot B]. Au lancement, l'un des deux est tiré au hasard pour les civils.
const CATEGORIES = {
  "🍔 Nourriture": [
    ["Pizza","Tarte flambée"],["Burger","Sandwich"],["Frites","Chips"],["Croissant","Pain au chocolat"],
    ["Crêpe","Gaufre"],["Sushi","Maki"],["Pâtes","Riz"],["Fromage","Yaourt"],["Beurre","Margarine"],
    ["Ketchup","Mayonnaise"],["Moutarde","Wasabi"],["Chocolat","Caramel"],["Glace","Sorbet"],
    ["Soupe","Velouté"],["Omelette","Œuf au plat"],["Kebab","Tacos"],["Couscous","Tajine"],
    ["Raclette","Fondue"],["Lasagnes","Gratin"],["Hot-dog","Saucisse"],["Bonbon","Chewing-gum"],
    ["Macaron","Meringue"],["Éclair","Religieuse"],["Muffin","Cupcake"],["Brownie","Cookie"],
    ["Popcorn","Barbe à papa"],["Quiche","Tarte salée"],["Salade","Taboulé"],["Steak","Côtelette"],
    ["Poulet","Dinde"],["Jambon","Bacon"],["Saumon","Thon"],["Crevette","Homard"],["Huître","Moule"],
    ["Baguette","Brioche"],["Miel","Confiture"],["Nutella","Pâte à tartiner"],["Céréales","Muesli"],
    ["Ratatouille","Piperade"],["Paella","Risotto"],["Nems","Rouleaux de printemps"],["Ramen","Pho"],
    ["Burrito","Fajitas"],["Donut","Beignet"],["Tiramisu","Panna cotta"],["Mousse au chocolat","Fondant au chocolat"],
    ["Cassoulet","Choucroute"],["Bœuf bourguignon","Pot-au-feu"],["Camembert","Brie"],["Croque-monsieur","Panini"]
  ],
  "🍎 Fruits & légumes": [
    ["Pomme","Poire"],["Orange","Mandarine"],["Citron","Pamplemousse"],["Fraise","Framboise"],
    ["Cerise","Griotte"],["Banane","Plantain"],["Pêche","Abricot"],["Melon","Pastèque"],
    ["Ananas","Mangue"],["Kiwi","Fruit de la passion"],["Raisin","Groseille"],["Myrtille","Mûre"],
    ["Prune","Mirabelle"],["Noix de coco","Datte"],["Tomate","Poivron"],["Carotte","Navet"],
    ["Courgette","Concombre"],["Aubergine","Courge"],["Pomme de terre","Patate douce"],["Oignon","Échalote"],
    ["Ail","Gingembre"],["Brocoli","Chou-fleur"],["Épinard","Salade"],["Haricot vert","Petit pois"],
    ["Champignon","Truffe"],["Maïs","Blé"],["Radis","Betterave"],["Poireau","Céleri"],
    ["Avocat","Olive"],["Citrouille","Potiron"],["Noisette","Amande"],["Cacahuète","Pistache"],
    ["Lentille","Pois chiche"],["Figue","Grenade"],["Litchi","Papaye"],["Artichaut","Asperge"]
  ],
  "🥤 Boissons": [
    ["Café","Thé"],["Coca","Pepsi"],["Bière","Cidre"],["Vin rouge","Vin rosé"],["Champagne","Prosecco"],
    ["Jus d'orange","Jus de pomme"],["Lait","Lait d'amande"],["Eau gazeuse","Limonade"],["Whisky","Rhum"],
    ["Vodka","Gin"],["Mojito","Piña colada"],["Smoothie","Milkshake"],["Chocolat chaud","Cappuccino"],
    ["Expresso","Latte"],["Ice tea","Diabolo"],["Sirop","Jus de fruit"],["Red Bull","Café serré"],
    ["Tisane","Infusion"],["Pastis","Anisette"],["Sangria","Punch"],["Kombucha","Kéfir"],["Bubble tea","Thé au lait"]
  ],
  "🐶 Animaux": [
    ["Chien","Loup"],["Chat","Lion"],["Tigre","Léopard"],["Cheval","Âne"],["Vache","Taureau"],
    ["Mouton","Chèvre"],["Cochon","Sanglier"],["Lapin","Lièvre"],["Souris","Rat"],["Hamster","Cochon d'Inde"],
    ["Éléphant","Rhinocéros"],["Girafe","Zèbre"],["Singe","Gorille"],["Ours","Panda"],["Renard","Chacal"],
    ["Aigle","Faucon"],["Hibou","Chouette"],["Pigeon","Corbeau"],["Perroquet","Toucan"],["Poule","Canard"],
    ["Dauphin","Requin"],["Baleine","Orque"],["Poisson rouge","Carpe"],["Pieuvre","Calamar"],["Crabe","Langouste"],
    ["Tortue","Escargot"],["Serpent","Lézard"],["Crocodile","Alligator"],["Grenouille","Crapaud"],["Abeille","Guêpe"],
    ["Papillon","Libellule"],["Fourmi","Termite"],["Araignée","Scorpion"],["Moustique","Mouche"],["Kangourou","Koala"],
    ["Pingouin","Manchot"],["Flamant rose","Cygne"],["Chameau","Dromadaire"],["Hérisson","Porc-épic"],["Chauve-souris","Hirondelle"],
    ["Écureuil","Castor"],["Cerf","Élan"],["Phoque","Morse"],["Paon","Faisan"],["Méduse","Étoile de mer"]
  ],
  "🏠 Maison & objets": [
    ["Canapé","Fauteuil"],["Lit","Hamac"],["Table","Bureau"],["Chaise","Tabouret"],["Lampe","Bougie"],
    ["Frigo","Congélateur"],["Four","Micro-ondes"],["Grille-pain","Gaufrier"],["Aspirateur","Balai"],["Douche","Baignoire"],
    ["Brosse à dents","Fil dentaire"],["Shampoing","Gel douche"],["Savon","Dentifrice"],["Serviette","Peignoir"],["Oreiller","Coussin"],
    ["Couverture","Couette"],["Rideau","Store"],["Tapis","Moquette"],["Miroir","Fenêtre"],["Porte","Portail"],
    ["Clé","Cadenas"],["Fourchette","Cuillère"],["Couteau","Ciseaux"],["Assiette","Bol"],["Verre","Tasse"],
    ["Casserole","Poêle"],["Parapluie","Imperméable"],["Horloge","Montre"],["Réveil","Minuteur"],["Valise","Sac à dos"],
    ["Stylo","Crayon"],["Gomme","Correcteur"],["Cahier","Carnet"],["Livre","Magazine"],["Journal","Prospectus"],
    ["Marteau","Tournevis"],["Clou","Vis"],["Échelle","Escabeau"],["Ventilateur","Climatiseur"],["Radiateur","Cheminée"],
    ["Lave-linge","Lave-vaisselle"],["Poubelle","Bac de recyclage"],["Sèche-cheveux","Fer à lisser"],["Bouteille","Gourde"],["Plante verte","Cactus"]
  ],
  "👕 Vêtements & mode": [
    ["Jean","Pantalon"],["T-shirt","Chemise"],["Pull","Sweat"],["Veste","Manteau"],["Robe","Jupe"],
    ["Short","Bermuda"],["Basket","Chaussure de ville"],["Botte","Bottine"],["Tong","Sandale"],["Chaussette","Collant"],
    ["Casquette","Bonnet"],["Chapeau","Béret"],["Écharpe","Foulard"],["Gant","Moufle"],["Cravate","Nœud papillon"],
    ["Ceinture","Bretelles"],["Lunettes","Lunettes de soleil"],["Bague","Bracelet"],["Collier","Pendentif"],["Boucle d'oreille","Piercing"],
    ["Pyjama","Peignoir"],["Maillot de bain","Bikini"],["Costume","Smoking"],["Parfum","Déodorant"],["Rouge à lèvres","Gloss"],
    ["Mascara","Eye-liner"],["Sac à main","Pochette"],["Portefeuille","Porte-monnaie"],["Doudoune","Parka"],["Talons","Escarpins"]
  ],
  "⚽ Sports & loisirs": [
    ["Football","Rugby"],["Basket","Handball"],["Tennis","Badminton"],["Ping-pong","Squash"],["Volley","Beach-volley"],
    ["Natation","Plongée"],["Ski","Snowboard"],["Surf","Bodyboard"],["Vélo","Trottinette"],["Skate","Roller"],
    ["Boxe","Karaté"],["Judo","Lutte"],["Golf","Mini-golf"],["Bowling","Pétanque"],["Course à pied","Marche"],
    ["Yoga","Pilates"],["Musculation","CrossFit"],["Escalade","Randonnée"],["Équitation","Polo"],["Formule 1","Rallye"],
    ["Billard","Fléchettes"],["Échecs","Dames"],["Poker","Belote"],["Pêche","Chasse"],["Danse","Zumba"],
    ["Parachute","Parapente"],["Kayak","Aviron"],["Patinage","Hockey sur glace"],["Baseball","Cricket"],["Escrime","Tir à l'arc"],
    ["Camping","Glamping"],["Jardinage","Bricolage"],["Puzzle","Lego"],["Karaoké","Blind test"],["Escape game","Laser game"]
  ],
  "🎬 Films & séries": [
    ["Harry Potter","Le Seigneur des anneaux"],["Star Wars","Star Trek"],["Titanic","Avatar"],["Batman","Superman"],["Spider-Man","Iron Man"],
    ["Le Roi Lion","Le Livre de la jungle"],["La Reine des neiges","Raiponce"],["Shrek","L'Âge de glace"],["Toy Story","Cars"],["Le Monde de Nemo","Le Monde de Dory"],
    ["Friends","How I Met Your Mother"],["Game of Thrones","The Witcher"],["Breaking Bad","Narcos"],["La Casa de Papel","Lupin"],["Stranger Things","Dark"],
    ["Les Simpson","Family Guy"],["Bob l'éponge","Les Razmoket"],["Dragon Ball","Naruto"],["One Piece","Pokémon"],["Jurassic Park","King Kong"],
    ["Rocky","Creed"],["Matrix","Inception"],["Astérix","Tintin"],["Les Bronzés","Les Visiteurs"],["Bienvenue chez les Ch'tis","Intouchables"],
    ["James Bond","Mission impossible"],["Fast and Furious","Taxi"],["Pirates des Caraïbes","Indiana Jones"],["Squid Game","Alice in Borderland"],["Wednesday","La Famille Addams"],
    ["Retour vers le futur","Terminator"],["Le Parrain","Scarface"],["Kaamelott","Game of Thrones"],["Minions","Moi, moche et méchant"],["Ratatouille","Le Petit Chef"]
  ],
  "🎵 Musique": [
    ["Guitare","Basse"],["Piano","Synthétiseur"],["Violon","Violoncelle"],["Batterie","Tambour"],["Flûte","Clarinette"],
    ["Trompette","Saxophone"],["Harpe","Lyre"],["Accordéon","Harmonica"],["Rap","Slam"],["Rock","Metal"],
    ["Pop","Variété"],["Jazz","Blues"],["Reggae","Ska"],["Techno","House"],["Opéra","Comédie musicale"],
    ["Concert","Festival"],["DJ","Chef d'orchestre"],["Chorale","Groupe"],["Vinyle","CD"],["Casque","Écouteurs"],
    ["Micro","Haut-parleur"],["Spotify","Deezer"],["Clip","Live"],["Ukulélé","Banjo"],["Rumba","Salsa"]
  ],
  "👩‍⚕️ Métiers": [
    ["Médecin","Infirmier"],["Dentiste","Orthodontiste"],["Pompier","Secouriste"],["Policier","Gendarme"],["Avocat","Juge"],
    ["Professeur","Instituteur"],["Boulanger","Pâtissier"],["Cuisinier","Serveur"],["Boucher","Charcutier"],["Coiffeur","Barbier"],
    ["Pilote","Hôtesse de l'air"],["Chauffeur de taxi","Chauffeur de bus"],["Plombier","Électricien"],["Maçon","Charpentier"],["Architecte","Ingénieur"],
    ["Journaliste","Présentateur"],["Acteur","Humoriste"],["Chanteur","Musicien"],["Photographe","Vidéaste"],["Peintre","Sculpteur"],
    ["Vétérinaire","Éleveur"],["Agriculteur","Jardinier"],["Facteur","Livreur"],["Banquier","Comptable"],["Pharmacien","Biologiste"],
    ["Astronaute","Astronome"],["Soldat","Garde du corps"],["Développeur","Informaticien"],["Youtubeur","Influenceur"],["Caissier","Vendeur"],
    ["Mécanicien","Carrossier"],["Psychologue","Coach"],["Détective","Espion"],["Magicien","Clown"],["Footballeur","Arbitre"]
  ],
  "🌍 Lieux & voyages": [
    ["Plage","Piscine"],["Montagne","Colline"],["Forêt","Jungle"],["Désert","Savane"],["Île","Presqu'île"],
    ["Lac","Étang"],["Rivière","Fleuve"],["Mer","Océan"],["Paris","Londres"],["New York","Los Angeles"],
    ["Rome","Venise"],["Tokyo","Séoul"],["Espagne","Portugal"],["Italie","Grèce"],["Brésil","Argentine"],
    ["Canada","États-Unis"],["Maroc","Tunisie"],["Égypte","Dubaï"],["Hôtel","Auberge"],["Camping","Gîte"],
    ["Avion","Hélicoptère"],["Train","Métro"],["Bus","Tramway"],["Voiture","Moto"],["Bateau","Sous-marin"],
    ["Aéroport","Gare"],["Musée","Galerie"],["Cinéma","Théâtre"],["Restaurant","Fast-food"],["Bar","Boîte de nuit"],
    ["Hôpital","Clinique"],["École","Université"],["Supermarché","Marché"],["Banque","Poste"],["Église","Cathédrale"],
    ["Château","Palais"],["Zoo","Aquarium"],["Parc d'attractions","Fête foraine"],["Bibliothèque","Librairie"],["Stade","Gymnase"],
    ["Tour Eiffel","Arc de triomphe"],["Pyramide","Sphinx"],["Volcan","Geyser"],["Cascade","Fontaine"],["Prison","Commissariat"]
  ],
  "💻 Tech & marques": [
    ["iPhone","Samsung"],["Instagram","TikTok"],["Facebook","Twitter"],["WhatsApp","Messenger"],["Snapchat","BeReal"],
    ["YouTube","Twitch"],["Netflix","Disney+"],["Google","Wikipédia"],["Amazon","AliExpress"],["PlayStation","Xbox"],
    ["Nintendo Switch","Game Boy"],["Ordinateur","Tablette"],["Clavier","Souris"],["Wi-Fi","Bluetooth"],["Clé USB","Disque dur"],
    ["Imprimante","Scanner"],["Télévision","Projecteur"],["Montre connectée","Bracelet connecté"],["Drone","Robot"],["Selfie","Photo de groupe"],
    ["Emoji","Sticker"],["Mail","SMS"],["Mot de passe","Code PIN"],["Nike","Adidas"],["McDonald's","Burger King"],
    ["Coca-Cola","Orangina"],["Lego","Playmobil"],["Ikea","Conforama"],["Tesla","Toyota"],["Uber","Taxi"],
    ["Minecraft","Roblox"],["Fortnite","Call of Duty"],["Mario","Sonic"],["Tetris","Pac-Man"],["ChatGPT","Siri"]
  ],
  "🧙 Fantastique & personnages": [
    ["Vampire","Loup-garou"],["Sorcière","Magicien"],["Fée","Elfe"],["Dragon","Licorne"],["Fantôme","Zombie"],
    ["Pirate","Viking"],["Chevalier","Samouraï"],["Ninja","Espion"],["Roi","Empereur"],["Princesse","Reine"],
    ["Père Noël","Lutin"],["Lapin de Pâques","Petite souris"],["Robot","Cyborg"],["Extraterrestre","Martien"],["Sirène","Triton"],
    ["Géant","Ogre"],["Nain","Hobbit"],["Momie","Squelette"],["Ange","Démon"],["Super-héros","Justicier"],
    ["Cowboy","Shérif"],["Indien","Trappeur"],["Gladiateur","Centurion"],["Mousquetaire","Garde royal"],["Clown","Mime"],
    ["Dracula","Frankenstein"],["Cendrillon","Blanche-Neige"],["Pinocchio","Peter Pan"],["Aladdin","Le génie"],["Hercule","Zeus"]
  ],
  "🎉 Fêtes & événements": [
    ["Noël","Nouvel An"],["Anniversaire","Fête des pères"],["Mariage","Fiançailles"],["Halloween","Carnaval"],["Pâques","Ramadan"],
    ["Saint-Valentin","Premier rendez-vous"],["Baptême","Communion"],["Enterrement de vie de garçon","Crémaillère"],["Barbecue","Pique-nique"],["Soirée pyjama","Soirée jeux"],
    ["Feu d'artifice","Pétard"],["Gâteau","Bûche"],["Cadeau","Surprise"],["Ballon","Confettis"],["Déguisement","Masque"],
    ["Sapin","Guirlande"],["Vacances","Week-end"],["Remise de diplôme","Bac"],["Fête de la musique","14 Juillet"],["Coupe du monde","Jeux olympiques"]
  ],
  "❤️ Corps & émotions": [
    ["Main","Pied"],["Doigt","Orteil"],["Œil","Oreille"],["Nez","Bouche"],["Bras","Jambe"],
    ["Cheveux","Barbe"],["Dent","Langue"],["Cœur","Poumon"],["Genou","Coude"],["Épaule","Hanche"],
    ["Joie","Bonheur"],["Tristesse","Mélancolie"],["Colère","Rage"],["Peur","Angoisse"],["Amour","Amitié"],
    ["Jalousie","Envie"],["Fatigue","Ennui"],["Rire","Sourire"],["Pleurer","Bouder"],["Rêve","Cauchemar"],
    ["Rhume","Grippe"],["Fièvre","Toux"],["Bisou","Câlin"],["Timidité","Gêne"],["Courage","Audace"]
  ],
  "🌦️ Nature & météo": [
    ["Soleil","Lune"],["Étoile","Planète"],["Pluie","Neige"],["Orage","Tempête"],["Nuage","Brouillard"],
    ["Arc-en-ciel","Aurore boréale"],["Vent","Tornade"],["Été","Printemps"],["Hiver","Automne"],["Feu","Lave"],
    ["Glace","Givre"],["Sable","Galet"],["Rose","Tulipe"],["Marguerite","Tournesol"],["Arbre","Buisson"],
    ["Sapin","Palmier"],["Chêne","Bouleau"],["Feuille","Pétale"],["Grotte","Tunnel"],["Météorite","Comète"],
    ["Séisme","Tsunami"],["Lever de soleil","Coucher de soleil"],["Caillou","Rocher"],["Herbe","Mousse"],["Éclair","Tonnerre"]
  ],
  "🔥 Spécial soirée (adultes)": [
    ["Gueule de bois","Fatigue"],["Ex","Crush"],["Tinder","Speed dating"],["Coloc","Voisin"],["Apéro","Brunch"],
    ["Sieste","Grasse matinée"],["Lundi","Dimanche soir"],["Patron","Collègue"],["Belle-mère","Tante"],["Ronfler","Parler en dormant"],
    ["Vu à 3h du matin","Message vocal"],["Drague","Flirt"],["Râteau","Ghosting"],["Mensonge","Excuse"],["Retard","Oubli"],
    ["Régime","Salle de sport"],["Shopping","Soldes"],["Ragots","Rumeurs"],["Selfie miroir","Story Instagram"],["Bouchon","Embouteillage"],
    ["Karaoké raté","Danse ratée"],["Fond de teint","Autobronzant"],["Pyjama","Jogging"],["Facture","Impôts"],["Réveil","Alarme incendie"]
  ]
};
