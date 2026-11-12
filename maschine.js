// =============================================================================
//  maschine.js – eine Mini-CPU zum Durchsteppen (reines JavaScript, ohne p5)
// =============================================================================
//  Akkumulator-Maschine mit 16 Speicherzellen à 8 Bit.
//  Ein Befehl belegt eine Zelle: oberes Halbbyte = Befehl, unteres = Adresse.
//    0 HALT   1 LOAD a   2 ADD a   3 SUB a   4 STORE a
//    5 IN     6 OUT      7 JMP a   8 JZ a
//  Beispiel: 0x1C = 0001 1100 = LOAD 12
//
//  simuliere() rechnet ein Programm vorab komplett durch und liefert eine
//  Liste von Schritten (Holen · Entschlüsseln · Ausführen) – für die
//  von-Neumann-Architektur (ein Speicher, eine Straße) oder für die
//  Harvard-Architektur (Programm- und Datenspeicher getrennt, zwei Straßen).
// =============================================================================

const BEFEHLE = ["HALT", "LOAD", "ADD", "SUB", "STORE", "IN", "OUT", "JMP", "JZ"];
const MIT_ADRESSE = new Set([1, 2, 3, 4, 7, 8]);
const MAX_SCHRITTE = 150;

const BEFEHL_TEXT = {
  HALT: "Programm beenden",
  LOAD: "Inhalt von Zelle a in den Akku laden",
  ADD: "Inhalt von Zelle a zum Akku addieren",
  SUB: "Inhalt von Zelle a vom Akku abziehen",
  STORE: "Akku in Zelle a speichern",
  IN: "Messwert vom Sensor in den Akku holen",
  OUT: "Akku auf dem Monitor ausgeben",
  JMP: "Sprung: Befehlszähler auf a setzen",
  JZ: "Sprung, wenn der Akku 0 ist",
};

function hex2(v) {
  return "0x" + v.toString(16).toUpperCase().padStart(2, "0");
}

function bin8(v) {
  const b = v.toString(2).padStart(8, "0");
  return b.slice(0, 4) + " " + b.slice(4);
}

// "LOAD 12" → 0x1C
function assembliere(txt) {
  const teile = String(txt).trim().toUpperCase().split(/\s+/);
  const op = BEFEHLE.indexOf(teile[0]);
  if (op < 0) {
    throw new Error("Unbekannter Befehl: " + txt);
  }
  const a = teile.length > 1 ? parseInt(teile[1], 10) : 0;
  return op * 16 + (a & 15);
}

// 0x1C → {op: 1, name: "LOAD", a: 12, text: "LOAD 12"}
function dekodiere(v) {
  const op = v >> 4;
  const a = v & 15;
  const name = BEFEHLE[op];
  if (!name) {
    return { op, a, name: null, text: "ungültig" };
  }
  return { op, a, name, text: MIT_ADRESSE.has(op) ? `${name} ${a}` : name };
}

// Beispiel → Speicherinhalt(e)
function speicherAus(beispiel, arch) {
  const prog = new Array(16).fill(0);
  const daten = new Array(16).fill(0);
  for (const a of Object.keys(beispiel.programm)) {
    prog[+a] = assembliere(beispiel.programm[a]);
  }
  for (const a of Object.keys(beispiel.daten || {})) {
    daten[+a] = beispiel.daten[a] & 255;
  }
  if (arch === "harvard") {
    return { prog, daten };
  }
  // von Neumann: alles in EINEN Speicher
  const mem = new Array(16).fill(0);
  for (let i = 0; i < 16; i++) {
    mem[i] = beispiel.programm[i] !== undefined ? prog[i] : daten[i];
  }
  return { mem };
}

// -----------------------------------------------------------------------------
// Simulation
// -----------------------------------------------------------------------------
function simuliere(beispiel, arch) {
  const harvard = arch === "harvard";
  const sp = speicherAus(beispiel, arch);
  const z = {
    pc: 0,
    ir: null,
    akku: 0,
    mem: sp.mem ? sp.mem.slice() : null,
    prog: sp.prog ? sp.prog.slice() : null,
    daten: sp.daten ? sp.daten.slice() : null,
    eingaben: (beispiel.eingaben || []).slice(),
    ausgabe: [],
    takte: 0,
    fahrten: 0,
    befehle: 0,
    alsBefehl: new Set(), // Zellen, die schon als Befehl gelesen wurden
    alsDaten: new Set(),
  };
  const schritte = [];

  function bild(phase, text, extra) {
    schritte.push(
      Object.assign(
        {
          phase,
          text,
          pc: z.pc,
          ir: z.ir,
          akku: z.akku,
          mem: z.mem ? z.mem.slice() : null,
          prog: z.prog ? z.prog.slice() : null,
          daten: z.daten ? z.daten.slice() : null,
          eingaben: z.eingaben.slice(),
          ausgabe: z.ausgabe.slice(),
          takte: z.takte,
          fahrten: z.fahrten,
          befehle: z.befehle,
          alsBefehl: new Set(z.alsBefehl),
          alsDaten: new Set(z.alsDaten),
          fahrtenListe: [],
          lesen: null,
          schreiben: null,
        },
        extra || {}
      )
    );
  }

  const befehlsSpeicher = () => (harvard ? z.prog : z.mem);
  const datenSpeicher = () => (harvard ? z.daten : z.mem);

  // Holen: Befehl aus dem (Programm-)Speicher ins Befehlsregister
  function holen() {
    const adr = z.pc;
    const v = befehlsSpeicher()[adr];
    z.ir = v;
    z.pc = (z.pc + 1) % 16;
    z.alsBefehl.add(adr);
    return { adr, v };
  }

  bild("start", harvard
    ? "Harvard-Stadt: Die Befehle wohnen in der Programm-Bibliothek, die Daten im Daten-Wohnblock. Jedes Gebäude hat seine eigene Straße."
    : "Von-Neumann-Stadt: Befehle und Daten wohnen im SELBEN Wohnblock (RAM). Zum Rathaus (CPU) führt nur EINE Hauptstraße (Bus).");

  let vorgeholt = null; // Harvard: schon während des letzten Befehls geholt
  let ende = "limit";

  while (schritte.length < MAX_SCHRITTE) {
    // ---- Holen ----------------------------------------------------------
    let geholt;
    if (vorgeholt) {
      geholt = vorgeholt;
      vorgeholt = null;
    } else {
      geholt = holen();
      z.takte++;
      z.fahrten++;
      bild("holen", `Holen: Der Befehlszähler zeigt auf Zelle ${geholt.adr}. Der Lieferwagen fährt hin und bringt ${hex2(geholt.v)} ins Befehlsregister. Der Befehlszähler wird ${z.pc}.`, {
        fahrtenListe: [{ strasse: harvard ? "befehl" : "haupt", ziel: harvard ? "prog" : "ram", adresse: geholt.adr, inhalt: geholt.v, art: "befehl" }],
        lesen: { adr: geholt.adr, art: "befehl", speicher: harvard ? "prog" : "ram" },
      });
    }
    // ---- Entschlüsseln ----------------------------------------------------
    const b = dekodiere(geholt.v);
    z.befehle++;
    if (!b.name) {
      bild("fehler", `Entschlüsseln: ${hex2(geholt.v)} = ${bin8(geholt.v)} ist kein gültiger Befehl! Die CPU stürzt ab.`);
      ende = "fehler";
      break;
    }
    const zahlHinweis = !harvard && geholt.v !== 0 && beispielIstDaten(beispiel, geholt.adr)
      ? ` Achtung: Hier sollte eigentlich die ZAHL ${geholt.v} stehen – die CPU kann das nicht unterscheiden und führt sie als Befehl aus!`
      : "";
    bild("entschluesseln", `Entschlüsseln: ${hex2(geholt.v)} = ${bin8(geholt.v)} → ${b.text}: ${BEFEHL_TEXT[b.name].replace(" a", " " + b.a)}.${zahlHinweis}`);

    // ---- Ausführen --------------------------------------------------------
    const ds = datenSpeicher();
    const dName = harvard ? "daten" : "ram";
    const strasseD = harvard ? "daten" : "haupt";
    let datenFahrt = null;
    let text = "";
    let lesen = null;
    let schreiben = null;
    switch (b.name) {
      case "HALT":
        bild("halt", "Ausführen: HALT – das Programm ist beendet.");
        ende = "halt";
        break;
      case "LOAD":
      case "ADD":
      case "SUB": {
        const w = ds[b.a];
        z.alsDaten.add(b.a);
        const alt = z.akku;
        if (b.name === "LOAD") {
          z.akku = w;
        } else if (b.name === "ADD") {
          z.akku = (z.akku + w) % 256;
        } else {
          z.akku = (z.akku - w + 256) % 256;
        }
        datenFahrt = { strasse: strasseD, ziel: dName, adresse: b.a, inhalt: w, art: "daten" };
        lesen = { adr: b.a, art: "daten", speicher: dName };
        text =
          b.name === "LOAD"
            ? `Ausführen: Der Lieferwagen holt die Zahl ${w} aus Zelle ${b.a}. Akku = ${z.akku}.`
            : `Ausführen: Zahl ${w} aus Zelle ${b.a} holen, das Rechenwerk rechnet ${alt} ${b.name === "ADD" ? "+" : "−"} ${w} = ${z.akku}.`;
        break;
      }
      case "STORE": {
        const alt = ds[b.a];
        ds[b.a] = z.akku;
        z.alsDaten.add(b.a);
        datenFahrt = { strasse: strasseD, ziel: dName, adresse: b.a, inhalt: z.akku, art: "schreiben" };
        schreiben = { adr: b.a, speicher: dName };
        const warBefehl = !harvard && Object.prototype.hasOwnProperty.call(beispiel.programm, b.a);
        text = `Ausführen: Der Lieferwagen bringt ${z.akku} in Zelle ${b.a} (vorher ${hex2(alt)}).` +
          (warBefehl ? ` Achtung: In Zelle ${b.a} stand ein BEFEHL – das Programm hat sich gerade selbst verändert! Neuer Befehl dort: ${dekodiere(z.akku).text}.` : "") +
          (harvard && Object.prototype.hasOwnProperty.call(beispiel.programm, b.a) ? ` Das ist Zelle ${b.a} im DATENspeicher – der Befehl in der Programm-Bibliothek bleibt unberührt.` : "");
        break;
      }
      case "IN": {
        const w = z.eingaben.length ? z.eingaben.shift() : 0;
        z.akku = w;
        datenFahrt = { strasse: strasseD, ziel: "sensor", adresse: null, inhalt: w, art: "ea" };
        text = `Ausführen: Ein Lieferwagen holt den Messwert ${w} vom Sensor am Stadttor. Akku = ${w}.`;
        break;
      }
      case "OUT":
        z.ausgabe.push(z.akku);
        datenFahrt = { strasse: strasseD, ziel: "monitor", adresse: null, inhalt: z.akku, art: "ea" };
        text = `Ausführen: Der Akku-Wert ${z.akku} wird zum Monitor am Stadttor gebracht.`;
        break;
      case "JMP":
        z.pc = b.a;
        text = `Ausführen: Sprung – der Befehlszähler wird auf ${b.a} gesetzt. Der nächste Befehl kommt aus Zelle ${b.a}.`;
        break;
      case "JZ":
        if (z.akku === 0) {
          z.pc = b.a;
          text = `Ausführen: Der Akku ist 0 → Sprung, Befehlszähler = ${b.a}.`;
        } else {
          text = `Ausführen: Der Akku ist ${z.akku}, nicht 0 → kein Sprung, es geht mit Zelle ${z.pc} weiter.`;
        }
        break;
      default:
        break;
    }
    if (b.name === "HALT") {
      break;
    }
    if (datenFahrt) {
      z.takte++;
      z.fahrten++;
      const liste = [datenFahrt];
      if (harvard && z.pc < 16) {
        // zweite Straße: der nächste Befehl wird gleichzeitig geholt
        const n = holen();
        z.fahrten++;
        vorgeholt = n;
        liste.push({ strasse: "befehl", ziel: "prog", adresse: n.adr, inhalt: n.v, art: "befehl" });
        text += ` Gleichzeitig holt der zweite Lieferwagen auf der Befehlsstraße schon den nächsten Befehl aus Zelle ${n.adr} – das spart einen Takt.`;
      }
      bild("ausfuehren", text, { fahrtenListe: liste, lesen, schreiben, vorgeholt: !!vorgeholt });
    } else {
      bild("ausfuehren", text + " (Keine Fahrt nötig – das passiert im Rathaus.)");
    }
  }
  if (ende === "limit") {
    bild("fehler", `Nach ${MAX_SCHRITTE} Schritten abgebrochen – das Programm läuft im Kreis (Endlosschleife).`);
  }
  return { schritte, ende, ausgabe: z.ausgabe, akku: z.akku, takte: z.takte, fahrten: z.fahrten, befehle: z.befehle, endeZustand: z };
}

function beispielIstDaten(beispiel, adr) {
  return !Object.prototype.hasOwnProperty.call(beispiel.programm, adr) && Object.prototype.hasOwnProperty.call(beispiel.daten || {}, adr);
}

if (typeof module !== "undefined") {
  module.exports = { BEFEHLE, assembliere, dekodiere, simuliere, speicherAus, hex2, bin8, BEFEHL_TEXT };
}
