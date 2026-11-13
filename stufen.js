// =============================================================================
//  stufen.js – Freigabestufen, Beispielprogramme, Stadtführung, Prüfungsfragen
// =============================================================================

const SERIE_ZIEL = 5;

// --- Beispielprogramme -------------------------------------------------------
//  programm: Zellen mit Befehlen, daten: Zellen mit Zahlen, eingaben: Messwerte
const BSP = {
  addieren: {
    name: "Zwei Messwerte addieren",
    text: "Zwei Messwerte vom Sensor holen, addieren, das Ergebnis speichern und ausgeben.",
    programm: { 0: "IN", 1: "STORE 15", 2: "IN", 3: "ADD 15", 4: "STORE 15", 5: "OUT", 6: "HALT" },
    daten: { 15: 0 },
    eingaben: [23, 19],
  },
  differenz: {
    name: "Differenz berechnen",
    text: "Zwei gespeicherte Werte voneinander abziehen und das Ergebnis speichern.",
    programm: { 0: "LOAD 12", 1: "SUB 13", 2: "STORE 14", 3: "OUT", 4: "HALT" },
    daten: { 12: 40, 13: 15, 14: 0 },
    eingaben: [],
  },
  richtig: {
    name: "Richtig: mit HALT",
    text: "70 + 22 rechnen und das Ergebnis in Zelle 6 speichern. Danach kommt HALT – die Daten in den Zellen dahinter werden nie als Befehl gelesen.",
    programm: { 0: "LOAD 4", 1: "ADD 5", 2: "STORE 6", 3: "HALT" },
    daten: { 4: 70, 5: 22, 6: 0 },
    eingaben: [],
  },
  ohneHalt: {
    name: "Fehler: HALT vergessen",
    text: "Dasselbe Programm, aber HALT fehlt – in Zelle 3 liegt noch ein alter Messwert (52). Der Befehlszähler läuft einfach weiter, mitten in die Daten hinein. Steht am Ende noch 92 in Zelle 6?",
    programm: { 0: "LOAD 4", 1: "ADD 5", 2: "STORE 6" },
    daten: { 3: 52, 4: 70, 5: 22, 6: 0 },
    eingaben: [],
  },
  ueberschreiben: {
    name: "Fehler: Programm überschreibt sich",
    text: "Der Wert 96 soll gesichert werden – aber STORE 3 trifft die Zelle, in der der Befehl HALT steht.",
    programm: { 0: "LOAD 6", 1: "STORE 3", 2: "OUT", 3: "HALT" },
    daten: { 6: 96 },
    eingaben: [],
  },
  summe: {
    name: "Messwerte aufsummieren",
    text: "Messwerte holen und aufaddieren, bis der Sensor 0 meldet (Ende der Messreihe). Dann die Summe ausgeben.",
    programm: { 0: "IN", 1: "JZ 6", 2: "ADD 15", 3: "STORE 15", 4: "JMP 0", 6: "LOAD 15", 7: "OUT", 8: "HALT" },
    daten: { 15: 0 },
    eingaben: [12, 7, 30, 0],
  },
  countdown: {
    name: "Countdown",
    text: "Von 5 abwärts zählen und jeden Wert ausgeben, bis 0 erreicht ist.",
    programm: { 0: "LOAD 13", 1: "OUT", 2: "SUB 14", 3: "JZ 5", 4: "JMP 1", 5: "OUT", 6: "HALT" },
    daten: { 13: 5, 14: 1 },
    eingaben: [],
  },
  endlos: {
    name: "Endlosschleife",
    text: "JMP 1 springt immer wieder zurück – es gibt keine Bedingung, die die Schleife beendet.",
    programm: { 0: "LOAD 14", 1: "ADD 15", 2: "JMP 1" },
    daten: { 14: 0, 15: 1 },
    eingaben: [],
  },
};

// --- Stadtführung (Stufe 1) --------------------------------------------------
const FUEHRUNG = [
  {
    id: "rathaus",
    titel: "Rathaus = Prozessor (CPU)",
    text: "Im Rathaus wird entschieden und gerechnet. Es besteht aus zwei Abteilungen: dem Steuerwerk (Bürgermeisterin) und dem Rechenwerk (Rechenmeister). Zusammen bilden sie die CPU.",
  },
  {
    id: "steuerwerk",
    titel: "Bürgermeisterin = Steuerwerk",
    text: "Sie holt den nächsten Befehl, entschlüsselt ihn und gibt allen anderen Anweisungen. Dazu benutzt sie zwei Tafeln: den Befehlszähler (welche Zelle ist als Nächstes dran?) und das Befehlsregister (welcher Befehl wird gerade ausgeführt?).",
  },
  {
    id: "rechenwerk",
    titel: "Rechenmeister = Rechenwerk (ALU)",
    text: "Er rechnet und vergleicht: addieren, subtrahieren, prüfen, ob etwas 0 ist. Sein Zwischenergebnis schreibt er auf seine Tafel, den Akkumulator (Akku).",
  },
  {
    id: "register",
    titel: "Tafeln = Register",
    text: "Register sind winzige, extrem schnelle Speicher direkt in der CPU: Befehlszähler (PC), Befehlsregister (IR) und Akku. Sie fassen nur wenige Bits, aber die CPU kann ohne Fahrt auf der Straße darauf zugreifen.",
  },
  {
    id: "ram",
    titel: "Wohnblock = Arbeitsspeicher (RAM)",
    text: "Jede Wohnung hat eine Hausnummer, die Adresse 0 … 15, und enthält genau 8 Bit. Ob darin ein Befehl oder eine Zahl wohnt, sieht man von außen nicht. Das Besondere bei von Neumann: Befehle UND Daten wohnen im selben Wohnblock.",
  },
  {
    id: "bus",
    titel: "Hauptstraße = Bus",
    text: "Die einzige Verbindung zwischen Rathaus und Wohnblock. Sie hat drei Spuren: den Adressbus (welche Wohnung?), den Datenbus (was wird transportiert?) und den Steuerbus (lesen oder schreiben?). Es fährt immer nur ein Lieferwagen – das ist der von-Neumann-Flaschenhals.",
  },
  {
    id: "ea",
    titel: "Stadttore = Ein- und Ausgabe",
    text: "Die Stadt ist nach dem EVA-Prinzip gebaut: Links durch das Eingangstor kommen Daten von außen herein (Eingabe, z. B. ein Temperatursensor). In der Mitte wird verarbeitet (Rathaus und Wohnblock). Rechts durch das Ausgangstor gehen die Ergebnisse hinaus (Ausgabe, z. B. ein Bildschirm). Auch Steckkarten wie eine Grafikkarte sind von hier aus gesehen „Außenwelt“.",
  },
  {
    id: "prinzip",
    titel: "Das von-Neumann-Prinzip (1945)",
    text: "1. Ein Rechner besteht aus Steuerwerk, Rechenwerk, Speicher, Ein-/Ausgabe und Bus. 2. Programm und Daten liegen im selben Speicher. 3. Der Speicher ist in nummerierte Zellen geteilt. 4. Befehle werden nacheinander ausgeführt (Befehlszähler). 5. Sprünge sind möglich. 6. Alles ist binär codiert.",
  },
];

// --- Grafikkarte (Stufe 6) ---------------------------------------------------
const CPU_DATEN = { kerne: 4, ghz: 4.0 };
const GPU_DATEN = { kerne: 64, ghz: 1.5 };

const GPU_AUFGABEN = [
  { name: "Bild aufhellen (64 Pixel)", n: 64, abhaengig: false, text: "Jedes Pixel wird um 20 % heller. Kein Pixel braucht das Ergebnis eines anderen – alle können gleichzeitig bearbeitet werden." },
  { name: "64 Sensorwerte kalibrieren", n: 64, abhaengig: false, text: "Jeder Messwert wird mit einem Faktor korrigiert. Die Werte sind voneinander unabhängig." },
  { name: "Nur 4 Messwerte kalibrieren", n: 4, abhaengig: false, text: "Wie oben, aber es sind nur 4 Werte. Unabhängig sind sie trotzdem – doch 60 der 64 GPU-Arbeiter haben nichts zu tun. Beide brauchen 1 Takt, und der Takt der CPU ist kürzer." },
  { name: "Laufende Summe (16 Werte)", n: 16, abhaengig: true, text: "Jeder Schritt braucht das Ergebnis des vorigen (Summe bis hier + nächster Wert). Das geht nur nacheinander." },
  { name: "Regelung (16 Schritte)", n: 16, abhaengig: true, text: "Ein Regler berechnet aus dem letzten Ergebnis die nächste Stellgröße. Jeder Schritt hängt vom vorigen ab." },
];

// --- Stufen ------------------------------------------------------------------
const STUFEN = [
  {
    id: "stadtplan",
    name: "Stadtplan",
    rang: "Stadtführer",
    untertitel: "Stufe 1 · Die Bauteile des von-Neumann-Rechners",
    ansicht: "stadt",
    beispiele: ["addieren"],
    auftrag: "Mach eine Stadtführung durch die Platinenstadt im Inneren des Laborservers. Klicke auf die Gebäude oder benutze „Weiter“.",
  },
  {
    id: "zyklus",
    name: "Befehlszyklus",
    rang: "Kurierfahrer",
    untertitel: "Stufe 2 · Holen – Entschlüsseln – Ausführen",
    ansicht: "stadt",
    beispiele: ["addieren", "differenz"],
    auftrag: "Verfolge Schritt für Schritt, wie die CPU ein Programm abarbeitet. Achte auf den Befehlszähler und darauf, was der Lieferwagen transportiert.",
  },
  {
    id: "einspeicher",
    name: "Ein Speicher",
    rang: "Hausverwalter",
    untertitel: "Stufe 3 · Befehle und Daten im selben Speicher",
    ansicht: "stadt",
    beispiele: ["richtig", "ohneHalt", "ueberschreiben"],
    auftrag: "Im Wohnblock sieht eine Zahl genauso aus wie ein Befehl. Vergleiche das richtige Programm mit den beiden fehlerhaften – was passiert, wenn die CPU Daten für Befehle hält?",
  },
  {
    id: "spruenge",
    name: "Sprünge",
    rang: "Lotse",
    untertitel: "Stufe 4 · Sprünge und Schleifen mit JMP und JZ",
    ansicht: "stadt",
    beispiele: ["summe", "countdown", "endlos"],
    auftrag: "Mit Sprüngen kann der Befehlszähler zurückgesetzt werden – so entstehen Schleifen. Beobachte, wie der Befehlszähler springt.",
  },
  {
    id: "harvard",
    name: "von Neumann · Harvard",
    rang: "Stadtplaner",
    untertitel: "Stufe 5 · Ein gemeinsamer Speicher oder zwei getrennte?",
    ansicht: "stadt",
    beispiele: ["addieren", "ueberschreiben", "ohneHalt", "summe"],
    auftrag: "Lass dasselbe Programm in beiden Städten laufen. In der Harvard-Stadt haben Befehle und Daten je ein eigenes Gebäude und eine eigene Straße. Vergleiche die Takte und was mit den fehlerhaften Programmen passiert.",
  },
  {
    id: "gpu",
    name: "CPU · GPU",
    rang: "Bürgermeister",
    untertitel: "Stufe 6 · Wenige schnelle Rechenmeister oder viele einfache Arbeiter?",
    ansicht: "gpu",
    beispiele: [],
    auftrag: "Das Rathaus (CPU) hat 4 schnelle Rechenmeister, die Fabrikhalle der Grafikkarte (GPU) 64 einfache Arbeiter. Wer ist schneller? Probiere unabhängige und abhängige, große und kleine Aufgaben aus – bei welchen gewinnt die CPU?",
  },
];

// =============================================================================
// Prüfungsfragen
// =============================================================================
function zufall(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function waehle(liste) {
  return liste[zufall(0, liste.length - 1)];
}
function mischen(liste) {
  const a = liste.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = zufall(0, i);
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

// Multiple Choice: erste Option ist die richtige, wird gemischt
function mc(frage, optionen, erklaerung, beispiel) {
  const gemischt = mischen(optionen.map((o, i) => ({ o, richtig: i === 0 })));
  return { art: "mc", frage, optionen: gemischt.map((x) => x.o), richtig: gemischt.findIndex((x) => x.richtig), erklaerung, beispiel };
}

function zahl(frage, antwort, erklaerung, beispiel, arch) {
  return { art: "zahl", frage, antwort, erklaerung, beispiel, arch: arch || "neumann" };
}

const MC_STADTPLAN = [
  ["Wer holt den nächsten Befehl aus dem Speicher und entschlüsselt ihn?", ["das Steuerwerk", "das Rechenwerk", "der Arbeitsspeicher", "der Bus"], "Das Steuerwerk (Bürgermeisterin) steuert den Befehlszyklus."],
  ["Welches Bauteil führt Additionen und Vergleiche aus?", ["das Rechenwerk (ALU)", "das Steuerwerk", "der Adressbus", "die Eingabe"], "Das Rechenwerk – Arithmetic Logic Unit."],
  ["Was steht im Befehlszähler?", ["die Adresse des nächsten Befehls", "der aktuelle Befehl", "das letzte Rechenergebnis", "die Anzahl der Befehle im Programm"], "Der Befehlszähler (PC) zeigt auf die Zelle, aus der als Nächstes geholt wird."],
  ["Was steht im Befehlsregister?", ["der Befehl, der gerade ausgeführt wird", "die Adresse des nächsten Befehls", "das Rechenergebnis", "der nächste Messwert"], "Das Befehlsregister (IR) hält den gerade geholten Befehl."],
  ["Wo wohnen bei von Neumann die Befehle des Programms?", ["im selben Arbeitsspeicher wie die Daten", "in einem eigenen Programmspeicher", "im Rechenwerk", "auf dem Bus"], "Ein gemeinsamer Speicher für Befehle und Daten ist DAS Merkmal der von-Neumann-Architektur."],
  ["Welcher Bus sagt dem Speicher, WELCHE Zelle gemeint ist?", ["der Adressbus", "der Datenbus", "der Steuerbus", "der Akku"], "Der Adressbus transportiert die Hausnummer."],
  ["Welcher Bus transportiert den Inhalt einer Zelle?", ["der Datenbus", "der Adressbus", "der Steuerbus", "der Befehlszähler"], "Auf dem Datenbus fährt der Inhalt – Befehl oder Zahl."],
  ["Welcher Bus legt fest, ob gelesen oder geschrieben wird?", ["der Steuerbus", "der Datenbus", "der Adressbus", "das Befehlsregister"], "Steuersignale wie „lesen“ und „schreiben“ laufen über den Steuerbus."],
  ["Was ist ein Register?", ["ein sehr kleiner, sehr schneller Speicher in der CPU", "eine Speicherzelle im RAM", "eine Spur des Busses", "ein Ein-/Ausgabegerät"], "Register wie Akku, PC und IR sitzen direkt in der CPU."],
  ["Ein Temperatursensor am Laborserver ist aus Sicht des von-Neumann-Rechners …", ["ein Eingabegerät", "ein Ausgabegerät", "ein Teil des Rechenwerks", "ein Register"], "Er liefert Daten von außen: Eingabe."],
  ["Wie viele Lieferwagen können bei von Neumann gleichzeitig auf der Hauptstraße fahren?", ["einer", "zwei", "einer pro Speicherzelle", "beliebig viele"], "Ein gemeinsamer Bus – immer nur ein Transport gleichzeitig."],
];

const MC_HARVARD = [
  ["Was ist der Hauptunterschied zwischen von-Neumann- und Harvard-Architektur?", ["Harvard trennt Programm- und Datenspeicher (mit eigenen Bussen)", "Harvard hat kein Rechenwerk", "Harvard kennt keine Sprünge", "Harvard rechnet im Dezimalsystem"], "Harvard: zwei Speicher, zwei Wege. Von Neumann: ein Speicher, ein Weg."],
  ["Warum kann eine Harvard-CPU oft schneller arbeiten?", ["Befehl holen und Daten lesen können gleichzeitig passieren", "sie hat mehr Speicherzellen", "sie braucht keinen Befehlszähler", "sie rechnet nur mit kleinen Zahlen"], "Zwei Straßen: Während der eine Lieferwagen Daten holt, holt der andere schon den nächsten Befehl."],
  ["Was ist der von-Neumann-Flaschenhals?", ["Befehle und Daten müssen sich einen einzigen Bus teilen", "der Speicher ist zu klein", "das Rechenwerk kann nur addieren", "die CPU hat nur einen Akku"], "Alles muss über die eine Hauptstraße – die CPU wartet oft auf den Bus."],
  ["Ein Programm schreibt versehentlich mit STORE in die Zelle seines eigenen HALT-Befehls. Wo kann das NICHT passieren?", ["bei Harvard, weil STORE nur in den Datenspeicher schreibt", "bei von Neumann", "bei beiden nicht", "bei beiden"], "Bei Harvard liegt das Programm in einem eigenen Speicher, den STORE nicht erreicht."],
  ["Wo findet man typischerweise die Harvard-Architektur?", ["in Mikrocontrollern (z. B. Arduino)", "nur in Großrechnern der 1950er", "in Monitoren", "in Netzwerkkabeln"], "Mikrocontroller haben Programm im Flash und Daten im RAM getrennt – Thema im 2. Schuljahr."],
  ["Welchen Vorteil hat der gemeinsame Speicher bei von Neumann?", ["Speicherplatz kann flexibel für Programm oder Daten genutzt werden", "das Programm ist vor Überschreiben geschützt", "es ist immer schneller", "man braucht keinen Bus"], "Ein Speicher für alles ist einfach und flexibel – große Programme oder viele Daten, wie es gerade passt."],
  ["Bei Harvard läuft der Befehlszähler über das Programmende hinaus. Was liest die CPU?", ["leere Zellen des Programmspeichers, nicht die Daten", "die Daten aus dem Datenspeicher", "den Inhalt des Akkus", "nichts, der Befehlszähler kann nicht weiterzählen"], "Der Befehlszähler zeigt immer in den Programmspeicher – Daten können nicht als Befehl gelesen werden."],
];

// zufälliges kurzes Programm für Fragen zum Befehlszyklus
function zufallsProgramm() {
  const a = zufall(20, 60);
  const b = zufall(5, 30);
  const c = zufall(1, 15);
  return {
    name: "Prüfprogramm",
    text: "",
    programm: { 0: "LOAD 12", 1: "ADD 13", 2: "SUB 14", 3: "STORE 15", 4: "HALT" },
    daten: { 12: a, 13: b, 14: c, 15: 0 },
    eingaben: [],
  };
}

function zufallsSchleife() {
  if (Math.random() < 0.5) {
    const start = zufall(2, 5);
    const schritt = waehle([1, 1, 2]);
    const s = start * schritt;
    return {
      name: "Prüfprogramm",
      text: "",
      programm: { 0: "LOAD 13", 1: "OUT", 2: "SUB 14", 3: "JZ 5", 4: "JMP 1", 5: "OUT", 6: "HALT" },
      daten: { 13: s, 14: schritt },
      eingaben: [],
    };
  }
  const n = zufall(2, 4);
  const werte = [];
  for (let i = 0; i < n; i++) {
    werte.push(zufall(3, 25));
  }
  werte.push(0);
  return {
    name: "Prüfprogramm",
    text: "",
    programm: { 0: "IN", 1: "JZ 6", 2: "ADD 15", 3: "STORE 15", 4: "JMP 0", 6: "LOAD 15", 7: "OUT", 8: "HALT" },
    daten: { 15: 0 },
    eingaben: werte,
  };
}

function akkuNach(beispiel, zelle) {
  const r = simuliere(beispiel, "neumann");
  // letzter Ausführen-Schritt des Befehls aus der gegebenen Zelle
  let akku = null;
  let aktuelleZelle = null;
  for (const s of r.schritte) {
    if (s.phase === "holen") {
      aktuelleZelle = s.lesen.adr;
    }
    if (s.phase === "ausfuehren" && aktuelleZelle === zelle) {
      akku = s.akku;
    }
  }
  return akku;
}

function neuePruefung(stufe) {
  const id = STUFEN[stufe].id;
  if (id === "stadtplan") {
    const q = waehle(MC_STADTPLAN);
    return mc(q[0], q[1], q[2], BSP.addieren);
  }
  if (id === "zyklus") {
    const art = waehle(["akku", "pc", "fahrten", "dekodieren"]);
    const p = zufallsProgramm();
    if (art === "akku") {
      const z = zufall(0, 2);
      const w = akkuNach(p, z);
      return zahl(`Welchen Wert hat der Akku, nachdem der Befehl aus Zelle ${z} ausgeführt wurde?`, w, `Rechne die Befehle bis Zelle ${z} nach: Akku = ${w}.`, p);
    }
    if (art === "pc") {
      const z = zufall(0, 3);
      return zahl(`Der Befehl aus Zelle ${z} wurde gerade geholt. Welchen Wert hat der Befehlszähler jetzt?`, z + 1, `Beim Holen wird der Befehlszähler sofort um 1 erhöht: ${z} + 1 = ${z + 1}.`, p);
    }
    if (art === "fahrten") {
      const r = simuliere(p, "neumann");
      return zahl("Wie viele Fahrten auf der Hauptstraße braucht das ganze Programm (Holen und Datenzugriffe)?", r.fahrten, `5 Befehle holen + 4 Datenzugriffe (LOAD, ADD, SUB, STORE) = ${r.fahrten} Fahrten.`, p);
    }
    const op = zufall(1, 4);
    const a = zufall(0, 15);
    const v = op * 16 + a;
    const namen = ["LOAD", "ADD", "SUB", "STORE"];
    const richtig = `${namen[op - 1]} ${a}`;
    const falsch = mischen(namen.filter((n) => n !== namen[op - 1])).slice(0, 2).map((n) => `${n} ${a}`);
    falsch.push(`${namen[op - 1]} ${(a + 3) % 16}`);
    return mc(`Im Befehlsregister steht ${hex2(v)} = ${bin8(v)}. Welcher Befehl ist das?`, [richtig, ...falsch], `Oberes Halbbyte ${op} = ${namen[op - 1]}, unteres Halbbyte ${a} = Adresse.`, p);
  }
  if (id === "einspeicher") {
    const art = waehle(["ausfuehren", "erkennen", "adresse", "ueberschreiben"]);
    if (art === "ausfuehren") {
      const op = zufall(1, 4);
      const a = zufall(1, 15);
      const v = op * 16 + a;
      const namen = ["LOAD", "ADD", "SUB", "STORE"];
      return mc(
        `In Zelle 9 hat das Programm die Zahl ${v} (${hex2(v)}) gespeichert. Durch einen Fehler zeigt der Befehlszähler auf Zelle 9. Was passiert?`,
        [`Die CPU führt ${namen[op - 1]} ${a} aus`, "Die CPU meldet einen Fehler, weil dort eine Zahl steht", "Die CPU überspringt die Zelle", `Die CPU gibt ${v} auf dem Monitor aus`],
        `${v} = ${bin8(v)}: oberes Halbbyte ${op} = ${namen[op - 1]}, unteres ${a}. Die CPU kann Zahlen und Befehle nicht unterscheiden.`
      );
    }
    if (art === "erkennen") {
      return mc(
        "Woran erkennt eine von-Neumann-CPU, ob in einer Speicherzelle ein Befehl oder eine Zahl steht?",
        ["Gar nicht – nur daran, ob der Befehlszähler gerade darauf zeigt", "an einem besonderen Kennbit in jeder Zelle", "Befehle stehen immer in geraden, Zahlen in ungeraden Zellen", "Zahlen sind immer kleiner als 100"],
        "Ein Bitmuster ist nur ein Bitmuster. Was beim Holen kommt, wird als Befehl behandelt – was bei LOAD/ADD kommt, als Zahl.",
        BSP.ohneHalt
      );
    }
    if (art === "adresse") {
      const v = zufall(17, 79);
      return zahl(`Die Zahl ${v} wird versehentlich als Befehl gelesen. Welche Adresse steht in diesem „Befehl“? (Tipp: unteres Halbbyte)`, v & 15, `${v} = ${bin8(v)} → unteres Halbbyte ${(v & 15).toString(2).padStart(4, "0")} = ${v & 15}.`);
    }
    return mc(
      "Ein Programm speichert mit STORE 3 die Zahl 96 (0110 0000) in Zelle 3. Dort stand vorher HALT. Was passiert, wenn die CPU Zelle 3 erreicht?",
      ["Sie führt OUT aus – das Programm hat sich selbst verändert", "Sie hält trotzdem an, weil HALT geschützt ist", "Sie meldet einen Schreibfehler", "Sie liest die Zahl 96 und rechnet damit"],
      "96 = 0110 0000 → Befehl 6 = OUT. Bei von Neumann kann ein Programm seinen eigenen Code überschreiben.",
      BSP.ueberschreiben
    );
  }
  if (id === "spruenge") {
    const p = zufallsSchleife();
    const r = simuliere(p, "neumann");
    const istSumme = p.programm[0] === "IN";
    if (istSumme) {
      if (Math.random() < 0.5) {
        return zahl(`Der Sensor liefert nacheinander ${p.eingaben.join(", ")}. Welcher Wert erscheint am Ende auf dem Monitor?`, r.ausgabe[r.ausgabe.length - 1], `Summe aller Messwerte vor der 0: ${p.eingaben.slice(0, -1).join(" + ")} = ${r.ausgabe[r.ausgabe.length - 1]}.`, p);
      }
      const durchlaeufe = p.eingaben.length - 1;
      return zahl(`Der Sensor liefert nacheinander ${p.eingaben.join(", ")}. Wie oft wird der Befehl JMP 0 ausgeführt?`, durchlaeufe, `Für jeden Messwert außer der abschließenden 0 läuft die Schleife einmal: ${durchlaeufe}-mal.`, p);
    }
    if (Math.random() < 0.5) {
      return zahl(`Countdown mit Startwert ${p.daten[13]} und Schrittweite ${p.daten[14]}: Wie viele Werte erscheinen insgesamt auf dem Monitor?`, r.ausgabe.length, `Ausgegeben werden ${r.ausgabe.join(", ")} – also ${r.ausgabe.length} Werte.`, p);
    }
    return zahl(`Countdown mit Startwert ${p.daten[13]} und Schrittweite ${p.daten[14]}: Wie oft springt JMP 1 zurück?`, r.ausgabe.length - 2, `JMP 1 wird nach jedem Wert ausgeführt, der nicht 0 ergibt: ${r.ausgabe.length - 2}-mal.`, p);
  }
  if (id === "harvard") {
    if (Math.random() < 0.55) {
      const q = waehle(MC_HARVARD);
      return mc(q[0], q[1], q[2], BSP.ueberschreiben);
    }
    const p = zufallsProgramm();
    const arch = waehle(["neumann", "harvard"]);
    const r = simuliere(p, arch);
    return zahl(
      arch === "neumann"
        ? "Wie viele Takte braucht dieses Programm in der von-Neumann-Stadt? (1 Takt = 1 Fahrt auf der Hauptstraße)"
        : "Wie viele Takte braucht dieses Programm in der Harvard-Stadt? (Holen und Datenzugriff dürfen im selben Takt passieren)",
      r.takte,
      arch === "neumann"
        ? `5 × Holen + 4 × Datenzugriff, alles nacheinander auf einer Straße = ${r.takte} Takte.`
        : `5 Befehle holen; die 4 Datenzugriffe laufen parallel zum Holen des nächsten Befehls = ${r.takte} Takte.`,
      p,
      arch
    );
  }
  // CPU · GPU
  const art = waehle(["cpuTakte", "gpuTakte", "abhaengig", "geeignet", "schneller", "klein"]);
  if (art === "klein") {
    const n = waehle([2, 3, 4]);
    return mc(
      `Nur ${n} Messwerte sollen kalibriert werden (voneinander unabhängig). CPU: 4 Kerne, 4 GHz. GPU: 64 Kerne, 1,5 GHz. Wer ist schneller fertig?`,
      ["die CPU – beide brauchen 1 Takt, aber der CPU-Takt ist kürzer", "die GPU, weil sie mehr Kerne hat", "beide gleich schnell, weil beide 1 Takt brauchen", "die GPU, weil die Aufgaben unabhängig sind"],
      `Beide schaffen ${n} Werte in 1 Takt. CPU: 1 : 4 GHz = 0,25 ns, GPU: 1 : 1,5 GHz ≈ 0,67 ns. Viele Kerne nützen nur, wenn es genug Arbeit für alle gibt – in echt müssen die Daten außerdem erst zur Grafikkarte und zurück.`
    );
  }
  if (art === "cpuTakte" || art === "gpuTakte") {
    const n = waehle([64, 128, 256, 512, 1024]);
    const k = art === "cpuTakte" ? waehle([4, 8, 16]) : waehle([64, 128, 256]);
    return zahl(`${n} Pixel sollen aufgehellt werden (voneinander unabhängig). Ein Prozessor hat ${k} Kerne, jeder Kern schafft 1 Pixel pro Takt. Wie viele Takte braucht er?`, Math.ceil(n / k), `${n} : ${k} = ${Math.ceil(n / k)} Takte.`);
  }
  if (art === "abhaengig") {
    const n = waehle([10, 16, 20, 32]);
    return zahl(`Eine laufende Summe über ${n} Messwerte: Jeder Schritt braucht das Ergebnis des vorigen. Wie viele Takte braucht eine GPU mit 512 Kernen?`, n, `Abhängige Schritte gehen nur nacheinander – die vielen Kerne helfen nicht: ${n} Takte.`);
  }
  if (art === "geeignet") {
    const q = waehle([
      ["Für welche Aufgabe ist eine GPU besonders gut geeignet?", ["viele gleichartige, unabhängige Berechnungen (z. B. Pixel, KI-Training)", "ein Programm mit vielen Verzweigungen und Sprüngen", "eine laufende Summe, bei der jeder Schritt den vorigen braucht", "das Betriebssystem steuern"], "Die GPU spielt ihre Stärke aus, wenn tausende Arbeiter gleichzeitig dasselbe tun können."],
      ["Warum hat eine CPU nur wenige, eine GPU sehr viele Kerne?", ["CPU-Kerne sind schnell und vielseitig, GPU-Kerne einfach und spezialisiert", "GPUs sind immer neuer", "CPU-Kerne können nicht rechnen", "GPU-Kerne brauchen keinen Strom"], "Wenige starke Rechenmeister gegen viele einfache Arbeiter – beides hat seine Aufgaben."],
    ]);
    return mc(q[0], q[1], q[2]);
  }
  return mc(
    "Eine CPU (4 GHz) braucht für eine Aufgabe 16 Takte, eine GPU (1 GHz) nur 1 Takt. Wer ist schneller fertig?",
    ["die GPU (1 ns gegenüber 4 ns)", "die CPU, weil sie die höhere Taktfrequenz hat", "beide gleich schnell", "das lässt sich nicht sagen"],
    "Zeit = Takte : Frequenz. CPU: 16 : 4 GHz = 4 ns. GPU: 1 : 1 GHz = 1 ns."
  );
}

if (typeof module !== "undefined") {
  module.exports = { STUFEN, BSP, FUEHRUNG, GPU_AUFGABEN, CPU_DATEN, GPU_DATEN, SERIE_ZIEL, neuePruefung };
}
