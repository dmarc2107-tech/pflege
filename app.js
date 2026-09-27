let alleKarten = [];
let deck = [];
let aktuelleKarte = null;
let currentMode = ''; 
let quizScore = 0;
let quizTotal = 0;
let kartenGespielt = 0;

let streak = localStorage.getItem('bfp24_streak') || 0;
document.getElementById('streakCounter').innerText = streak;

async function datenLaden() {
    try {
        const response = await fetch('lernstoff.json');
        alleKarten = await response.json();
    } catch (error) {
        alert('Datenbank konnte nicht geladen werden.');
    }
}

function zeigeView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function zurueckZumDashboard() {
    zeigeView('dashboardView');
    document.getElementById('cardInner').classList.remove('is-flipped');
}

function startModus(modus) {
    currentMode = modus;
    kartenGespielt = 0;
    
    // Deck zusammenstellen
    if (modus === 'fallbeispiel') {
        deck = alleKarten.filter(k => k.kategorie === 'Pflegeplanung & SIS');
    } else {
        const lj = document.getElementById('lehrjahrFilter').value;
        const kat = document.getElementById('kategorieFilter').value;
        deck = alleKarten.filter(k => {
            const matchLj = lj === 'alle' || k.lehrjahr == lj;
            const matchKat = kat === 'alle' || k.kategorie === kat;
            // Verstecke die riesigen Fallbeispiele aus dem normalen Lern-Modus
            return matchLj && matchKat && k.kategorie !== 'Pflegeplanung & SIS';
        });
    }

    if (deck.length === 0) {
        alert('Keine Inhalte für diese Filter gefunden!');
        return;
    }

    // Mischen
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // UI für den jeweiligen Modus anpassen
    if (modus === 'quiz') {
        quizScore = 0;
        quizTotal = Math.min(deck.length, 10); 
        document.getElementById('scoreDisplay').classList.remove('hidden');
        document.getElementById('scoreValue').innerText = quizScore;
        document.getElementById('lernControls').classList.add('hidden');
    } else {
        quizTotal = deck.length;
        document.getElementById('scoreDisplay').classList.add('hidden');
        document.getElementById('lernControls').classList.remove('hidden');
        document.getElementById('quizControls').classList.add('hidden');
    }

    updateProgress();
    zeigeView('studyView');
    naechsteKarteLaden();
}

function naechsteKarteLaden() {
    const cardInner = document.getElementById('cardInner');
    if (cardInner.classList.contains('is-flipped')) {
        cardInner.classList.remove('is-flipped');
        setTimeout(fuelleKartenInhalt, 400); 
    } else {
        fuelleKartenInhalt();
    }
}

function fuelleKartenInhalt() {
    if ((currentMode === 'quiz' && kartenGespielt >= quizTotal) || deck.length === 0) {
        beendeModus();
        return;
    }

    aktuelleKarte = deck.pop();
    kartenGespielt++;
    updateProgress();

    document.getElementById('badgeLehrjahr').innerText = `LJ ${aktuelleKarte.lehrjahr}`;
    document.getElementById('badgeKategorie').innerText = aktuelleKarte.kategorie;
    document.getElementById('frageText').innerText = aktuelleKarte.frage;
    document.getElementById('erklaerungText').innerText = aktuelleKarte.erklaerung;
    document.getElementById('quellenText').innerText = `Quelle: ${aktuelleKarte.quelle}`;

    if (currentMode === 'quiz') {
        document.getElementById('quizControls').classList.add('hidden');
    }
}

function updateProgress() {
    document.getElementById('quizProgress').style.width = `${(kartenGespielt / quizTotal) * 100}%`;
}

document.getElementById('lernKarte').addEventListener('click', () => {
    const cardInner = document.getElementById('cardInner');
    if (!cardInner.classList.contains('is-flipped')) {
        cardInner.classList.add('is-flipped');
        if (currentMode === 'quiz') document.getElementById('quizControls').classList.remove('hidden');
    }
});

function bewerteAntwort(wussteIch) {
    if (wussteIch) {
        quizScore++;
        document.getElementById('scoreValue').innerText = quizScore;
    }
    document.getElementById('quizControls').classList.add('hidden');
    naechsteKarteLaden();
}

document.getElementById('nextCardBtn').addEventListener('click', (e) => {
    e.stopPropagation(); 
    naechsteKarteLaden();
});

function beendeModus() {
    if (currentMode === 'quiz') {
        const prozent = (quizScore / quizTotal) * 100;
        document.getElementById('finalScore').innerText = `${quizScore}/${quizTotal}`;
        
        let msg = "";
        let sc = document.getElementById('scoreCircle');
        sc.style.borderColor = "var(--primary)";
        sc.style.color = "var(--primary)";

        if (prozent >= 80) { 
            msg = "Examen kann kommen! Du bist fit."; 
            streak++; 
            sc.style.borderColor = "var(--success)"; sc.style.color = "var(--success)";
        }
        else if (prozent >= 50) { 
            msg = "Solides Grundwissen, aber da geht noch mehr."; 
            streak = 0; 
        }
        else { 
            msg = "Das müssen wir nochmal wiederholen!"; 
            streak = 0; 
            sc.style.borderColor = "var(--danger)"; sc.style.color = "var(--danger)";
        }
        
        document.getElementById('resultMessage').innerText = msg;
        localStorage.setItem('bfp24_streak', streak);
        document.getElementById('streakCounter').innerText = streak;
        zeigeView('resultView');
    } else {
        document.getElementById('scoreCircle').style.display = 'none';
        document.getElementById('finalScore').innerText = "Fertig!";
        document.getElementById('resultMessage').innerText = "Du hast alle Karten in diesem Stapel durchgearbeitet.";
        zeigeView('resultView');
    }
}

datenLaden();
