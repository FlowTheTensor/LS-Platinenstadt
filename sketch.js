// =============================================================================
//  Platinenstadt · Der von-Neumann-Rechner
//  Ein Zoom ins Innere des Laborservers: Das Mainboard ist eine Stadt.
//  Rathaus = CPU (Steuerwerk + Rechenwerk), Wohnblock = Arbeitsspeicher,
//  Hauptstraße = Bus, Stadttor = Ein-/Ausgabe. Ein Lieferwagen transportiert
//  Befehle und Daten – über dieselbe Straße aus demselben Wohnblock.
//  Sechs Freigabestufen vom Stadtführer bis zum Bürgermeister:
//    1 Stadtplan · 2 Befehlszyklus · 3 Ein Speicher · 4 Sprünge ·
//    5 von Neumann · Harvard · 6 CPU · GPU
// =============================================================================
//
//  Dateien
//    maschine.js  die Mini-CPU: Befehlssatz, Simulation (von Neumann / Harvard)
//    stufen.js    Freigabestufen, Beispielprogramme, Stadtführung, Prüfung
//    ui.js        Knöpfe, Auswahllisten, Eingabefelder
//    sketch.js    Ablauf, Zeichnen (Stadt, Speicher, Protokoll, GPU)
//
//  Bedienung
//    →         nächster Schritt
//    Leertaste automatisch ablaufen lassen / anhalten
//    R         Neustart
//
//  Läuft mit p5.js 1.x und 2.x.
//  Hinweis: Alle Schleifen haben geschweifte Klammern – der p5-Web-Editor
//  kommt mit Schleifen ohne Klammern nicht zurecht.
// =============================================================================

const W = 1600;
const LEISTE = 48;
const H_INHALT = 900;
const H = H_INHALT + LEISTE;
let S = 1;

const SCHRIFTEN = {
  titel: ["Quicksand", "Arial"],
  text: ["Inter", "Arial"],
  mono: ["JetBrains Mono", "monospace"],
};
const schriftGeladen = { titel: false, text: false, mono: false };
let TITEL = "Arial";
let SCHRIFT = "Arial";
let MONO = "monospace";

function ladeSchriften() {
  if (!document.fonts || !document.fonts.load) {
    return;
  }
  for (const art of Object.keys(SCHRIFTEN)) {
    const name = SCHRIFTEN[art][0];
    Promise.all([document.fonts.load(`400 16px "${name}"`), document.fonts.load(`700 16px "${name}"`)])
      .then((ergebnis) => {
        if (ergebnis[0].length > 0 && ergebnis[1].length > 0) {
          schriftGeladen[art] = true;
          TITEL = schriftGeladen.titel ? SCHRIFTEN.titel[0] : SCHRIFTEN.titel[1];
          SCHRIFT = schriftGeladen.text ? SCHRIFTEN.text[0] : SCHRIFTEN.text[1];
          MONO = schriftGeladen.mono ? SCHRIFTEN.mono[0] : SCHRIFTEN.mono[1];
        }
      })
      .catch(() => {});
  }
}

const P_STADT = { x: 24, y: 84, w: 900, h: 540, titel: "" };
const P_RAM = { x: 24, y: 640, w: 900, h: 244, titel: "" };
const P_ERKL = { x: 940, y: 84, w: 636, h: 380, titel: "" };
const P_STEUER = { x: 940, y: 480, w: 400, h: 404, titel: "" };
const P_FREIGABE = { x: 1356, y: 480, w: 220, h: 404, titel: "Freigaben" };
const KOPF_H = 34;

const FARBE_HELL = {
  papier: [251, 249, 245],
  flaeche: [255, 255, 255],
  flaeche2: [243, 238, 230],
  linie: [231, 225, 214],
  text: [29, 29, 28],
  grau: [91, 88, 82],
  blass: [125, 122, 114],
  akzent: [200, 30, 58],
  akzentHell: [228, 0, 43],
  senf: [184, 122, 28],
  gruen: [52, 128, 84],
  blau: [44, 92, 150],
  violett: [122, 74, 150],
  platine: [38, 96, 70],
  platineHell: [56, 122, 92],
  strasse: [70, 72, 76],
  kupfer: [200, 150, 70],
  // Flächen und Schrift auf Flächen (für das dunkle Schema nötig)
  textInvers: [255, 255, 255],
  dunkelFlaeche: [29, 29, 28],
  schatten: [29, 29, 28],
  akzentFlaeche: [253, 240, 242],
  akzentLinie: [240, 200, 208],
  rotFlaeche: [251, 225, 230],
  gruenFlaeche: [228, 241, 233],
  neutral: [160, 155, 146], // inaktive Elemente
};

const FARBE_DUNKEL = {
  papier: [22, 22, 21],
  flaeche: [32, 31, 30],
  flaeche2: [44, 42, 40],
  linie: [62, 59, 55],
  text: [236, 232, 224],
  grau: [184, 178, 168],
  blass: [140, 135, 126],
  akzent: [236, 76, 98],
  akzentHell: [255, 64, 92],
  senf: [222, 166, 72],
  gruen: [96, 186, 132],
  blau: [104, 156, 222],
  violett: [176, 136, 206],
  platine: [24, 66, 48],
  platineHell: [40, 92, 68],
  strasse: [92, 94, 98],
  kupfer: [214, 164, 84],
  textInvers: [22, 22, 21],
  dunkelFlaeche: [70, 67, 62],
  schatten: [0, 0, 0],
  akzentFlaeche: [52, 27, 32],
  akzentLinie: [104, 44, 56],
  rotFlaeche: [72, 32, 40],
  gruenFlaeche: [30, 54, 41],
  neutral: [120, 116, 108], // inaktive Elemente
};

const FARBE = {};

// --- Farbschema hell/dunkel ---------------------------------------------------
// FARBE enthält immer die aktive Palette. Beim Umschalten werden die Arrays
// in place überschrieben, damit Verweise wie [FARBE.blau, …] gültig bleiben.
// Die Wahl gilt für alle Lernsituationen (gleicher localStorage-Schlüssel).
const FARBSCHEMA_SCHLUESSEL = "jps-lernsituationen-farbschema";
let dunkelModus = false;

function setzeFarbschema(dunkel) {
  dunkelModus = !!dunkel;
  const quelle = dunkelModus ? FARBE_DUNKEL : FARBE_HELL;
  for (const k in quelle) {
    if (FARBE[k]) {
      FARBE[k].splice(0, FARBE[k].length, ...quelle[k]);
    } else {
      FARBE[k] = quelle[k].slice();
    }
  }
  document.documentElement.classList.toggle("dunkelmodus", dunkelModus);
}

function gespeichertesFarbschema() {
  try {
    const v = localStorage.getItem(FARBSCHEMA_SCHLUESSEL);
    if (v === "dunkel" || v === "hell") {
      return v === "dunkel";
    }
  } catch (e) {
    // kein Speicher verfügbar (z. B. privater Modus) – Systemeinstellung nehmen
  }
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

setzeFarbschema(gespeichertesFarbschema());


// Farben je Rolle: als Befehl gelesen / als Zahl gelesen / geschrieben
const ROLLE = { befehl: [44, 92, 150], daten: [184, 122, 28], schreiben: [200, 30, 58] };
const TEMPO = { langsam: 1.7, mittel: 1, schnell: 0.35 };

// -----------------------------------------------------------------------------
// Zustand
// -----------------------------------------------------------------------------
let stufe = 0;
let modus = "ueben";
let beispielIdx = 0;
let arch = "neumann";
let tempo = "mittel";
let sim = null;
let schrittIdx = 0;
let laufAuto = false;
let animT0 = 0;
let fuehrungIdx = 0;

let gpuAufgabe = 0;
let gpuUhr = 0;

let aufgabe = null;
let serie = 0;
let rueckmeldung = null; // {ok, text}
let antwortIdx = -1;
let aufloesung = false;
let freigaben = [false, false, false, false, false, false];
let stempel = null;
let mcRechtecke = [];
let fehlerMeldung = null;
let cnv;

// =============================================================================
// Start
// =============================================================================
function setup() {
  ladeSchriften();
  const [cw, ch] = zeichenflaeche();
  cnv = createCanvas(cw, ch);
  S = width / W;
  ladeFreigaben();
  erstelleUi();
  cnv.parent(huelle);
  stufeWechseln(0, true);
  layoutUi();
}

function zeichenflaeche() {
  const cw = Math.max(800, Math.min(1600, windowWidth - 24, ((windowHeight - 24) * W) / H));
  return [Math.round(cw), Math.round((cw * H) / W)];
}

function windowResized() {
  const [cw, ch] = zeichenflaeche();
  resizeCanvas(cw, ch);
  S = width / W;
  layoutUi();
}

function draw() {
  try {
    logik();
    background(...FARBE.papier);
    push();
    scale(S);
    zeichneKopf();
    zeichneStufenLeiste();
    push();
    translate(0, LEISTE);
    zeichneStatus();
    if (STUFEN[stufe].ansicht === "gpu") {
      zeichneGpuStadt();
      zeichneGpuRaster();
      zeichneGpuProtokoll();
    } else {
      zeichneStadt();
      zeichneSpeicher();
      zeichneProtokoll();
    }
    zeichneSteuerung();
    zeichneFreigaben();
    zeichneStempel();
    zeichneFehlerMeldung();
    pop();
    pop();
    aktualisiereUi();
  } catch (err) {
    behandleFehler(err);
  }
}

function behandleFehler(err) {
  console.error(err);
  fehlerMeldung = { text: String((err && err.message) || err), t0: millis() };
  laufAuto = false;
}

function animDauer() {
  return 1000 * TEMPO[tempo];
}

function logik() {
  if (!laufAuto) {
    return;
  }
  if (STUFEN[stufe].ansicht === "gpu") {
    if (millis() - animT0 > 320 * TEMPO[tempo]) {
      gpuSchritt();
      if (gpuFertig()) {
        laufAuto = false;
      }
    }
    return;
  }
  if (stufe === 0 && modus === "ueben") {
    laufAuto = false;
    return;
  }
  const schritt = aktSchritt();
  const pause = schritt && schritt.fahrtenListe.length ? animDauer() + 250 : 650 * TEMPO[tempo];
  if (millis() - animT0 > pause) {
    if (!naechsterSchritt()) {
      laufAuto = false;
    }
  }
}

// =============================================================================
// Stufen, Modus, Beispiele
// =============================================================================
function stufeWechseln(neu, erzwingen) {
  if (!erzwingen && neu === stufe) {
    return;
  }
  stufe = neu;
  beispielIdx = 0;
  arch = "neumann";
  fuehrungIdx = 0;
  gpuAufgabe = 0;
  zuruecksetzen();
}

function modusWechseln(neu) {
  if (neu === modus) {
    return;
  }
  modus = neu;
  zuruecksetzen();
}

function zuruecksetzen() {
  laufAuto = false;
  serie = 0;
  rueckmeldung = null;
  aufloesung = false;
  aufgabe = null;
  gpuUhr = 0;
  if (modus === "pruefung") {
    naechsteAufgabe();
  } else {
    neueSimulation();
  }
  if (typeof leereEingaben === "function") {
    leereEingaben();
  }
}

function aktBeispiel() {
  if (modus === "pruefung") {
    return aufgabe && aufgabe.beispiel ? aufgabe.beispiel : BSP.addieren;
  }
  const liste = STUFEN[stufe].beispiele;
  return BSP[liste[Math.min(beispielIdx, liste.length - 1)] || "addieren"];
}

function aktArch() {
  if (modus === "pruefung") {
    return aufgabe && aufgabe.arch ? aufgabe.arch : "neumann";
  }
  return STUFEN[stufe].id === "harvard" ? arch : "neumann";
}

function neueSimulation() {
  sim = simuliere(aktBeispiel(), aktArch());
  schrittIdx = 0;
  animT0 = millis();
  laufAuto = false;
}

function aktSchritt() {
  return sim ? sim.schritte[schrittIdx] : null;
}

function naechsterSchritt() {
  if (!sim || schrittIdx >= sim.schritte.length - 1) {
    return false;
  }
  schrittIdx++;
  animT0 = millis();
  return true;
}

function schrittKnopf() {
  if (STUFEN[stufe].ansicht === "gpu") {
    if (gpuFertig()) {
      gpuUhr = 0;
    }
    gpuSchritt();
    return;
  }
  if (stufe === 0 && modus === "ueben") {
    fuehrungIdx = (fuehrungIdx + 1) % FUEHRUNG.length;
    return;
  }
  if (sim && schrittIdx >= sim.schritte.length - 1) {
    neueSimulation();
    return;
  }
  naechsterSchritt();
}

function autoUmschalten() {
  if (STUFEN[stufe].ansicht === "gpu") {
    if (gpuFertig()) {
      gpuUhr = 0;
    }
    laufAuto = !laufAuto;
    animT0 = millis() - 10000;
    return;
  }
  if (sim && schrittIdx >= sim.schritte.length - 1) {
    neueSimulation();
  }
  laufAuto = !laufAuto;
  animT0 = millis() - 10000;
}

function neustart() {
  if (STUFEN[stufe].ansicht === "gpu") {
    gpuUhr = 0;
    laufAuto = false;
    return;
  }
  neueSimulation();
}

function beispielWechseln(i) {
  beispielIdx = i;
  neueSimulation();
}

function archWechseln(a) {
  arch = a;
  neueSimulation();
}

// =============================================================================
// GPU-Vergleich
// =============================================================================
// Gemeinsame Uhr für beide: gpuUhr zählt Zeitschritte von je 0,25 ns
// (= 1 Takt der CPU). Die langsamer getaktete GPU schafft in derselben
// Zeit weniger Takte – so sieht man, wer wirklich zuerst fertig ist.
function gpuZeitschritt() {
  return 1 / CPU_DATEN.ghz;
}

function gpuZeit() {
  return gpuUhr * gpuZeitschritt();
}

// fertige Takte bis jetzt (höchstens so viele, wie die Aufgabe braucht)
function takteBisher(daten) {
  return Math.min(gpuTakteGesamt(daten), Math.floor(gpuZeit() * daten.ghz + 1e-9));
}

function gpuFortschritt(daten) {
  const a = GPU_AUFGABEN[gpuAufgabe];
  const proTakt = a.abhaengig ? 1 : daten.kerne;
  return Math.min(a.n, takteBisher(daten) * proTakt);
}

function gpuTakteGesamt(daten) {
  const a = GPU_AUFGABEN[gpuAufgabe];
  return a.abhaengig ? a.n : Math.ceil(a.n / daten.kerne);
}

// Bearbeitet Kern i im aktuellen Takt eine Teilaufgabe?
function kernArbeitet(daten, i) {
  const a = GPU_AUFGABEN[gpuAufgabe];
  const fertig = takteBisher(daten);
  if (gpuUhr <= 0 || fertig >= gpuTakteGesamt(daten)) {
    return false;
  }
  if (a.abhaengig) {
    return i === 0;
  }
  return fertig * daten.kerne + i < a.n; // Teilaufgabe im laufenden Takt
}

function gpuFertig() {
  return takteBisher(CPU_DATEN) >= gpuTakteGesamt(CPU_DATEN) && takteBisher(GPU_DATEN) >= gpuTakteGesamt(GPU_DATEN);
}

function gpuSchritt() {
  if (gpuFertig()) {
    return;
  }
  gpuUhr++;
  animT0 = millis();
}

function gpuAufgabeWechseln(i) {
  gpuAufgabe = i;
  gpuUhr = 0;
  laufAuto = false;
}

// =============================================================================
// Freigabeprüfung
// =============================================================================
function naechsteAufgabe() {
  aufgabe = neuePruefung(stufe);
  rueckmeldung = null;
  antwortIdx = -1;
  aufloesung = false;
  laufAuto = false;
  sim = simuliere(aktBeispiel(), aktArch());
  schrittIdx = 0;
  if (typeof leereEingaben === "function") {
    leereEingaben();
  }
}

function pruefeAntwort(eingabe) {
  if (!aufgabe || rueckmeldung) {
    return;
  }
  let ok;
  if (aufgabe.art === "mc") {
    antwortIdx = eingabe;
    ok = eingabe === aufgabe.richtig;
  } else {
    const txt = String(eingabe).trim().replace(",", ".");
    if (txt === "") {
      return;
    }
    ok = Number(txt) === aufgabe.antwort;
  }
  if (ok) {
    serie++;
    rueckmeldung = { ok: true, text: "Richtig!" };
    if (serie >= SERIE_ZIEL) {
      if (!freigaben[stufe]) {
        freigaben[stufe] = true;
        speichereFreigaben();
      }
      stempel = { stufe, t0: millis() };
      rueckmeldung.text = `Prüfsiegel erteilt: Freigabe als ${STUFEN[stufe].rang}!`;
      serie = 0;
    }
  } else {
    serie = 0;
    rueckmeldung = {
      ok: false,
      text: aufgabe.art === "zahl" ? `Leider falsch – richtig ist ${aufgabe.antwort}. Die Serie beginnt von vorn.` : "Leider falsch – die Serie beginnt von vorn.",
    };
  }
}

function zeigeAufloesung() {
  if (!aufgabe || !aufgabe.beispiel) {
    return;
  }
  aufloesung = true;
  sim = simuliere(aufgabe.beispiel, aktArch());
  schrittIdx = 0;
  laufAuto = true;
  animT0 = millis() - 10000;
}

function ladeFreigaben() {
  try {
    const roh = window.localStorage.getItem("platinenstadt-freigaben");
    if (roh) {
      const liste = JSON.parse(roh);
      if (Array.isArray(liste) && liste.length === 6) {
        freigaben = liste.map((x) => x === true);
      }
    }
  } catch (e) {
    // kein Speicher verfügbar
  }
}

function speichereFreigaben() {
  try {
    window.localStorage.setItem("platinenstadt-freigaben", JSON.stringify(freigaben));
  } catch (e) {
    // kein Speicher verfügbar
  }
}

function freigabenZuruecksetzen() {
  freigaben = [false, false, false, false, false, false];
  speichereFreigaben();
}

// =============================================================================
// Maus und Tasten
// =============================================================================
function mausPos() {
  return { x: mouseX / S, y: mouseY / S - LEISTE };
}

function inRechteck(m, r) {
  return m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
}

function mousePressed() {
  try {
    const m = mausPos();
    if (modus === "pruefung" && aufgabe && aufgabe.art === "mc" && !rueckmeldung) {
      for (let i = 0; i < mcRechtecke.length; i++) {
        if (inRechteck(m, mcRechtecke[i])) {
          pruefeAntwort(i);
          return;
        }
      }
    }
    if (stufe === 0 && modus === "ueben") {
      const ziel = gebaeudeUnterMaus(m);
      if (ziel >= 0) {
        fuehrungIdx = ziel;
      }
    }
  } catch (err) {
    behandleFehler(err);
  }
}

function keyPressed() {
  if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT")) {
    return;
  }
  if (modus === "pruefung" && !aufloesung) {
    return;
  }
  if (keyCode === RIGHT_ARROW) {
    schrittKnopf();
    return false;
  }
  if (key === " ") {
    autoUmschalten();
    return false;
  }
  if (key === "r" || key === "R") {
    neustart();
    return false;
  }
}

// =============================================================================
// Grundbausteine
// =============================================================================
function panel(p) {
  noStroke();
  fill(...FARBE.schatten, 10);
  rect(p.x + 1, p.y + 3, p.w, p.h, 12);
  fill(...FARBE.flaeche);
  stroke(...FARBE.linie);
  strokeWeight(1);
  rect(p.x, p.y, p.w, p.h, 12);
  stroke(...FARBE.linie);
  line(p.x + 12, p.y + KOPF_H, p.x + p.w - 12, p.y + KOPF_H);
  if (p.titel) {
    noStroke();
    fill(...FARBE.akzentHell);
    circle(p.x + 19, p.y + KOPF_H / 2 + 1, 7);
    fill(...FARBE.text);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(16);
    textAlign(LEFT, CENTER);
    text(p.titel, p.x + 30, p.y + KOPF_H / 2 + 1);
    textStyle(NORMAL);
  }
}

function hell(farbe, anteil) {
  return [lerp(farbe[0], FARBE.flaeche[0], anteil), lerp(farbe[1], FARBE.flaeche[1], anteil), lerp(farbe[2], FARBE.flaeche[2], anteil)];
}

function umbrechen(txt, maxBreite) {
  const zeilen = [];
  for (const absatzText of String(txt).split("\n")) {
    const woerter = absatzText.split(" ");
    let akt = "";
    for (const wort of woerter) {
      const probe = akt ? akt + " " + wort : wort;
      if (textWidth(probe) > maxBreite && akt) {
        zeilen.push(akt);
        akt = wort;
      } else {
        akt = probe;
      }
    }
    zeilen.push(akt);
  }
  return zeilen;
}

function absatz(txt, x, y, breite, groesse, farbe, fett, maxZeilen) {
  textFont(SCHRIFT);
  textSize(groesse);
  textStyle(fett ? BOLD : NORMAL);
  textAlign(LEFT, TOP);
  fill(...(farbe || FARBE.text));
  noStroke();
  let zeilen = umbrechen(txt, breite);
  if (maxZeilen && zeilen.length > maxZeilen) {
    zeilen = zeilen.slice(0, maxZeilen);
    zeilen[maxZeilen - 1] += " …";
  }
  const za = groesse * 1.42;
  for (let i = 0; i < zeilen.length; i++) {
    text(zeilen[i], x, y + i * za);
  }
  textStyle(NORMAL);
  return zeilen.length * za;
}

function weich(t) {
  const u = constrain(t, 0, 1);
  return u * u * (3 - 2 * u);
}

// =============================================================================
// Kopf, Leiste, Status
// =============================================================================
function zeichneKopf() {
  noStroke();
  fill(...FARBE.flaeche);
  rect(0, 0, W, 56);
  stroke(...FARBE.linie);
  strokeWeight(1);
  line(0, 56, W, 56);
  noStroke();
  fill(...FARBE.akzentHell);
  circle(160, 28, 6);
  stroke(...FARBE.akzentHell);
  strokeWeight(3);
  line(170, 34, 180, 22);
  noStroke();
  fill(...FARBE.text);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(21);
  textAlign(LEFT, CENTER);
  text("Platinenstadt", 194, 21);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(13);
  fill(...FARBE.blass);
  text(STUFEN[stufe].untertitel, 194, 41);
}

function zeichneStufenLeiste() {
  noStroke();
  fill(...FARBE.akzentFlaeche);
  rect(0, 56, W, LEISTE);
  stroke(...FARBE.akzentLinie);
  strokeWeight(1);
  line(0, 56 + LEISTE, W, 56 + LEISTE);
  noStroke();
  fill(...FARBE.akzent);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(LEFT, CENTER);
  text("Stufe", 26, 56 + LEISTE / 2);
  textStyle(NORMAL);
  stroke(...FARBE.akzent);
  strokeWeight(2);
  const px = 26 + textWidth("Stufe") + 10;
  const py = 56 + LEISTE / 2;
  line(px, py - 5, px + 5, py);
  line(px + 5, py, px, py + 5);
  noStroke();
}

function zeichneStatus() {
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(LEFT, CENTER);
  let txt;
  if (modus === "pruefung") {
    txt = `Freigabeprüfung „${STUFEN[stufe].rang}“: ${SERIE_ZIEL} richtige Antworten in Folge ergeben das Prüfsiegel.`;
  } else if (stufe === 0) {
    txt = "Klick auf ein Gebäude oder „Weiter“ für die nächste Station der Stadtführung";
  } else if (STUFEN[stufe].ansicht === "gpu") {
    txt = "→ 0,25 ns weiter · Leertaste automatisch · R Neustart · beide laufen auf derselben Uhr – wer ist zuerst fertig?";
  } else {
    txt = "→ nächster Schritt · Leertaste automatisch · R Neustart";
  }
  text(txt, 26, 70);
}

// =============================================================================
// Die Stadt (von Neumann oder Harvard)
// =============================================================================
// Aufbau nach dem EVA-Prinzip:
//   links  Eingangstor (Eingabe)
//   Mitte  Rathaus (CPU) oben, Wohnblock (Speicher) unten – Verarbeitung
//   rechts Ausgangstor (Ausgabe)
// Die Hauptstraße (Bus) verbindet alle Gebäude.
const RATHAUS = { x: 194, y: 170, w: 560, h: 162 };
const STEUERWERK = { x: 202, y: 192, w: 268, h: 128 };
const RECHENWERK = { x: 480, y: 192, w: 266, h: 128 };
const STRASSE = { x: 180, y: 350, w: 588, h: 96 };
const BUS_Y = { adresse: 370, daten: 398, steuer: 426 };
const X_CPU = 330; // Ausfahrt des Rathauses (Harvard: Befehlsbus)
const X_DATEN = 620; // Einfahrt Wohnblock (Harvard: Datenbus)
const RAM_GEB = { x: 234, y: 470, w: 480, h: 138 };
const PROG_GEB = { x: 194, y: 470, w: 272, h: 138 };
const DATEN_GEB = { x: 484, y: 470, w: 272, h: 138 };
const EIN_TOR = { x: 56, y: 316, w: 124, h: 164 };
const AUS_TOR = { x: 768, y: 316, w: 124, h: 164 };
const HARVARD_DATENSTRASSE = { y: 372, h: 52 };

function gebaeudeUnterMaus(m) {
  const ziele = [
    ["steuerwerk", STEUERWERK],
    ["rechenwerk", RECHENWERK],
    ["rathaus", RATHAUS],
    ["ram", RAM_GEB],
    ["bus", STRASSE],
    ["ea", EIN_TOR],
    ["ea", AUS_TOR],
  ];
  for (const [id, r] of ziele) {
    if (inRechteck(m, r)) {
      return FUEHRUNG.findIndex((f) => f.id === id);
    }
  }
  return -1;
}

function zeichneStadt() {
  const p = P_STADT;
  const harvard = aktArch() === "harvard";
  p.titel = harvard ? "Harvard-Stadt · zwei Speicher, zwei Straßen" : "Platinenstadt · von Neumann: ein Speicher, eine Straße";
  panel(p);
  // Platinen-Untergrund
  noStroke();
  fill(...FARBE.platine);
  rect(p.x + 10, p.y + KOPF_H + 6, p.w - 20, p.h - KOPF_H - 16, 8);
  stroke(...FARBE.platineHell);
  strokeWeight(1);
  for (let x = p.x + 30; x < p.x + p.w - 10; x += 40) {
    line(x, p.y + KOPF_H + 6, x, p.y + p.h - 10);
  }
  for (let y = p.y + KOPF_H + 26; y < p.y + p.h - 10; y += 40) {
    line(p.x + 10, y, p.x + p.w - 10, y);
  }

  const s = aktSchritt();
  const fokus = stufe === 0 && modus === "ueben" ? FUEHRUNG[fuehrungIdx].id : null;

  zeichneEvaKopf(fokus === "prinzip");
  if (harvard) {
    zeichneHarvardStrassen();
  } else {
    zeichneHauptstrasse(fokus === "bus");
  }
  zeichneRathaus(s, fokus);
  if (harvard) {
    zeichneSpeicherGebaeude(PROG_GEB, "Programm-Bibliothek", "Befehlsspeicher (Flash)", s, "prog", ROLLE.befehl, 2);
    zeichneSpeicherGebaeude(DATEN_GEB, "Daten-Wohnblock", "Datenspeicher (RAM)", s, "daten", ROLLE.daten, 2);
  } else {
    zeichneSpeicherGebaeude(RAM_GEB, "Wohnblock · Arbeitsspeicher (RAM)", "Befehle UND Daten", s, "ram", FARBE.violett, 2, fokus === "ram");
  }
  zeichneTor(EIN_TOR, "ein", s, fokus === "ea");
  zeichneTor(AUS_TOR, "aus", s, fokus === "ea");
  if (s && s.fahrtenListe.length) {
    for (const f of s.fahrtenListe) {
      zeichneLieferwagen(f, harvard);
    }
  }
  if (fokus) {
    zeichneFokusRahmen(fokus);
  }
}

// Kopfzeile auf der Platine: Eingabe → Verarbeitung → Ausgabe
function zeichneEvaKopf(fokus) {
  const y = 127;
  const eintraege = [
    ["E · Eingabe", EIN_TOR.x + EIN_TOR.w / 2],
    ["V · Verarbeitung", RATHAUS.x + RATHAUS.w / 2],
    ["A · Ausgabe", AUS_TOR.x + AUS_TOR.w / 2],
  ];
  textFont(TITEL);
  textStyle(BOLD);
  textSize(12);
  const raender = [];
  for (const [name, cx] of eintraege) {
    const w = textWidth(name) + 24;
    noStroke();
    fill(...(fokus ? hell(FARBE.senf, 0.72) : FARBE.flaeche));
    rect(cx - w / 2, y, w, 18, 9);
    fill(...FARBE.platine);
    textAlign(CENTER, CENTER);
    text(name, cx, y + 9);
    raender.push([cx - w / 2, cx + w / 2]);
  }
  textStyle(NORMAL);
  stroke(...FARBE.flaeche, 255, 255, 200);
  strokeWeight(2);
  for (let i = 0; i < raender.length - 1; i++) {
    const x1 = raender[i][1] + 8;
    const x2 = raender[i + 1][0] - 8;
    line(x1, y + 9, x2, y + 9);
    line(x2, y + 9, x2 - 6, y + 4);
    line(x2, y + 9, x2 - 6, y + 14);
  }
  noStroke();
}

function zufahrt(x, y1, y2) {
  noStroke();
  fill(...FARBE.strasse);
  rect(x - 18, y1, 36, y2 - y1);
}

function zeichneHauptstrasse(fokus) {
  const st = STRASSE;
  zufahrt(X_CPU, RATHAUS.y + RATHAUS.h, st.y);
  zufahrt(X_DATEN, st.y + st.h, RAM_GEB.y);
  noStroke();
  fill(...FARBE.strasse);
  rect(st.x, st.y, st.w, st.h);
  const spuren = [
    ["Adressbus", BUS_Y.adresse, FARBE.blau],
    ["Datenbus", BUS_Y.daten, FARBE.gruen],
    ["Steuerbus", BUS_Y.steuer, FARBE.akzent],
  ];
  for (const [name, y, farbe] of spuren) {
    stroke(...farbe);
    strokeWeight(3);
    drawingContext.setLineDash([12, 8]);
    line(st.x + 6, y, st.x + st.w - 6, y);
    drawingContext.setLineDash([]);
    noStroke();
    fill(...hell(farbe, 0.55));
    textFont(SCHRIFT);
    textSize(10);
    textAlign(LEFT, BOTTOM);
    text(name, st.x + 8, y - 3);
  }
  noStroke();
  fill(255);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(12);
  textAlign(CENTER, CENTER);
  text("Hauptstraße = Bus", 430, st.y + st.h + 12);
  textStyle(NORMAL);
  if (fokus) {
    noFill();
    stroke(...FARBE.flaeche, 220, 90);
    strokeWeight(3);
    rect(st.x - 2, st.y - 2, st.w + 4, st.h + 4, 4);
  }
}

function zeichneHarvardStrassen() {
  const ds = HARVARD_DATENSTRASSE;
  const unten = RATHAUS.y + RATHAUS.h;
  // Datenbus: Rathaus – Daten-Wohnblock und zu den Stadttoren
  zufahrt(X_DATEN, unten, ds.y);
  zufahrt(X_DATEN, ds.y + ds.h, DATEN_GEB.y);
  noStroke();
  fill(...FARBE.strasse);
  rect(STRASSE.x, ds.y, STRASSE.w, ds.h);
  stroke(...FARBE.senf);
  strokeWeight(3);
  drawingContext.setLineDash([12, 8]);
  line(STRASSE.x + 6, BUS_Y.daten, STRASSE.x + STRASSE.w - 6, BUS_Y.daten);
  line(X_DATEN, unten + 4, X_DATEN, ds.y);
  line(X_DATEN, ds.y + ds.h, X_DATEN, DATEN_GEB.y - 2);
  drawingContext.setLineDash([]);
  // Befehlsbus: eigene Straße zur Programm-Bibliothek, als Brücke über den Datenbus
  noStroke();
  fill(...FARBE.schatten, 60);
  rect(X_CPU - 16, ds.y - 4, 40, ds.h + 12);
  fill(...FARBE.strasse);
  rect(X_CPU - 20, unten, 40, PROG_GEB.y - unten);
  stroke(...FARBE.blau);
  strokeWeight(3);
  drawingContext.setLineDash([12, 8]);
  line(X_CPU, unten + 4, X_CPU, PROG_GEB.y - 2);
  drawingContext.setLineDash([]);
  stroke(...FARBE.linie);
  strokeWeight(2.5);
  line(X_CPU - 21, ds.y - 8, X_CPU - 21, ds.y + ds.h + 8);
  line(X_CPU + 21, ds.y - 8, X_CPU + 21, ds.y + ds.h + 8);
  noStroke();
  fill(255);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text("Datenbus", X_DATEN + 30, ds.y - 4);
  textAlign(RIGHT, CENTER);
  text("Befehlsbus", X_CPU - 28, 447);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(10);
  fill(...hell(FARBE.strasse, 0.7));
  textAlign(RIGHT, CENTER);
  text("(Brücke)", X_CPU - 28, 461);
}

function zeichneRathaus(s, fokus) {
  const r = RATHAUS;
  // Dach
  noStroke();
  fill(...FARBE.akzent);
  triangle(r.x - 6, r.y + 18, r.x + r.w / 2, r.y - 24, r.x + r.w + 6, r.y + 18);
  fill(...FARBE.flaeche);
  rect(r.x, r.y + 14, r.w, r.h - 14, 4);
  fill(255);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("RATHAUS · CPU", r.x + r.w / 2, r.y - 8);
  textStyle(NORMAL);
  // Uhr (Takt)
  textFont(MONO);
  textSize(11);
  text(`Takt ${s ? s.takte : 0}`, r.x + r.w / 2, r.y + 6);

  const phase = s ? s.phase : "start";
  const b = s && s.ir !== null ? dekodiere(s.ir) : null;
  const steuerAktiv = phase === "holen" || phase === "entschluesseln";
  const rechenAktiv = phase === "ausfuehren" && b && ["ADD", "SUB", "LOAD", "IN"].indexOf(b.name) >= 0;

  // Steuerwerk
  raum(STEUERWERK, "Steuerwerk", steuerAktiv, fokus === "steuerwerk");
  person(STEUERWERK.x + 34, STEUERWERK.y + 88, [122, 74, 150], true, steuerAktiv);
  tafel(STEUERWERK.x + 72, STEUERWERK.y + 28, 88, "Befehlszähler", s ? String(s.pc) : "0", FARBE.blau, fokus === "register");
  tafel(STEUERWERK.x + 168, STEUERWERK.y + 28, 92, "Befehlsregister", s && s.ir !== null ? hex2(s.ir) : "–", FARBE.blau, fokus === "register", b ? b.text : "");
  // Rechenwerk
  raum(RECHENWERK, "Rechenwerk (ALU)", rechenAktiv, fokus === "rechenwerk");
  person(RECHENWERK.x + 34, RECHENWERK.y + 88, [184, 122, 28], false, rechenAktiv);
  tafel(RECHENWERK.x + 72, RECHENWERK.y + 28, 110, "Akku", s ? String(s.akku) : "0", FARBE.gruen, fokus === "register", s ? bin8(s.akku) : "");
  // ALU-Trichter
  fill(...(rechenAktiv ? hell(FARBE.gruen, 0.4) : FARBE.neutral));
  stroke(...FARBE.grau);
  strokeWeight(1);
  quad(RECHENWERK.x + 196, RECHENWERK.y + 36, RECHENWERK.x + 256, RECHENWERK.y + 36, RECHENWERK.x + 238, RECHENWERK.y + 94, RECHENWERK.x + 214, RECHENWERK.y + 94);
  noStroke();
  fill(...FARBE.text);
  textFont(MONO);
  textStyle(BOLD);
  textSize(13);
  textAlign(CENTER, CENTER);
  text(b && rechenAktiv && (b.name === "ADD" || b.name === "SUB") ? (b.name === "ADD" ? "+" : "−") : "ALU", RECHENWERK.x + 226, RECHENWERK.y + 60);
  textStyle(NORMAL);
  if (fokus === "rathaus") {
    noFill();
    stroke(...FARBE.flaeche, 220, 90);
    strokeWeight(4);
    rect(r.x - 8, r.y - 28, r.w + 16, r.h + 34, 8);
  }
}

function raum(r, name, aktiv, fokus) {
  fill(...(aktiv ? hell(FARBE.senf, 0.8) : FARBE.flaeche));
  stroke(...(fokus ? [230, 180, 40] : FARBE.linie));
  strokeWeight(fokus ? 3 : 1);
  rect(r.x, r.y, r.w, r.h, 6);
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(12);
  textAlign(LEFT, TOP);
  text(name, r.x + 8, r.y + 6);
  textStyle(NORMAL);
}

// kleine Figur: Bürgermeisterin (mit Amtskette) oder Rechenmeister (mit Brille)
function person(x, y, farbe, kette, aktiv) {
  const wippen = aktiv ? Math.sin(millis() / 140) * 2 : 0;
  noStroke();
  fill(...farbe);
  rect(x - 14, y - 30 + wippen, 28, 34, 10, 10, 4, 4);
  fill(240, 210, 180);
  circle(x, y - 42 + wippen, 24);
  fill(...FARBE.text);
  circle(x - 4, y - 43 + wippen, 3);
  circle(x + 4, y - 43 + wippen, 3);
  if (kette) {
    noFill();
    stroke(220, 180, 50);
    strokeWeight(2);
    arc(x, y - 28 + wippen, 20, 16, 0, PI);
    noStroke();
    fill(220, 180, 50);
    circle(x, y - 20 + wippen, 6);
  } else {
    noFill();
    stroke(...FARBE.text);
    strokeWeight(1.2);
    circle(x - 5, y - 43 + wippen, 8);
    circle(x + 5, y - 43 + wippen, 8);
  }
  noStroke();
  if (aktiv) {
    noStroke();
    fill(255, 200, 60);
    textFont(SCHRIFT);
    textSize(14);
    textAlign(CENTER, CENTER);
    text("!", x + 16, y - 56 + wippen);
  }
}

function tafel(x, y, w, titel, wert, farbe, fokus, unten) {
  noStroke();
  fill(...(fokus ? hell(FARBE.senf, 0.72) : FARBE.flaeche2));
  stroke(...(fokus ? [230, 180, 40] : hell(farbe, 0.5)));
  strokeWeight(fokus ? 2.5 : 1.5);
  rect(x, y, w, 76, 5);
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(10);
  textAlign(CENTER, TOP);
  text(titel, x + w / 2, y + 5);
  fill(...farbe);
  textFont(MONO);
  textStyle(BOLD);
  textSize(20);
  text(wert, x + w / 2, y + 20);
  textStyle(NORMAL);
  if (unten) {
    fill(...FARBE.grau);
    textSize(10.5);
    text(unten, x + w / 2, y + 52);
  }
}

// Speichergebäude mit nummerierten Fenstern (Wohnungen)
function zeichneSpeicherGebaeude(g, name, untertitel, s, art, farbe, reihen, fokus) {
  const gross = g.w > 400;
  noStroke();
  fill(...farbe);
  rect(g.x, g.y, g.w, 30, 6, 6, 0, 0);
  fill(255);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(13);
  textAlign(CENTER, CENTER);
  text(name, g.x + g.w / 2, g.y + 11);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(9.5);
  text(untertitel, g.x + g.w / 2, g.y + 23);
  fill(...FARBE.flaeche2);
  rect(g.x, g.y + 30, g.w, g.h - 30, 0, 0, 6, 6);
  const spalten = 16 / reihen;
  const fw = (g.w - 16) / spalten;
  const fh = (g.h - 40) / reihen;
  const speicher = s ? (art === "prog" ? s.prog : art === "daten" ? s.daten : s.mem) : null;
  for (let i = 0; i < 16; i++) {
    const fx = g.x + 8 + (i % spalten) * fw;
    const fy = g.y + 35 + Math.floor(i / spalten) * fh;
    let licht = [215, 222, 232];
    if (s && s.lesen && s.lesen.adr === i && s.lesen.speicher === art) {
      licht = hell(ROLLE[s.lesen.art], 0.35);
    }
    if (s && s.schreiben && s.schreiben.adr === i && s.schreiben.speicher === art) {
      licht = hell(ROLLE.schreiben, 0.35);
    }
    if (s && s.fahrtenListe.length === 2 && art === "prog" && s.fahrtenListe[1].adresse === i) {
      licht = hell(ROLLE.befehl, 0.35);
    }
    fill(...licht);
    stroke(150, 144, 134);
    strokeWeight(1);
    rect(fx + 3, fy + 3, fw - 6, fh - 6, 3);
    noStroke();
    fill(...FARBE.text);
    textFont(MONO);
    textStyle(BOLD);
    textSize(gross ? 13 : 11);
    textAlign(CENTER, TOP);
    text(String(i), fx + fw / 2, fy + 7);
    textStyle(NORMAL);
    if (speicher) {
      fill(...FARBE.grau);
      textSize(gross ? 11 : 9.5);
      text(hex2(speicher[i]).slice(2), fx + fw / 2, fy + (gross ? 26 : 24));
    }
    // Befehlszähler-Pfeil
    if (s && art !== "daten" && s.pc === i && s.phase !== "halt" && s.phase !== "fehler") {
      fill(...FARBE.akzent);
      triangle(fx + fw / 2 - 6, fy - 2, fx + fw / 2 + 6, fy - 2, fx + fw / 2, fy + 5);
    }
  }
  if (fokus) {
    noFill();
    stroke(...FARBE.flaeche, 220, 90);
    strokeWeight(4);
    rect(g.x - 4, g.y - 4, g.w + 8, g.h + 8, 8);
  }
}

// Stadttor: "ein" = Eingangstor mit Sensor, "aus" = Ausgangstor mit Monitor
function zeichneTor(t, art, s, fokus) {
  noStroke();
  fill(120, 110, 96);
  // Zinnen
  const zb = (t.w - 8) / 5;
  for (let i = 0; i < 5; i++) {
    rect(t.x + 4 + i * zb + 2, t.y - 10, zb - 6, 12, 2, 2, 0, 0);
  }
  rect(t.x, t.y, t.w, t.h, 4);
  fill(...FARBE.flaeche2);
  rect(t.x + 6, t.y + 24, t.w - 12, t.h - 30, 4);
  fill(255);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(12);
  textAlign(CENTER, CENTER);
  text(art === "ein" ? "Eingangstor" : "Ausgangstor", t.x + t.w / 2, t.y + 12);
  textStyle(NORMAL);
  const cx = t.x + t.w / 2;
  textFont(SCHRIFT);
  if (art === "ein") {
    const ein = s ? s.eingaben : aktBeispiel().eingaben;
    fill(...FARBE.text);
    rect(cx - 32, t.y + 36, 64, 34, 4);
    fill(120, 230, 140);
    textFont(MONO);
    textSize(13);
    textAlign(CENTER, CENTER);
    text(ein && ein.length ? String(ein[0]) : "--", cx, t.y + 53);
    fill(...FARBE.grau);
    textFont(SCHRIFT);
    textSize(11);
    text("Sensor", cx, t.y + 84);
    textSize(10);
    fill(...FARBE.blass);
    if (ein && ein.length > 1) {
      text(`dann: ${ein.slice(1).join(", ")}`, cx, t.y + 102);
    }
    text("Messwerte kommen", cx, t.y + 124);
    text("von außen herein", cx, t.y + 138);
  } else {
    const aus = s ? s.ausgabe : [];
    fill(30, 40, 50);
    rect(cx - 37, t.y + 32, 74, 46, 4);
    fill(...FARBE.grau);
    rect(cx - 7, t.y + 78, 14, 8);
    fill(160, 210, 255);
    textFont(MONO);
    textSize(14);
    textAlign(CENTER, CENTER);
    text(aus.length ? String(aus[aus.length - 1]) : "", cx, t.y + 55);
    fill(...FARBE.grau);
    textFont(SCHRIFT);
    textSize(11);
    text("Monitor", cx, t.y + 98);
    textSize(10);
    fill(...FARBE.blass);
    if (aus.length > 1) {
      text(`bisher: ${aus.slice(-4).join(", ")}`, cx, t.y + 116);
    }
    text("Ergebnisse gehen", cx, t.y + 134);
    text("nach außen", cx, t.y + 148);
  }
  // Pfeil zur bzw. von der Außenwelt
  stroke(...FARBE.flaeche, 255, 255, 210);
  strokeWeight(2.5);
  const y = BUS_Y.daten;
  const x1 = art === "ein" ? P_STADT.x + 14 : t.x + t.w + 2;
  const x2 = art === "ein" ? t.x - 2 : P_STADT.x + P_STADT.w - 14;
  line(x1, y, x2, y);
  line(x2, y, x2 - 6, y - 5);
  line(x2, y, x2 - 6, y + 5);
  noStroke();
  if (fokus) {
    noFill();
    stroke(...FARBE.flaeche, 220, 90);
    strokeWeight(4);
    rect(t.x - 4, t.y - 14, t.w + 8, t.h + 18, 8);
  }
}

// Weg des Lieferwagens: Punkte vom Rathaus zum Ziel
function weg(f, harvard) {
  const unten = RATHAUS.y + RATHAUS.h;
  const yBus = BUS_Y.daten;
  if (harvard && f.strasse === "befehl") {
    return [[X_CPU, unten + 4], [X_CPU, PROG_GEB.y - 6]];
  }
  const x0 = harvard ? X_DATEN : X_CPU;
  const start = [[x0, unten + 4], [x0, yBus]];
  if (f.ziel === "sensor") {
    return start.concat([[EIN_TOR.x + EIN_TOR.w + 6, yBus]]);
  }
  if (f.ziel === "monitor") {
    return start.concat([[AUS_TOR.x - 6, yBus]]);
  }
  const geb = harvard ? DATEN_GEB : RAM_GEB;
  return start.concat([[X_DATEN, yBus], [X_DATEN, geb.y - 6]]);
}

function punktAufWeg(pkte, t) {
  const laengen = [];
  let gesamt = 0;
  for (let i = 0; i < pkte.length - 1; i++) {
    const l = dist(pkte[i][0], pkte[i][1], pkte[i + 1][0], pkte[i + 1][1]);
    laengen.push(l);
    gesamt += l;
  }
  let rest = t * gesamt;
  for (let i = 0; i < laengen.length; i++) {
    if (rest <= laengen[i] || i === laengen.length - 1) {
      const u = laengen[i] ? rest / laengen[i] : 0;
      return [lerp(pkte[i][0], pkte[i + 1][0], u), lerp(pkte[i][1], pkte[i + 1][1], u)];
    }
    rest -= laengen[i];
  }
  return pkte[pkte.length - 1];
}

function zeichneLieferwagen(f, harvard) {
  const t = constrain((millis() - animT0) / animDauer(), 0, 1);
  const pkte = weg(f, harvard);
  // hin (0 … 0,5) und zurück (0,5 … 1)
  const hin = t < 0.5;
  const u = weich(hin ? t * 2 : (1 - t) * 2);
  const [x, y] = punktAufWeg(pkte, u);
  // Fahrtrichtung aus einem Punkt kurz davor bzw. danach
  const u2 = hin ? Math.min(1, u + 0.02) : Math.max(0, u - 0.02);
  let [x2, y2] = punktAufWeg(pkte, u2);
  let dx = x2 - x;
  let dy = y2 - y;
  if (Math.abs(dx) + Math.abs(dy) < 0.01) {
    const v = punktAufWeg(pkte, hin ? Math.max(0, u - 0.02) : Math.min(1, u + 0.02));
    dx = x - v[0];
    dy = y - v[1];
  }
  let schild;
  let farbe;
  if (f.art === "befehl") {
    farbe = ROLLE.befehl;
    schild = hin ? `Adr ${f.adresse}` : `${hex2(f.inhalt)} = ${dekodiere(f.inhalt).text}`;
  } else if (f.art === "daten") {
    farbe = ROLLE.daten;
    schild = hin ? `Adr ${f.adresse}` : `Zahl ${f.inhalt}`;
  } else if (f.art === "schreiben") {
    farbe = ROLLE.schreiben;
    schild = hin ? `${f.inhalt} → Adr ${f.adresse}` : "leer";
  } else {
    farbe = FARBE.gruen;
    schild = f.ziel === "sensor" ? (hin ? "holen" : `Messwert ${f.inhalt}`) : hin ? `${f.inhalt} → Monitor` : "leer";
  }
  push();
  translate(x, y);
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx < 0) {
      scale(-1, 1);
    }
  } else {
    rotate(dy > 0 ? HALF_PI : -HALF_PI);
  }
  noStroke();
  fill(...farbe);
  rect(-22, -12, 32, 22, 3);
  fill(240);
  rect(10, -8, 14, 18, 2, 6, 6, 2);
  fill(160, 200, 230);
  rect(14, -6, 8, 7, 2);
  fill(40);
  circle(-14, 11, 9);
  circle(14, 11, 9);
  pop();
  // Schild neben dem Wagen
  textFont(MONO);
  textSize(11);
  const b = textWidth(schild) + 12;
  noStroke();
  fill(...FARBE.flaeche, 255, 255, 240);
  stroke(...farbe);
  strokeWeight(1.5);
  rect(x - b / 2, y - 40, b, 18, 4);
  noStroke();
  fill(...farbe);
  textAlign(CENTER, CENTER);
  text(schild, x, y - 31);
}

function zeichneFokusRahmen(id) {
  // Hinweisfähnchen für die Stadtführung
  const pos = {
    steuerwerk: [[STEUERWERK.x + STEUERWERK.w / 2, STEUERWERK.y - 2]],
    rechenwerk: [[RECHENWERK.x + RECHENWERK.w / 2, RECHENWERK.y - 2]],
    register: [[STEUERWERK.x + 160, STEUERWERK.y + 24]],
    ram: [[RAM_GEB.x + RAM_GEB.w / 2, RAM_GEB.y - 2]],
    bus: [[RATHAUS.x + RATHAUS.w / 2, STRASSE.y - 2]],
    ea: [
      [EIN_TOR.x + EIN_TOR.w / 2, EIN_TOR.y - 14],
      [AUS_TOR.x + AUS_TOR.w / 2, AUS_TOR.y - 14],
    ],
  }[id];
  if (!pos) {
    return;
  }
  const huepf = Math.sin(millis() / 200) * 4;
  noStroke();
  fill(...FARBE.flaeche, 210, 60);
  for (const pt of pos) {
    triangle(pt[0] - 9, pt[1] - 18 + huepf, pt[0] + 9, pt[1] - 18 + huepf, pt[0], pt[1] - 4 + huepf);
  }
}

// =============================================================================
// Speicheransicht (unten)
// =============================================================================
function zeichneSpeicher() {
  const p = P_RAM;
  const harvard = aktArch() === "harvard";
  p.titel = harvard ? "Harvard: Programmspeicher und Datenspeicher sind getrennt" : "Arbeitsspeicher: EIN Speicher für Befehle und Daten";
  panel(p);
  const s = aktSchritt();
  if (!s) {
    return;
  }
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(11);
  textAlign(RIGHT, CENTER);
  text(
    harvard ? "Befehle können nicht als Daten gelesen oder überschrieben werden" : "Jede Zelle ist nur ein Bitmuster – ob Befehl oder Zahl, entscheidet allein der Befehlszähler",
    p.x + p.w - 16,
    p.y + KOPF_H / 2 + 1
  );
  if (harvard) {
    zeichneZellenReihe(p.x + 14, p.y + KOPF_H + 10, p.w - 28, 92, s.prog, s, "prog", "Programmspeicher (nur Befehle)");
    zeichneZellenReihe(p.x + 14, p.y + KOPF_H + 112, p.w - 28, 92, s.daten, s, "daten", "Datenspeicher (nur Zahlen)");
    return;
  }
  zeichneZellenReihe(p.x + 14, p.y + KOPF_H + 10, p.w - 28, 96, s.mem.slice(0, 8), s, "ram", null, 0);
  zeichneZellenReihe(p.x + 14, p.y + KOPF_H + 108, p.w - 28, 96, s.mem.slice(8), s, "ram", null, 8);
}

// Zellen nebeneinander: Adresse, Hex, Binär, Deutung als Befehl und als Zahl
function zeichneZellenReihe(x, y, b, h, werte, s, art, titel, versatz) {
  const harvard = art !== "ram";
  const n = werte.length;
  const labelB = harvard ? 104 : 0;
  const zb = (b - labelB) / n;
  if (titel) {
    noStroke();
    fill(...(art === "prog" ? ROLLE.befehl : ROLLE.daten));
    textFont(SCHRIFT);
    textStyle(BOLD);
    textSize(10.5);
    textAlign(LEFT, CENTER);
    const zeilen = umbrechen(titel, labelB - 6);
    zeilen.forEach((zl, i) => text(zl, x, y + h / 2 - (zeilen.length - 1) * 7 + i * 14));
    textStyle(NORMAL);
  }
  for (let i = 0; i < n; i++) {
    const adr = (versatz || 0) + i;
    const v = werte[i];
    const zx = x + labelB + i * zb;
    let rahmen = FARBE.linie;
    let fuell = FARBE.flaeche;
    if (s.lesen && s.lesen.adr === adr && s.lesen.speicher === art) {
      fuell = hell(ROLLE[s.lesen.art], 0.8);
      rahmen = ROLLE[s.lesen.art];
    }
    if (s.schreiben && s.schreiben.adr === adr && s.schreiben.speicher === art) {
      fuell = hell(ROLLE.schreiben, 0.82);
      rahmen = ROLLE.schreiben;
    }
    stroke(...rahmen);
    strokeWeight(rahmen === FARBE.linie ? 1 : 2.5);
    fill(...fuell);
    rect(zx + 2, y, zb - 4, h, 5);
    noStroke();
    // Befehlszähler
    if (art !== "daten" && s.pc === adr && s.phase !== "halt" && s.phase !== "fehler") {
      fill(...FARBE.akzent);
      rect(zx + 2, y, zb - 4, 4, 5, 5, 0, 0);
      textFont(SCHRIFT);
      textSize(9);
      textAlign(RIGHT, TOP);
      text("PC", zx + zb - 6, y + 6);
    }
    fill(...FARBE.blass);
    textFont(MONO);
    textSize(harvard ? 9.5 : 10.5);
    textAlign(LEFT, TOP);
    text(`${harvard ? (art === "prog" ? "P" : "D") : "Zelle "}${adr}`, zx + 7, y + 5);
    fill(...FARBE.text);
    textStyle(BOLD);
    textSize(harvard ? 14 : 17);
    textAlign(CENTER, TOP);
    text(hex2(v), zx + zb / 2, y + (harvard ? 20 : 22));
    textStyle(NORMAL);
    if (!harvard) {
      fill(...FARBE.blass);
      textSize(10);
      text(bin8(v), zx + zb / 2, y + 44);
    }
    const d = dekodiere(v);
    textSize(harvard ? 9.5 : 11);
    if (art !== "daten") {
      fill(...ROLLE.befehl);
      text(d.name ? d.text : "ungültig", zx + zb / 2, y + (harvard ? 46 : 62));
    }
    if (art !== "prog") {
      fill(...ROLLE.daten);
      text(`Zahl ${v}`, zx + zb / 2, y + (harvard ? 46 : 78));
    }
    // schon als Befehl bzw. als Zahl benutzt
    if (art === "ram") {
      if (s.alsBefehl.has(adr)) {
        fill(...ROLLE.befehl);
        circle(zx + zb - 12, y + h - 10, 7);
      }
      if (s.alsDaten.has(adr)) {
        fill(...ROLLE.daten);
        circle(zx + zb - 22, y + h - 10, 7);
      }
    }
  }
}

// =============================================================================
// Rathaus-Protokoll (rechts oben)
// =============================================================================
function zeichneProtokoll() {
  const p = P_ERKL;
  p.titel = stufe === 0 && modus === "ueben" ? "Stadtführung" : modus === "pruefung" ? "Prüfung" : "Rathaus-Protokoll";
  panel(p);
  const x = p.x + 20;
  let y = p.y + KOPF_H + 14;
  const b = p.w - 40;
  if (modus === "pruefung") {
    zeichnePruefungsInfo(x, y, b);
    return;
  }
  if (stufe === 0) {
    const f = FUEHRUNG[fuehrungIdx];
    noStroke();
    fill(...FARBE.blass);
    textFont(SCHRIFT);
    textSize(12);
    textAlign(LEFT, TOP);
    text(`Station ${fuehrungIdx + 1} von ${FUEHRUNG.length}`, x, y);
    y += 22;
    y += absatz(f.titel, x, y, b, 20, FARBE.text, true) + 10;
    absatz(f.text, x, y, b, 15, FARBE.text);
    return;
  }
  const s = aktSchritt();
  // Phasen
  const phasen = [
    ["holen", "1 Holen"],
    ["entschluesseln", "2 Entschlüsseln"],
    ["ausfuehren", "3 Ausführen"],
  ];
  let px = x;
  for (const [id, name] of phasen) {
    const aktiv = s && s.phase === id;
    textFont(SCHRIFT);
    textStyle(BOLD);
    textSize(13);
    const w = textWidth(name) + 26;
    noStroke();
    fill(...(aktiv ? FARBE.akzent : FARBE.flaeche2));
    rect(px, y, w, 28, 14);
    fill(...(aktiv ? [255, 255, 255] : FARBE.grau));
    textAlign(CENTER, CENTER);
    text(name, px + w / 2, y + 14);
    textStyle(NORMAL);
    px += w + 8;
  }
  if (s && (s.phase === "halt" || s.phase === "fehler")) {
    noStroke();
    fill(...(s.phase === "halt" ? FARBE.gruen : FARBE.akzent));
    textFont(TITEL);
    textStyle(BOLD);
    textSize(14);
    textAlign(LEFT, CENTER);
    text(s.phase === "halt" ? "■ beendet" : "✗ Absturz", px + 6, y + 14);
    textStyle(NORMAL);
  }
  y += 42;
  // Zähler
  const harvard = aktArch() === "harvard";
  const zaehler = [
    ["Takte", s ? s.takte : 0],
    ["Fahrten", s ? s.fahrten : 0],
    ["Befehle", s ? s.befehle : 0],
    ["Monitor", s && s.ausgabe.length ? s.ausgabe.join(", ") : "–"],
  ];
  const zb = b / zaehler.length;
  zaehler.forEach(([name, wert], i) => {
    noStroke();
    fill(...FARBE.flaeche2);
    rect(x + i * zb, y, zb - 8, 50, 6);
    fill(...FARBE.blass);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(LEFT, TOP);
    text(name, x + i * zb + 10, y + 6);
    fill(...FARBE.text);
    textFont(MONO);
    textStyle(BOLD);
    textSize(18);
    textAlign(LEFT, BOTTOM);
    let t = String(wert);
    while (textWidth(t) > zb - 26 && t.length > 2) {
      t = "…" + t.slice(2);
    }
    text(t, x + i * zb + 10, y + 46);
    textStyle(NORMAL);
  });
  y += 64;
  if (s) {
    y += absatz(s.text, x, y, b, 14.5, FARBE.text, false, 6) + 10;
  }
  // Vergleich beider Architekturen (Stufe 5)
  if (STUFEN[stufe].id === "harvard") {
    const vn = simuliere(aktBeispiel(), "neumann");
    const hv = simuliere(aktBeispiel(), "harvard");
    const yy = p.y + p.h - 58;
    noStroke();
    fill(...hell(FARBE.blau, 0.9));
    rect(x, yy, b, 44, 6);
    fill(...FARBE.text);
    textFont(SCHRIFT);
    textSize(13);
    textAlign(LEFT, CENTER);
    text(`Dieses Programm: von Neumann ${vn.takte} Takte · Harvard ${hv.takte} Takte`, x + 12, yy + 14);
    fill(...FARBE.grau);
    textSize(12);
    const unterschied = vn.ausgabe.join(",") !== hv.ausgabe.join(",") || vn.akku !== hv.akku || vn.ende !== hv.ende;
    text(unterschied ? "Achtung: Die Ergebnisse unterscheiden sich! Vergleiche Speicher und Monitor." : "Beide liefern dasselbe Ergebnis – Harvard nur schneller.", x + 12, yy + 31);
  } else if (!harvard) {
    noStroke();
    fill(...FARBE.blass);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(LEFT, BOTTOM);
    text("Vereinfachtes Modell: 1 Takt = 1 Fahrt auf der Straße. Entschlüsseln und Rechnen im Rathaus zählen wir nicht.", x, p.y + p.h - 12);
  }
}

function zeichnePruefungsInfo(x, y, b) {
  y += absatz(`Freigabeprüfung · ${STUFEN[stufe].rang}`, x, y, b, 18, FARBE.text, true) + 8;
  absatz(`Beantworte die Fragen rechts unten. ${SERIE_ZIEL} richtige Antworten in Folge ergeben das Prüfsiegel. Stadt und Speicher zeigen das Programm, um das es geht.`, x, y, b, 13, FARBE.grau);
  y += 54;
  // Serie: Häuser mit Licht
  const abstand = Math.min(90, b / SERIE_ZIEL);
  for (let i = 0; i < SERIE_ZIEL; i++) {
    const hx = x + i * abstand + 10;
    const an = i < serie;
    noStroke();
    fill(...(an ? FARBE.akzent : FARBE.neutral));
    triangle(hx - 4, y + 16, hx + 26, y, hx + 56, y + 16);
    fill(...(an ? [250, 246, 236] : FARBE.flaeche2));
    rect(hx, y + 16, 52, 36, 2);
    fill(...(an ? [255, 214, 90] : FARBE.neutral));
    rect(hx + 8, y + 24, 14, 12, 2);
    rect(hx + 30, y + 24, 14, 12, 2);
  }
  y += 62;
  noStroke();
  fill(...FARBE.grau);
  textFont(MONO);
  textSize(12);
  textAlign(LEFT, TOP);
  text(`${serie} / ${SERIE_ZIEL} in Folge`, x, y);
  y += 26;
  if (rueckmeldung) {
    const farbe = rueckmeldung.ok ? FARBE.gruen : FARBE.akzent;
    textFont(SCHRIFT);
    textSize(13);
    const zeilen = umbrechen(aufgabe.erklaerung || "", b - 24);
    const hBox = 34 + zeilen.length * 18 + 10;
    noStroke();
    fill(...hell(farbe, 0.88));
    rect(x, y, b, hBox, 8);
    fill(...farbe);
    textStyle(BOLD);
    textSize(14);
    textAlign(LEFT, TOP);
    text((rueckmeldung.ok ? "✓ " : "✗ ") + rueckmeldung.text, x + 12, y + 10);
    textStyle(NORMAL);
    absatz(aufgabe.erklaerung || "", x + 12, y + 34, b - 24, 13, FARBE.text);
  }
  if (aufloesung) {
    const s = aktSchritt();
    if (s) {
      absatz(s.text, x, P_ERKL.y + P_ERKL.h - 66, b, 12.5, FARBE.grau, false, 3);
    }
  }
}

// =============================================================================
// Steuerung (rechts unten)
// =============================================================================
function zeichneSteuerung() {
  const p = P_STEUER;
  p.titel = modus === "pruefung" ? "Frage" : stufe === 0 ? "Stadtführung" : "Steuerung";
  panel(p);
  const x = p.x + 18;
  const b = p.w - 36;
  const y = p.y + KOPF_H + 12;
  mcRechtecke = [];
  if (modus === "pruefung") {
    if (!aufgabe) {
      return;
    }
    const h = absatz(aufgabe.frage, x, y, b, 14, FARBE.text, true, 6);
    if (aufgabe.art === "mc") {
      let yy = Math.max(y + h + 10, p.y + 140);
      aufgabe.optionen.forEach((o, i) => {
        textFont(SCHRIFT);
        textSize(12.5);
        const zeilen = umbrechen(o, b - 40);
        const bh = Math.max(36, zeilen.length * 16 + 14);
        const r = { x, y: yy, w: b, h: bh };
        mcRechtecke.push(r);
        const hover = !rueckmeldung && inRechteck(mausPos(), r);
        let fuell = hover ? hell(FARBE.akzent, 0.92) : FARBE.flaeche2;
        let rahmen = hover ? FARBE.akzent : FARBE.linie;
        if (rueckmeldung) {
          if (i === aufgabe.richtig) {
            fuell = hell(FARBE.gruen, 0.82);
            rahmen = FARBE.gruen;
          } else if (i === antwortIdx) {
            fuell = hell(FARBE.akzent, 0.85);
            rahmen = FARBE.akzent;
          }
        }
        fill(...fuell);
        stroke(...rahmen);
        strokeWeight(1.5);
        rect(r.x, r.y, r.w, r.h, 8);
        noStroke();
        fill(...FARBE.grau);
        textFont(MONO);
        textStyle(BOLD);
        textSize(12);
        textAlign(LEFT, TOP);
        text("ABCD"[i], r.x + 10, r.y + 8);
        textStyle(NORMAL);
        fill(...FARBE.text);
        textFont(SCHRIFT);
        textSize(12.5);
        zeilen.forEach((zl, j) => text(zl, r.x + 30, r.y + 8 + j * 16));
        yy += bh + 6;
      });
    }
    return;
  }
  if (stufe === 0) {
    absatz(STUFEN[0].auftrag, x, y, b, 13, FARBE.grau);
    // Stationen-Liste
    let yy = y + 60;
    FUEHRUNG.forEach((f, i) => {
      noStroke();
      fill(...(i === fuehrungIdx ? FARBE.akzent : FARBE.grau));
      textFont(SCHRIFT);
      textStyle(i === fuehrungIdx ? BOLD : NORMAL);
      textSize(12.5);
      textAlign(LEFT, TOP);
      text(`${i + 1}. ${f.titel}`, x, yy);
      textStyle(NORMAL);
      yy += 20;
    });
    return;
  }
  if (STUFEN[stufe].ansicht === "gpu") {
    noStroke();
    fill(...FARBE.grau);
    textFont(SCHRIFT);
    textSize(12);
    textAlign(LEFT, BOTTOM);
    text("Aufgabe", x, p.y + 58);
    absatz(GPU_AUFGABEN[gpuAufgabe].text, x, p.y + 124, b, 13, FARBE.text);
    return;
  }
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text("Beispielprogramm", x, p.y + 58);
  if (STUFEN[stufe].id === "harvard") {
    text("Stadt (Architektur)", x, p.y + 116);
  }
  absatz(aktBeispiel().text, x, p.y + (STUFEN[stufe].id === "harvard" ? 180 : 124), b, 13, FARBE.text, false, 6);
}

// =============================================================================
// GPU-Vergleich
// =============================================================================
function zeichneGpuStadt() {
  const p = P_STADT;
  p.titel = "Rathaus (CPU) gegen Fabrikhalle (GPU)";
  panel(p);
  noStroke();
  fill(...FARBE.platine);
  rect(p.x + 10, p.y + KOPF_H + 6, p.w - 20, p.h - KOPF_H - 16, 8);
  const a = GPU_AUFGABEN[gpuAufgabe];
  // --- CPU-Rathaus ---
  const cx = p.x + 40;
  const cy = p.y + 90;
  fill(...FARBE.akzent);
  triangle(cx - 6, cy + 18, cx + 165, cy - 26, cx + 336, cy + 18);
  fill(...FARBE.flaeche);
  rect(cx, cy + 14, 330, 390, 4);
  fill(255);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(CENTER, CENTER);
  text("CPU · Rathaus", cx + 165, cy + 2);
  textStyle(NORMAL);
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(12);
  text(`${CPU_DATEN.kerne} Rechenmeister (Kerne) · ${CPU_DATEN.ghz.toFixed(1).replace(".", ",")} GHz`, cx + 165, cy + 32);
  for (let i = 0; i < CPU_DATEN.kerne; i++) {
    const kx = cx + 30 + (i % 2) * 150;
    const ky = cy + 70 + Math.floor(i / 2) * 160;
    const arbeitet = kernArbeitet(CPU_DATEN, i);
    fill(...(arbeitet ? hell(FARBE.senf, 0.8) : FARBE.flaeche));
    stroke(...FARBE.linie);
    strokeWeight(1);
    rect(kx, ky, 130, 140, 6);
    noStroke();
    person(kx + 65, ky + 96, [184, 122, 28], false, arbeitet);
    fill(...FARBE.grau);
    textFont(SCHRIFT);
    textSize(11);
    textAlign(CENTER, TOP);
    text(`Kern ${i + 1}`, kx + 65, ky + 108);
    if ((a.abhaengig && i > 0) || (!a.abhaengig && i >= a.n)) {
      fill(...FARBE.blass);
      textSize(10);
      text(a.abhaengig ? "wartet …" : "nichts zu tun", kx + 65, ky + 122);
    }
  }
  // --- GPU-Fabrik ---
  const gx = p.x + 420;
  const gy = p.y + 90;
  fill(90, 96, 104);
  rect(gx, gy - 10, 440, 24, 4, 4, 0, 0);
  // Sheddach
  for (let i = 0; i < 8; i++) {
    fill(110, 116, 124);
    triangle(gx + i * 55, gy - 10, gx + i * 55 + 55, gy - 10, gx + i * 55 + 55, gy - 34);
  }
  fill(236, 238, 240);
  rect(gx, gy + 14, 440, 390, 0, 0, 4, 4);
  fill(255);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(CENTER, CENTER);
  text("GPU · Fabrikhalle", gx + 220, gy + 2);
  textStyle(NORMAL);
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(12);
  text(`${GPU_DATEN.kerne} einfache Arbeiter (Kerne) · ${GPU_DATEN.ghz.toFixed(1).replace(".", ",")} GHz`, gx + 220, gy + 32);
  for (let i = 0; i < GPU_DATEN.kerne; i++) {
    const wx = gx + 34 + (i % 8) * 52;
    const wy = gy + 76 + Math.floor(i / 8) * 40;
    const arbeitet = kernArbeitet(GPU_DATEN, i);
    noStroke();
    fill(...(arbeitet ? [44, 92, 150] : [150, 160, 172]));
    rect(wx - 8, wy - 2, 16, 16, 4);
    fill(240, 210, 180);
    circle(wx, wy - 8, 12);
    if (arbeitet) {
      fill(...FARBE.flaeche, 214, 90);
      rect(wx + 9, wy + 2, 8, 8, 1);
    }
  }
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(11);
  textAlign(CENTER, TOP);
  text("Echte Grafikkarten haben tausende solcher Kerne.", gx + 220, gy + 410 - 22);
}

function zeichneGpuRaster() {
  const p = P_RAM;
  const a = GPU_AUFGABEN[gpuAufgabe];
  p.titel = `Aufgabe: ${a.name} – ${a.abhaengig ? "abhängige Schritte" : "unabhängige Teilaufgaben"}`;
  panel(p);
  const seiten = [
    ["CPU", CPU_DATEN, FARBE.senf],
    ["GPU", GPU_DATEN, FARBE.blau],
  ];
  seiten.forEach(([name, daten, farbe], k) => {
    const x0 = p.x + 20 + k * 440;
    const y0 = p.y + KOPF_H + 12;
    const fertig = gpuFortschritt(daten);
    const spalten = a.n === 64 ? 16 : 16;
    const reihen = Math.ceil(a.n / spalten);
    const zb = 24;
    noStroke();
    fill(...farbe);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(14);
    textAlign(LEFT, TOP);
    text(`${name}: ${fertig} von ${a.n} erledigt`, x0, y0);
    textStyle(NORMAL);
    for (let i = 0; i < a.n; i++) {
      const cx = x0 + (i % spalten) * zb;
      const cy = y0 + 26 + Math.floor(i / spalten) * zb;
      fill(...(i < fertig ? farbe : FARBE.flaeche2));
      rect(cx, cy, zb - 3, zb - 3, 3);
      if (a.abhaengig && i > 0 && i < a.n) {
        stroke(...(i < fertig ? farbe : FARBE.neutral));
        strokeWeight(1.5);
        line(cx - 3, cy + (zb - 3) / 2, cx, cy + (zb - 3) / 2);
        noStroke();
      }
    }
    const yInfo = y0 + 30 + reihen * zb + 8;
    const takteGesamt = gpuTakteGesamt(daten);
    const zeit = takteGesamt / daten.ghz;
    fill(...FARBE.grau);
    textFont(SCHRIFT);
    textSize(12.5);
    textAlign(LEFT, TOP);
    if (fertig >= a.n) {
      fill(...FARBE.text);
      textStyle(BOLD);
      text(`fertig nach ${takteGesamt} Takten = ${zeitText(zeit)}`, x0, yInfo);
      textStyle(NORMAL);
    } else {
      text(`${takteBisher(daten)} von ${takteGesamt} Takten geschafft …`, x0, yInfo);
    }
  });
}

function zeitText(ns) {
  return `${(Math.round(ns * 100) / 100).toString().replace(".", ",")} ns`;
}

function zeichneGpuProtokoll() {
  const p = P_ERKL;
  p.titel = modus === "pruefung" ? "Prüfung" : "Vergleich";
  panel(p);
  const x = p.x + 20;
  let y = p.y + KOPF_H + 14;
  const b = p.w - 40;
  if (modus === "pruefung") {
    zeichnePruefungsInfo(x, y, b);
    return;
  }
  const a = GPU_AUFGABEN[gpuAufgabe];
  const tc = gpuTakteGesamt(CPU_DATEN);
  const tg = gpuTakteGesamt(GPU_DATEN);
  const zc = tc / CPU_DATEN.ghz;
  const zg = tg / GPU_DATEN.ghz;
  noStroke();
  fill(...FARBE.text);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(17);
  textAlign(LEFT, TOP);
  text(`Uhr: ${zeitText(gpuZeit())}`, x, y);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(12.5);
  fill(...FARBE.grau);
  textAlign(RIGHT, TOP);
  text(`CPU: Takt ${takteBisher(CPU_DATEN)} · GPU: Takt ${takteBisher(GPU_DATEN)}`, x + b, y + 3);
  y += 34;
  const zeilen = [
    ["", "CPU (Rathaus)", "GPU (Fabrik)"],
    ["Kerne", String(CPU_DATEN.kerne), String(GPU_DATEN.kerne)],
    ["Taktfrequenz", `${String(CPU_DATEN.ghz).replace(".", ",")} GHz`, `${String(GPU_DATEN.ghz).replace(".", ",")} GHz`],
    ["pro Takt erledigt", a.abhaengig ? "1 (warten!)" : String(Math.min(a.n, CPU_DATEN.kerne)), a.abhaengig ? "1 (warten!)" : String(Math.min(a.n, GPU_DATEN.kerne))],
    ["Takte gesamt", String(tc), String(tg)],
    ["Zeit = Takte : Frequenz", zeitText(zc), zeitText(zg)],
  ];
  zeilen.forEach((z, i) => {
    const zy = y + i * 30;
    if (i % 2 === 1) {
      fill(...FARBE.flaeche2);
      rect(x, zy - 4, b, 28, 4);
    }
    fill(...(i === 0 ? FARBE.grau : FARBE.text));
    textFont(i === 0 ? SCHRIFT : MONO);
    textStyle(i === 0 || i === 5 ? BOLD : NORMAL);
    textSize(13);
    textAlign(LEFT, TOP);
    textFont(SCHRIFT);
    text(z[0], x + 8, zy + 2);
    textFont(i === 0 ? SCHRIFT : MONO);
    textAlign(CENTER, TOP);
    text(z[1], x + b * 0.58, zy + 2);
    text(z[2], x + b * 0.85, zy + 2);
    textStyle(NORMAL);
  });
  y += zeilen.length * 30 + 12;
  const gewinner = zg < zc ? "GPU" : zg > zc ? "CPU" : "beide gleich";
  let txt;
  if (a.abhaengig) {
    txt = `Hier gewinnt die ${gewinner}: Jeder Schritt braucht das Ergebnis des vorigen, also kann immer nur ein Kern arbeiten. Die vielen GPU-Arbeiter warten – und der einzelne CPU-Kern ist schneller getaktet.`;
  } else if (gewinner === "CPU") {
    txt = `Hier gewinnt die CPU: Es gibt nur ${a.n} Teilaufgaben – ${GPU_DATEN.kerne - a.n} GPU-Arbeiter haben nichts zu tun. Beide brauchen gleich viele Takte, aber der CPU-Takt ist kürzer. In echt kommt noch dazu: Die Daten müssen erst über den Bus zur Grafikkarte und wieder zurück.`;
  } else {
    txt = `Hier gewinnt die ${gewinner}: Alle Teilaufgaben sind unabhängig, die ${GPU_DATEN.kerne} Arbeiter erledigen sie gleichzeitig. Deshalb rechnen Grafikkarten Bilder, Videos und KI-Modelle.`;
  }
  absatz(txt, x, y, b, 13.5, FARBE.text);
}

// =============================================================================
// Freigaben
// =============================================================================
function zeichneFreigaben() {
  const p = P_FREIGABE;
  panel(p);
  const x = p.x + 14;
  const y = p.y + KOPF_H + 12;
  STUFEN.forEach((st, i) => {
    const zy = y + i * 52;
    const ok = freigaben[i];
    if (ok) {
      noStroke();
      fill(...FARBE.akzent);
      circle(x + 12, zy + 14, 22);
      fill(255);
      textFont(SCHRIFT);
      textStyle(BOLD);
      textSize(12);
      textAlign(CENTER, CENTER);
      text("✓", x + 12, zy + 15);
      textStyle(NORMAL);
    } else {
      noFill();
      stroke(...FARBE.linie);
      strokeWeight(2);
      drawingContext.setLineDash([3, 3]);
      circle(x + 12, zy + 14, 22);
      drawingContext.setLineDash([]);
    }
    noStroke();
    fill(...(i === stufe ? FARBE.akzent : ok ? FARBE.text : FARBE.blass));
    textFont(SCHRIFT);
    textStyle(i === stufe ? BOLD : NORMAL);
    textSize(12.5);
    textAlign(LEFT, TOP);
    text(`${i + 1} · ${st.name}`, x + 30, zy + 2);
    textStyle(NORMAL);
    fill(...(ok ? FARBE.grau : FARBE.blass));
    textSize(11);
    text(st.rang, x + 30, zy + 19);
  });
  const anzahl = freigaben.filter((f) => f).length;
  noStroke();
  textFont(SCHRIFT);
  textSize(11);
  textAlign(LEFT, TOP);
  fill(...(anzahl === 6 ? FARBE.akzent : FARBE.blass));
  absatz(anzahl === 6 ? "Alle Freigaben: Bürgermeister der Platinenstadt!" : `${anzahl} von 6 Prüfsiegeln`, x, y + 6 * 52, p.w - 28, 11, anzahl === 6 ? FARBE.akzent : FARBE.blass);
}

function zeichneStempel() {
  if (!stempel) {
    return;
  }
  const t = millis() - stempel.t0;
  if (t > 3200) {
    stempel = null;
    return;
  }
  const p = P_STADT;
  const fall = 1 - weich(t / 300);
  const alpha = t > 2600 ? map(t, 2600, 3200, 255, 0) : 255;
  push();
  translate(p.x + p.w / 2, p.y + p.h / 2 + 10);
  rotate(-0.18);
  scale(1 + fall * 1.5);
  noStroke();
  fill(...FARBE.flaeche, 255, 255, alpha * 0.85);
  circle(0, 0, 250);
  noFill();
  stroke(...FARBE.akzent, alpha);
  strokeWeight(7);
  circle(0, 0, 250);
  strokeWeight(2.5);
  circle(0, 0, 222);
  noStroke();
  fill(...FARBE.akzent, alpha);
  textFont(TITEL);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(30);
  text("FREIGEGEBEN", 0, -8);
  textSize(16);
  text(STUFEN[stempel.stufe].rang.toUpperCase(), 0, 26);
  textSize(11);
  text("Platinenstadt · Laborserver", 0, 56);
  textStyle(NORMAL);
  pop();
}

function zeichneFehlerMeldung() {
  if (!fehlerMeldung || millis() - fehlerMeldung.t0 > 8000) {
    return;
  }
  noStroke();
  fill(...FARBE.akzent, 235);
  rect(24, 846, 900, 34, 8);
  fill(255);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(LEFT, CENTER);
  text("Interner Fehler (bitte neu laden): " + fehlerMeldung.text, 36, 863);
}
