let alleKarten = [];
let ungeseheneKarten = [];
let aktuelleKarte = null;

// JSON laden
async function datenLaden() {
    try {
        const response = await fetch('lernstoff.json');
        alleKarten = await response.json();
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        document.getElementById('kartenStatus').innerText = "Fehler beim Laden der Datenbank!";
    }
}

// Filter anwenden und Deck mischen
function deckVorbereiten() {
    const lehrjahr = document.getElementById('lehrjahrFilter').value;
    const kategorie = document.getElementById('kategorieFilter').value;

    ungeseheneKarten = alleKarten.filter(karte => {
        const matchLehrjahr = lehrjahr === 'alle' || karte.lehrjahr == lehrjahr;
        const matchKategorie = kategorie === 'alle' || karte.kategorie === kategorie;
        return matchLehrjahr && matchKategorie;
    });

    // Mischen (Fisher-Yates Shuffle)
    for (let i = ungeseheneKarten.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ungeseheneKarten[i], ungeseheneKarten[j]] = [ungeseheneKarten[j], ungeseheneKarten[i]];
    }
    
    updateStatus(ungeseheneKarten.length, ungeseheneKarten.length);
}

function updateStatus(aktuell, gesamt) {
    const statusText = gesamt === 0 
        ? "Keine Karten für diese Filter gefunden." 
        : `Noch ${aktuell} von ${gesamt} Karten übrig`;
    document.getElementById('kartenStatus').innerText = statusText;
}

// Neue Karte ziehen
function naechsteKarte() {
    const cardInner = document.getElementById('cardInner');
    
    // Karte erst umdrehen (verstecken), falls offen
    if (cardInner.classList.contains('is-flipped')) {
        cardInner.classList.remove('is-flipped');
        setTimeout(ladeInhalt, 400); // Warten bis Animation fertig ist
    } else {
        ladeInhalt();
    }
}

function ladeInhalt() {
    if (ungeseheneKarten.length === 0) {
        deckVorbereiten(); // Deck neu starten, wenn alle durch sind
        if (ungeseheneKarten.length === 0) return; 
    }

    // Nächste Karte vom Stapel nehmen
    aktuelleKarte = ungeseheneKarten.pop();
    updateStatus(ungeseheneKarten.length, document.getElementById('kartenStatus').innerText.split(' von ')[1]?.split(' ')[0] || ungeseheneKarten.length + 1);

    // UI aktualisieren
    document.getElementById('lernKarte').classList.remove('hidden');
    document.getElementById('startButton').classList.add('hidden');
    document.getElementById('nextButton').classList.remove('hidden');

    // Content füllen
    document.getElementById('badgeLehrjahr').innerText = `LJ ${aktuelleKarte.lehrjahr}`;
    document.getElementById('badgeKategorie').innerText = aktuelleKarte.kategorie;
    document.getElementById('frageText').innerText = aktuelleKarte.frage;
    document.getElementById('erklaerungText').innerText = aktuelleKarte.erklaerung;
    document.getElementById('quellenText').innerText = `Quelle: ${aktuelleKarte.quelle}`;

    const videoContainer = document.getElementById('videoContainer');
    if (aktuelleKarte.video_url) {
        videoContainer.innerHTML = `<iframe src="${aktuelleKarte.video_url}"></iframe>`;
    } else {
        videoContainer.innerHTML = '';
    }
}

// Klick auf die Karte -> Umdrehen
document.getElementById('lernKarte').addEventListener('click', () => {
    document.getElementById('cardInner').classList.toggle('is-flipped');
});

// Buttons
document.getElementById('startButton').addEventListener('click', () => {
    deckVorbereiten();
    naechsteKarte();
});

document.getElementById('nextButton').addEventListener('click', naechsteKarte);

// Wenn Filter geändert werden -> Deck sofort neu laden
document.getElementById('lehrjahrFilter').addEventListener('change', deckVorbereiten);
document.getElementById('kategorieFilter').addEventListener('change', deckVorbereiten);

// Start
datenLaden();