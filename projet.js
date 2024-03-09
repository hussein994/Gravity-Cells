//---------------------------------------------------------------
//-------------------Accès au canvas défini -------------------//
//---------------------------------------------------------------


var canvas = document.getElementsByTagName("canvas")[0]; 
var ctx = canvas.getContext("2d");

var tab_particules = [];
var dt = 0.2;
var G = 1;

//-----------------------------------------------------------------



function getRandomColor() { // génère une couleur aléatoirement en hexadecimale 
    let letters = '0123456789ABCDEF'; 
    let color = '#';
    for (let i = 0; i < 6; i++)
        color += letters[Math.floor(Math.random() * 16)]; 
    return color;
};


// Retourne un entier compris dans [min;max[
function genereNombre(min, max){
    return Math.floor((Math.random()*(max-min))+min)
}










//---------------------------------------------------------------
//----------------1.Finalisation de l'interface----------------//
//---------------------------------------------------------------

var arrow = document.getElementById("arrow");
var texte_controles = document.getElementById("texte_controles");
var controls = document.getElementById("controls");
let menu_status = false;

//-----------------------------------------------------------------


controls.addEventListener("click", hide_show);


function hide_show() {
    if(menu_status===false) {
        $("#formulaire-skeleton").slideUp(500); // animation de glissement à la fermeture
        arrow.style.cssText = "transform: rotate(180deg);"; // animation de la flèche (avec la transition spécifiée dans le fichier css)
        texte_controles.innerHTML = "Afficher les contrôles";
        menu_status=true; // change l'état à "fermé" pour le prochain clique
    } else {
        $("#formulaire-skeleton").slideDown(500); // animation de glissement à la fermeture
        arrow.style.cssText = "transform: rotate(0deg);"
        texte_controles.innerHTML = "Masquer les contrôles"
        menu_status=false;
    }
};



let slider = document.getElementById("in_range");
let output = document.getElementById("slider_value");
output.innerHTML = slider.value;
  
slider.oninput = function() {
    output.innerHTML = this.value;
};












//---------------------------------------------------------------
//---2.Creation d'une classe pour representer des particules---//
//---------------------------------------------------------------

var couleur = document.querySelector(".colorpicker");

//-----------------------------------------------------------------

function Particule(masse,x,y){

    this.masse = masse;  // masse de la particule
    this.x = x; // coordonnee en x
    this.y = y; // coordonnee en y
    var vx;  // vélocité en x
    var vy;  // vélocité en y
    var fx; // force appliquée sur x
    var fy;  // force appliquée sur y
    var fix = false; // un booléen qui indique si la particule est fixée ou pas
    var color = couleur.value; // couleur de la particule
  
    var radius = masse>500 ? 20 : masse/5;

    this.draw = function(){
        ctx.beginPath();
        ctx.fillStyle = this.color
        ctx.arc(this.x, this.y, radius, 0, Math.PI*2, true); 
        ctx.closePath(); 
        ctx.fill();
    };
};











//---------------------------------------------------------------
//--------3.Initialisationd'un enssemble de particules---------//
//---------------------------------------------------------------


for(let i=0; i<10; i++){

    var masse = genereNombre(10,100);

    var rad = 0.0;

    var ang = 2*(Math.PI)*i / 10;

    if (masse<50) {
        var rad = genereNombre(50,100);
    } else {
        var rad = genereNombre(100,200);
    }

    var x = $('#affichage').attr('width')/2 + rad*Math.sin(ang);

    var y = $('#affichage').attr('height')/2 + rad*Math.cos(ang);

    if(masse<30)
        masse = 50;
    if(masse>90)
        masse = 50; // uniformisation de la taille des particules

    let p = new Particule(masse, x, y);   // on initialise la nouvelle particule
    p.vx = -0.01*rad*Math.cos(ang); // pas besoin de vélocité vu qu'elle est immobile
    p.vy = 0.01*rad*Math.sin(ang);   // pareil pas besoin
    p.color = getRandomColor(); // couleur aléatoire de la particule
    p.draw();  // chaque particule est dessinée
    tab_particules.push(p);  // chaque particule est ajoutée au tableau de particules
}













//---------------------------------------------------------------
//----4.Ajout de particules par double click dans le canvas----//
//---------------------------------------------------------------

var formulaire = document.getElementById("formulaire-skeleton");
var boutons = document.getElementById("boutons");
var particule_milieu = new Particule(3000, 400, 300); // Particule fix

//-----------------------------------------------------------------

formulaire.addEventListener("dblclick", ajouter_particules);
boutons.addEventListener("dblclick", ajouter_particules);
canvas.addEventListener("dblclick", ajouter_particules);

function ajouter_particules(event) {
    x = event.pageX-$('#affichage').offset().left;
    y = event.pageY-$('#affichage').offset().top;

    let masse_nouveau = slider.value/4;
    if(masse_nouveau<10)
        masse_nouveau = 10;
    if(masse_nouveau>120)
        masse_nouveau = 120;

    const particle = new Particule(masse_nouveau,x,y);
    particle.moveparticle = true; 
    particle.color = couleur.value;  // Ici, il te faut le value du color picker
    particle.vx = -0.5;
    particle.vy = 0;
    particle.fx = 0;
    particle.fy = 0;
    particle.draw();
    tab_particules.unshift(particle);
    cancelAnimationFrame(particle, ctx);
}




//---------------------------------------------------------------
//------------------4.1Particule centrée fixe------------------//
//---------------------------------------------------------------


particule_milieu.color = "rgb(201, 196, 30)"; // on assigne une couleur à la particule
particule_milieu.fix = true;
particule_milieu.draw(); // on la dessine
tab_particules.push(particule_milieu); // on l'ajoute au tableau de particules












//---------------------------------------------------------------
//------------5.Calcul du deplacement des particules-----------//
//---------------------------------------------------------------


function calculDeplacements(particules, dt) {
    for(let i=0; i<particules.length; i++) {
        if (particules[i].fix === true) continue;
       
        particules[i].fx = 0;
        particules[i].fy = 0;


        /* Calcul de la force appliquée à i par toutes les autres particules */
        for(let j=0; j<particules.length; j++) {
            if(i==j) continue;

            let dx = particules[j].x - particules[i].x;
            let dy = particules[j].y - particules[i].y;

            let r = Math.sqrt(Math.pow(dx,2)+Math.pow(dy,2));

            let f = G * particules[j].masse / (Math.pow(r,2));
            
            particules[i].fx = particules[i].fx + f*dx/r;
            particules[i].fy = particules[i].fy + f*dy/r;
        }


        /* Calcul de la nouvelle position de la particule i avec la méthode d'Euler */
        let ax = particules[i].fx / particules[i].masse * 3;
        let ay = particules[i].fy / particules[i].masse * 3;

        particules[i].vx = particules[i].vx + ax * dt;
        particules[i].vy = particules[i].vy + ay * dt;

        particules[i].x = particules[i].x + particules[i].vx * dt;
        particules[i].y = particules[i].y + particules[i].vy * dt;
    }
}












//---------------------------------------------------------------
//--------------------------6.Animation------------------------//
//---------------------------------------------------------------


var intervalID;

//-----------------------------------------------------------------


function animer(){
    intervalID = setInterval(function(){ 
        calculDeplacements(tab_particules, dt);
    
        ctx.fillStyle = "#222222";
        ctx.fillRect(0,0,canvas.width, canvas.height);
        
        for (let p = 0; p < tab_particules.length; p++){
             tab_particules[p].draw();
        }
    }, 10); // code exécuté toutes les 10 ms
}




//---------------------------------------------------------------
//------------6.2. Buttons de demarrage et de Stop-------------//
//---------------------------------------------------------------

$("#demarrer").click(function() {
    animer();
});

$("#stop").click(function() {
clearInterval(intervalID);
});