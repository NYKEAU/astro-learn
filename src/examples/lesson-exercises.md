# Exemples d'exercices interactifs pour AstroLearn

## Structure de la leçon dans Firebase

```javascript
{
  id: "stellar-evolution",
  moduleId: "stars",
  title: "Évolution stellaire",
  titleEn: "Stellar Evolution",
  steps: [
    {
      type: "text",
      content: "Les étoiles naissent dans des nébuleuses, des nuages de gaz et de poussière. La gravité attire ces matériaux ensemble jusqu'à ce que la pression et la température au centre soient suffisamment élevées pour déclencher la fusion nucléaire.",
      contentEn: "Stars are born in nebulae, clouds of gas and dust. Gravity pulls these materials together until the pressure and temperature in the center are high enough to trigger nuclear fusion."
    },
    {
      type: "exercise", // Utilise le nouveau système d'analyse d'exercices
      content: "Quel est le processus principal qui permet aux étoiles de produire de l'énergie?\n1. Fission nucléaire\n2. Fusion nucléaire\n3. Réaction chimique\n4. Effet photoélectrique",
      contentEn: "What is the main process that allows stars to produce energy?\n1. Nuclear fission\n2. Nuclear fusion\n3. Chemical reaction\n4. Photoelectric effect",
      // La réponse correcte sera indiquée dans le système d'administration
    },
    {
      type: "text",
      content: "Les étoiles passent la majeure partie de leur vie dans la 'séquence principale', où elles fusionnent l'hydrogène en hélium de manière stable. Notre Soleil est actuellement dans cette phase.",
      contentEn: "Stars spend most of their lives in the 'main sequence', where they stably fuse hydrogen into helium. Our Sun is currently in this phase."
    },
    {
      type: "exercise",
      content: "Complétez la phrase suivante: Les étoiles de la séquence principale fusionnent principalement [l'hydrogène] pour former de l'hélium.",
      contentEn: "Complete the following sentence: Main sequence stars primarily fuse [hydrogen] to form helium.",
      // Le mot entre crochets est la réponse correcte
    },
    {
      type: "text",
      content: "Après la séquence principale, l'évolution d'une étoile dépend de sa masse. Les étoiles moins massives deviennent des géantes rouges puis des naines blanches, tandis que les étoiles plus massives peuvent finir en supernova.",
      contentEn: "After the main sequence, a star's evolution depends on its mass. Less massive stars become red giants and then white dwarfs, while more massive stars may end in supernova."
    },
    {
      type: "exercise",
      content: "Les étoiles de faible masse, comme notre Soleil, finiront probablement leur vie en tant que [] après être passées par la phase de géante rouge. <naine blanche> <trou noir> <pulsar>",
      contentEn: "Low-mass stars like our Sun will likely end their lives as [] after going through the red giant phase. <white dwarf> <black hole> <pulsar>",
      // Les crochets vides indiquent l'emplacement du trou, et les mots entre chevrons sont les options
    },
    {
      type: "3dModel",
      "3dModel": "star",
      content: "Voici une représentation d'une étoile de séquence principale comme notre Soleil. Vous pouvez faire pivoter le modèle pour l'examiner sous différents angles.",
      contentEn: "Here is a representation of a main sequence star like our Sun. You can rotate the model to examine it from different angles."
    },
    {
      type: "exercise",
      content: "Parmi les affirmations suivantes concernant l'évolution stellaire, lesquelles sont correctes? Sélectionnez toutes les réponses qui s'appliquent.\n1. Toutes les étoiles finissent leur vie en supernova\n2. Les étoiles massives ont une durée de vie plus courte\n3. Les naines blanches sont composées principalement de carbone et d'oxygène\n4. Les étoiles commencent leur vie en fusionnant l'hélium",
      contentEn: "Which of the following statements about stellar evolution are correct? Select all that apply.\n1. All stars end their lives in supernova\n2. Massive stars have shorter lifespans\n3. White dwarfs are composed mainly of carbon and oxygen\n4. Stars begin their lives by fusing helium",
      // Les réponses 2 et 3 sont correctes
    }
  ]
}
```

## Exemples d'exercices

### QCM (Question à Choix Multiple)

```
Quel est le processus principal qui permet aux étoiles de produire de l'énergie?
1. Fission nucléaire
2. Fusion nucléaire
3. Réaction chimique
4. Effet photoélectrique
```

### Texte à remplir (saisie libre)

```
Complétez la phrase suivante: Les étoiles de la séquence principale fusionnent principalement [l'hydrogène] pour former de l'hélium.
```

### Texte à trous avec propositions

```
Les étoiles de faible masse, comme notre Soleil, finiront probablement leur vie en tant que [] après être passées par la phase de géante rouge. <naine blanche> <trou noir> <pulsar>
```

## Comment cela fonctionne

1. Le système détecte automatiquement le type d'exercice en fonction de la syntaxe utilisée
2. Pour les QCM, il repère les lignes commençant par "1.", "2.", etc.
3. Pour les textes à remplir, il recherche les mots entre crochets [mot_correct]
4. Pour les textes à trous avec propositions, il cherche les crochets vides [] et les options entre chevrons <option>
5. L'interface utilisateur s'adapte automatiquement au type d'exercice détecté
6. Les réponses correctes sont stockées et vérifiées lors de la soumission

## Création d'exercices dans l'interface d'administration

Dans l'interface d'administration, les enseignants peuvent simplement saisir leur texte selon le format souhaité, et le système détectera automatiquement le type d'exercice. Pour chaque type, le système générera les champs appropriés pour indiquer les réponses correctes.

Par exemple, pour un QCM, après avoir saisi le texte, l'interface demandera quelle(s) option(s) est/sont correcte(s). Pour un texte à trous, le système extraira automatiquement les options et demandera simplement de confirmer la réponse correcte.
