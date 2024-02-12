import Cookie from "./cookie.js";
import { create2DArray } from "./utils.js";

/* Classe principale du jeu, c'est une grille de cookies. Le jeu se joue comme
Candy Crush Saga etc... c'est un match-3 game... */
export default class Grille {
  /**
   * Constructeur de la grille
   * @param {number} l nombre de lignes
   * @param {number} c nombre de colonnes
   */
  constructor(l, c) {
    this.c = c;
    this.l = l;
    this.tabSelectionnees = [];
    this.score = 0;

    this.tabcookies = this.remplirTableauDeCookies(6);
  }

  /**
   * parcours la liste des divs de la grille et affiche les images des cookies
   * correspondant à chaque case. Au passage, à chaque image on va ajouter des
   * écouteurs de click et de drag'n'drop pour pouvoir interagir avec elles
   * et implémenter la logique du jeu.
   */
  showCookies() {
    let caseDivs = document.querySelectorAll("#grille div");

    caseDivs.forEach((div, index) => {
      // on calcule la ligne et la colonne de la case
      // index est le numéro de la case dans la grille
      // on sait que chaque ligne contient this.c colonnes
      // er this.l lignes
      // on peut en déduire la ligne et la colonne
      // par exemple si on a 9 cases par ligne et qu'on 
      // est à l'index 4
      // on est sur la ligne 0 (car 4/9 = 0) et 
      // la colonne 4 (car 4%9 = 4)
      let ligne = Math.floor(index / this.l);
      let colonne = index % this.c; 

      console.log("On remplit le div index=" + index + " l=" + ligne + " col=" + colonne);

      // on récupère le cookie correspondant à cette case
      let cookie = this.tabcookies[ligne][colonne];
      // on récupère l'image correspondante
      let img = cookie.htmlImage;

      img.onclick = (event) => {
        console.log("On a cliqué sur la ligne " + ligne + " et la colonne " + colonne);

        console.log("Le cookie cliqué est de type " + cookie.type);
        // highlight + changer classe CSS

        if (img.classList.contains("cookies")) {
            cookie.selectionnee();
            this.tabSelectionnees.push(cookie);
        }
        else if (img.classList.contains("cookies-selected")) {
            cookie.deselectionnee();
            this.tabSelectionnees.pop();
        }

        // A FAIRE : tester combien de cookies sont sélectionnées
        // si 0 on ajoute le cookie cliqué au tableau
        // si 1 on ajoute le cookie cliqué au tableau
        // et on essaie de swapper

        console.log(this.tabSelectionnees.length);

        if (this.tabSelectionnees.length === 2) {
          let c1 = this.tabSelectionnees[0];
          let c2 = this.tabSelectionnees[1];
          if (Cookie.distance(c1, c2) === 1) {
            this.swapCookies(c1, c2);
          }
          else {
            c1.deselectionnee();
            c2.deselectionnee();
          }
          this.tabSelectionnees = [];
        }
      }

      // A FAIRE : ecouteur de drag'n'drop
      img.addEventListener("dragstart", (event) => {
        img.classList.add("cookies-selected");
        event.dataTransfer.setData("cookie", JSON.stringify(img.dataset));
      });

      img.addEventListener("dragover", (event) => {
        // on empêche le comportement par défaut qui est de ne pas accepter
        // les drop
        if (!img.classList.contains("cookies-selected")) {
          event.preventDefault();
        }
      });

      img.addEventListener("dragenter", (event) => {
        if (!img.classList.contains("cookies-selected")) {
          img.classList.add("grilleDragOver");
        }
      });

      img.addEventListener("dragleave", (event) => {
        img.classList.remove("grilleDragOver");
      });

      img.addEventListener("drop", (event) => {
        event.preventDefault();
        img.classList.remove("grilleDragOver");

        let pos = JSON.parse(event.dataTransfer.getData("cookie"));
        let ligneDrop = pos.ligne;
        let colonneDrop = pos.colonne;

        let c1 = this.getCookieFromLC(ligne, colonne);
        let c2 = this.getCookieFromLC(ligneDrop, colonneDrop);

        if (Cookie.distance(c1, c2) === 1) this.swapCookies(c1, c2);
      });

      // on affiche l'image dans le div pour la faire apparaitre à l'écran.
      div.appendChild(img);
    });
  }


  // inutile ?
  getCookieFromLC(ligne, colonne) {
    return this.tabcookies[ligne][colonne];
  }

  swapCookies(c1, c2) {
    Cookie.swapCookies(c1, c2);
    this.testAlignement();
  }

  
  /**
   * Initialisation du niveau de départ. Le paramètre est le nombre de cookies différents
   * dans la grille. 4 types (4 couleurs) = facile de trouver des possibilités de faire
   * des groupes de 3. 5 = niveau moyen, 6 = niveau difficile
   *
   * Améliorations : 1) s'assurer que dans la grille générée il n'y a pas déjà de groupes
   * de trois. 2) S'assurer qu'il y a au moins 1 possibilité de faire un groupe de 3 sinon
   * on a perdu d'entrée. 3) réfléchir à des stratégies pour générer des niveaux plus ou moins
   * difficiles.
   *
   * On verra plus tard pour les améliorations...
   */
  remplirTableauDeCookies(nbDeCookiesDifferents) {
    // créer un tableau vide de 9 cases pour une ligne
    // en JavaScript on ne sait pas créer de matrices
    // d'un coup. Pas de new tab[3][4] par exemple.
    // Il faut créer un tableau vide et ensuite remplir
    // chaque case avec un autre tableau vide
    // Faites ctrl-click sur la fonction create2DArray
    // pour voir comment elle fonctionne
    let tab = create2DArray(9);

    // remplir
    for(let l = 0; l < this.l; l++) {
      for(let c =0; c < this.c; c++) {

        // on génère un nombre aléatoire entre 0 et nbDeCookiesDifferents-1
        const type = Math.floor(Math.random()*nbDeCookiesDifferents);
        //console.log(type)
        tab[l][c] = new Cookie(type, l, c);
      }
    }
    return tab;
  }

  testAlignement() {
    let alignees = this.testAlignementLignes().concat(this.testAlignementColonnes());
    if (alignees.length > 0) {
      let vides = this.supprimerCases(alignees);
      console.log("CASES VIDES");
      console.log(vides);
      this.remplirCasesVides(vides);
      this.incrementerScore(alignees);
    }
  }


  testAlignementLignes() {
    let alignees = [];
    for (let i = 0; i < this.tabcookies.length; i++) {
      let aligneesLigne = this.testAlignementLigne(i);
      alignees.push(...aligneesLigne);
    }
    return alignees;
  }

  testAlignementLigne(nbLigne) {
    let ligne = this.tabcookies[nbLigne];
    let type = ligne[0].type;
    let alignees = [];
    let compteur = [];

    for (let i = 0; i < this.l; i++) {
        if (ligne[i].type === type) compteur.push(ligne[i]);
        else {
          if (compteur.length >= 3) alignees.push(compteur);
          type = ligne[i].type;
          compteur = [ligne[i]];
        }
    }
    if (compteur.length >= 3) alignees.push(compteur);
    return alignees;
  }


  testAlignementColonnes() {
    let alignees = [];
    for (let i = 0; i < this.tabcookies[0].length; i++) {
      let aligneesColonne = this.testAlignementColonne(i);
      alignees.push(...aligneesColonne);
    }
    return alignees;
  }

  testAlignementColonne(nbColonne) {
    // Refait la meme chose mais sans utiliser de variable colonne
    let type = this.tabcookies[0][nbColonne].type;
    let alignees = [];
    let compteur = [];

    for (let i = 0; i < this.c; i++) {
        if (this.tabcookies[i][nbColonne].type === type) compteur.push(this.tabcookies[i][nbColonne]);
        else {
          if (compteur.length >= 3) alignees.push(compteur);

          type = this.tabcookies[i][nbColonne].type;
          compteur = [this.tabcookies[i][nbColonne]];
        }
    }
    if (compteur.length >= 3) alignees.push(compteur);
    return alignees;
  }


  supprimerCases(alignees) {
    let vides = [];
    alignees.forEach((alignee) => {
      alignee.forEach((cookie) => {
        if (cookie.htmlImage !== null && cookie.htmlImage.parentNode !== null) {
          cookie.htmlImage.parentNode.removeChild(cookie.htmlImage);
          cookie.htmlImage = null;
        }


        let ligne = cookie.ligne;
        let colonne = cookie.colonne;
        if (!vides.includes({l : ligne, c : colonne})) vides.push({l: ligne, c: colonne});
      });
    });
    return vides;
  }

  remplirCasesVides(vides) {
    while (vides.length > 0) {
      vides.forEach((vide) => {
        //debugger;
        console.log("TRAITEMENT VIDE " + vide.l + " " + vide.c);
        let div = document.querySelector("#grille div:nth-child(" + (vide.c + (vide.l * this.l) + 1) + ")");
        if (vide.l === 0) {
          let type = Math.floor(Math.random()*6);
          this.tabcookies[vide.l][vide.c] = new Cookie(type, vide.l, vide.c);

          div.appendChild(this.tabcookies[vide.l][vide.c].htmlImage);
          vides.splice(vides.indexOf(vide), 1);
          return;
        }

        let ligne = vide.l;
        while (ligne > 0 && this.tabcookies[ligne][vide.c].htmlImage === null) {
          ligne--;
        }

        // Crée un nouveau cookie avec le type du cookie du dessus
        let cookieDessus = this.tabcookies[ligne][vide.c];
        let cookie = new Cookie(cookieDessus.type, vide.l, vide.c);
        this.tabcookies[vide.l][vide.c] = cookie;
        div.appendChild(cookie.htmlImage);

        // Supprimer le cookie du dessus

        if (cookieDessus.htmlImage !== null && cookieDessus.htmlImage.parentNode !== null) {
          cookieDessus.htmlImage.parentNode.removeChild(cookieDessus.htmlImage);
          cookieDessus.htmlImage = null;
        }

        vides.splice(vides.indexOf(vide), 1);
        vides.push({l: ligne, c: vide.c});
      });
    }
    this.showCookies();
  }

  incrementerScore(alignees) {
    alignees.forEach((alignee) => {
      switch(alignee.length) {
        case 3:
          this.score += 1;
          break;
        case 4:
          this.score += 2;
          break;
        case 5:
          this.score += 3;
      }
    });
    document.querySelector("#score").innerHTML = "Score : " + this.score;
  }

}
