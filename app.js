let alleKarten = [];
let deck = [];
let aktuelleKarte = null;
let currentMode = ''; 
let quizScore = 0;
let quizTotal = 0;
let kartenGespielt = 0;

// Streak aus LocalStorage laden
let streak = localStorage.getItem('bfp24_streak') || 0;
document.getElementById('streakCounter').innerText = streak;

// JSON laden
async function datenLaden() {
    try {
        const response = await fetch('lernstoff.json');
        alleKarten = await response.json();
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        alert('Datenbank konnte nicht geladen werden.');
    }
}

// Ansichten wechseln
function zeigeView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function zurueckZumDashboard() {
    zeigeView('dashboardView');
    document.getElementById('cardInner').classList.remove('is-flipped');
}

// Deck basierend auf Filtern mischen
function deckMischen() {
    const lehrjahr = document.getElementById('lehrjahrFilter').value;
    const kategorie = document.getElementById('kategorieFilter').value;

    deck = alleKarten.filter(k => {
        const matchLj = lehrjahr === 'alle' || k.lehrjahr == lehrjahr;
        const matchKat = kategorie === 'alle' || k.kategorie === kategorie;
        return matchLj && matchKat;
    });

    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Modus starten (Lernen oder Quiz)
function startModus(modus) {
    deckMischen();
    if (deck.length === 0) {
        alert('Keine Fragen für diese Filterkombination gefunden!');
        return;
    }

    currentMode = modus;
    kartenGespielt = 0;
    
    if (modus === 'quiz') {
        quizScore = 0;
        quizTotal = Math.min(deck.length, 10); // Maximal 10 Fragen im Quiz
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

// Karte in die UI laden
function naechsteKarteLaden() {
    const cardInner = document.getElementById('cardInner');
    if (cardInner.classList.contains('is-flipped')) {
        cardInner.classList.remove('is-flipped');
        setTimeout(fuelleKartenInhalt, 400); // Warten bis Animation fertig ist
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

    // UI aktualisieren
    document.getElementById('badgeLehrjahr').innerText = `LJ ${aktuelleKarte.lehrjahr}`;
    document.getElementById('badgeKategorie').innerText = aktuelleKarte.kategorie;
    document.getElementById('frageText').innerText = aktuelleKarte.frage;
    document.getElementById('erklaerungText').innerText = aktuelleKarte.erklaerung;
    document.getElementById('quellenText').innerText = `Quelle: ${aktuelleKarte.quelle}`;

    const videoContainer = document.getElementById('videoContainer');
    if (aktuelleKarte.video_url) {
        videoContainer.innerHTML = `<iframe src="${aktuelleKarte.video_url}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        videoContainer.innerHTML = '';
    }

    // Controls resetten
    if (currentMode === 'quiz') {
        document.getElementById('quizControls').classList.add('hidden');
    }
}

function updateProgress() {
    const percentage = (kartenGespielt / quizTotal) * 100;
    document.getElementById('quizProgress').style.width = `${percentage}%`;
}

// Karte umdrehen
document.getElementById('lernKarte').addEventListener('click', () => {
    const cardInner = document.getElementById('cardInner');
    const isFlipped = cardInner.classList.contains('is-flipped');
    
    if (!isFlipped) {
        cardInner.classList.add('is-flipped');
        if (currentMode === 'quiz') {
            document.getElementById('quizControls').classList.remove('hidden');
        }
    }
});

// Quiz Bewertung
function bewerteAntwort(wussteIch) {
    if (wussteIch) {
        quizScore++;
        document.getElementById('scoreValue').innerText = quizScore;
    }
    document.getElementById('quizControls').classList.add('hidden');
    naechsteKarteLaden();
}

// Lern-Modus Nächste Karte
document.getElementById('nextCardBtn').addEventListener('click', (e) => {
    e.stopPropagation(); // Verhindert erneutes Karten-Klicken
    naechsteKarteLaden();
});

// Modus beenden & Resultate
function beendeModus() {
    if (currentMode === 'quiz') {
        const prozent = (quizScore / quizTotal) * 100;
        document.getElementById('finalScore').innerText = `${quizScore}/${quizTotal}`;
        
        let msg = "";
        if (prozent === 100) { msg = "Perfekt! Examen kann kommen."; streak++; }
        else if (prozent >= 80) { msg = "Sehr starke Leistung!"; streak++; }
        else if (prozent >= 50) { msg = "Gutes Grundwissen, weiter so."; streak = 0; }
        else { msg = "Da müssen wir nochmal ran."; streak = 0; }
        
        document.getElementById('resultMessage').innerText = msg;
        
        // Streak speichern
        localStorage.setItem('bfp24_streak', streak);
        document.getElementById('streakCounter').innerText = streak;

        zeigeView('resultView');
    } else {
        alert("Stapel durchgearbeitet! Zurück zum Menü.");
        zurueckZumDashboard();
    }
}

datenLaden();
