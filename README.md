# Platinenstadt · Der von-Neumann-Rechner

Ein Zoom ins Innere des Laborservers: Das Mainboard ist eine kleine Stadt. Im **Rathaus (CPU)** arbeiten die Bürgermeisterin (Steuerwerk) und der Rechenmeister (Rechenwerk), im **Wohnblock (RAM)** wohnen Befehle und Daten, und über die **Hauptstraße (Bus)** fährt ein Lieferwagen alles hin und her. Schritt für Schritt wird sichtbar, wie ein Programm abgearbeitet wird – und warum es so wichtig ist, dass Befehle und Daten im **selben Speicher** liegen. Zum Vergleich gibt es die Harvard-Stadt mit zwei getrennten Speichern und eine Grafikkarte als Fabrikhalle.

Sechs Freigabestufen vom *Stadtführer* bis zum *Bürgermeister*.

Erstellt für den Unterricht an der Jakob-Preh-Schule ([bsnes.de](https://www.bsnes.de)), Fachschule für Elektrotechnik, Fach Informationstechnik, 1. Schuljahr (Lerngebiet 1: Komponenten von Digitalrechnern).

**Live-Version:** [Hier direkt anschauen](https://flowthetensor.github.io/LS-Platinenstadt/)

---

## Die Stadt

Die Stadt ist nach dem **EVA-Prinzip** aufgebaut: links das Eingangstor (Eingabe), in der Mitte Rathaus oben und Wohnblock unten (Verarbeitung), rechts das Ausgangstor (Ausgabe). Die Hauptstraße (Bus) verbindet alle Gebäude.

| In der Stadt | Im Rechner |
|---|---|
| Rathaus | Prozessor (CPU) |
| Bürgermeisterin | Steuerwerk: holt, entschlüsselt und steuert |
| Rechenmeister | Rechenwerk (ALU): addiert, subtrahiert, vergleicht |
| Tafeln im Rathaus | Register: Befehlszähler (PC), Befehlsregister (IR), Akku |
| Wohnblock mit Hausnummern | Arbeitsspeicher (RAM) mit Adressen 0 … 15 |
| Hauptstraße mit drei Spuren | Bus: Adressbus, Datenbus, Steuerbus |
| Lieferwagen | ein Transport über den Bus |
| Eingangstor mit Sensor (links) | Eingabe |
| Ausgangstor mit Monitor (rechts) | Ausgabe |
| Rathausuhr | Takt |

## Die Mini-CPU

Jede Speicherzelle hat 8 Bit. Ein Befehl belegt genau eine Zelle: Das obere Halbbyte ist der Befehl, das untere die Adresse.

| Code | Befehl | Bedeutung |
|---|---|---|
| 0 | `HALT` | Programm beenden |
| 1 | `LOAD a` | Inhalt von Zelle a in den Akku laden |
| 2 | `ADD a` | Inhalt von Zelle a zum Akku addieren |
| 3 | `SUB a` | Inhalt von Zelle a vom Akku abziehen |
| 4 | `STORE a` | Akku in Zelle a speichern |
| 5 | `IN` | Messwert vom Sensor in den Akku |
| 6 | `OUT` | Akku auf dem Monitor ausgeben |
| 7 | `JMP a` | Sprung zu Zelle a |
| 8 | `JZ a` | Sprung zu Zelle a, wenn der Akku 0 ist |

Beispiel: `0x1C` = `0001 1100` = `LOAD 12`. Umgekehrt ist die *Zahl* 28 dasselbe Bitmuster – das ist der Kern von Stufe 3.

Jeder Befehl läuft in drei Phasen ab, die einzeln durchgesteppt werden:

```
① Holen:          Befehlszähler → Adressbus → RAM, Befehl → Datenbus → Befehlsregister, Befehlszähler + 1
② Entschlüsseln:  Das Steuerwerk liest das Bitmuster als Befehl
③ Ausführen:      ggf. Zahl holen oder speichern, das Rechenwerk rechnet, Sprung …
```

Vereinfachtes Zeitmodell: **1 Takt = 1 Fahrt auf der Straße.** Entschlüsseln und Rechnen im Rathaus werden nicht mitgezählt.

## Die sechs Freigabestufen

| Stufe | Thema | Freigabe als | Inhalt |
|---|---|---|---|
| 1 | Stadtplan | Stadtführer | Stadtführung durch alle Bauteile, das von-Neumann-Prinzip (1945) |
| 2 | Befehlszyklus | Kurierfahrer | Holen – Entschlüsseln – Ausführen an zwei Beispielprogrammen |
| 3 | Ein Speicher | Hausverwalter | Befehle und Daten im selben Speicher – und was schiefgehen kann |
| 4 | Sprünge | Lotse | Schleifen mit `JMP` und `JZ`, Endlosschleife |
| 5 | von Neumann · Harvard | Stadtplaner | dasselbe Programm in beiden Architekturen, Takte und Sicherheit im Vergleich |
| 6 | CPU · GPU | Bürgermeister | 4 schnelle Kerne gegen 64 einfache Kerne, unabhängige und abhängige Aufgaben |

### Stufe 3: Ein Speicher für Befehle und Daten

Die Speicheransicht zeigt jede Zelle in beiden Lesarten: **als Befehl** (blau) und **als Zahl** (orange). Kleine Punkte markieren, wie eine Zelle tatsächlich benutzt wurde. Drei Beispiele:

| Beispiel | Was passiert |
|---|---|
| Richtig: mit HALT | 70 + 22 = 92 landet in Zelle 6, danach hält die CPU an. |
| Fehler: HALT vergessen | Der Befehlszähler läuft weiter in die Daten. Der alte Messwert 52 (`0011 0100`) wird als `SUB 4` ausgeführt, die 70 (`0100 0110`) als `STORE 6` – das Ergebnis in Zelle 6 wird mit 22 überschrieben. |
| Fehler: Programm überschreibt sich | `STORE 3` schreibt die Zahl 96 (`0110 0000`) in die Zelle mit `HALT`. Aus HALT wird `OUT` – der Wert erscheint zweimal auf dem Monitor. |

Die CPU kann Befehle und Zahlen **nicht unterscheiden**. Ob ein Bitmuster als Befehl gilt, hängt nur davon ab, ob der Befehlszähler darauf zeigt.

### Stufe 5: von Neumann oder Harvard?

| | von Neumann | Harvard |
|---|---|---|
| Speicher | einer für Befehle und Daten | Programmspeicher (z. B. Flash) und Datenspeicher (RAM) getrennt |
| Wege | ein Bus | zwei Busse |
| Holen und Datenzugriff | nacheinander (Flaschenhals) | gleichzeitig möglich |
| Takte „Zwei Messwerte addieren“ | 13 | 7 |
| Programm überschreibt sich selbst | möglich | unmöglich, `STORE` trifft nur den Datenspeicher |
| Daten als Befehl ausführen | möglich | unmöglich, der Befehlszähler zeigt nur in den Programmspeicher |
| Vorteil | flexibel, einfach, ein großer Speicher für alles | schneller, sicherer |
| typisch | PCs, Laborserver, Raspberry Pi | Mikrocontroller (z. B. Arduino), Signalprozessoren |

In der Harvard-Stadt fahren zwei Lieferwagen: Während der eine eine Zahl aus dem Daten-Wohnblock holt, holt der andere schon den nächsten Befehl aus der Programm-Bibliothek. Das Protokoll zeigt für jedes Beispiel beide Taktzahlen und meldet, wenn sich die Ergebnisse unterscheiden.

> Moderne PCs sind übrigens eine Mischung: Der Arbeitsspeicher ist gemeinsam (von Neumann), im Prozessor gibt es aber getrennte Caches für Befehle und Daten (Harvard-Idee).

### Stufe 6: CPU und Grafikkarte

Das Rathaus hat 4 Rechenmeister mit 4 GHz, die Fabrikhalle der GPU 64 einfache Arbeiter mit 1,5 GHz. Pro Takt erledigt jeder Kern eine Teilaufgabe. Beide laufen auf einer **gemeinsamen Uhr**: Ein Schritt sind 0,25 ns (= 1 CPU-Takt). Die GPU schafft in derselben Zeit nur 0,375 Takte – deshalb sieht man im Rennen direkt, wer zuerst fertig ist.

| Aufgabe | CPU | GPU | schneller |
|---|---|---|---|
| Bild aufhellen (64 Pixel, unabhängig) | 16 Takte = 4 ns | 1 Takt ≈ 0,67 ns | GPU |
| 64 Sensorwerte kalibrieren (unabhängig) | 16 Takte = 4 ns | 1 Takt ≈ 0,67 ns | GPU |
| Nur 4 Messwerte kalibrieren (unabhängig, aber wenig Arbeit) | 1 Takt = 0,25 ns | 1 Takt ≈ 0,67 ns | CPU |
| Laufende Summe (16 Werte, abhängig) | 16 Takte = 4 ns | 16 Takte ≈ 10,67 ns | CPU |
| Regelung (16 Schritte, abhängig) | 16 Takte = 4 ns | 16 Takte ≈ 10,67 ns | CPU |

Merksatz: **Zeit = Takte : Taktfrequenz.** Viele Kerne helfen nur, wenn sich die Arbeit in unabhängige Teile zerlegen lässt **und** genug Arbeit für alle da ist. (In echt kommt bei der GPU noch der Transport der Daten über den Bus zur Grafikkarte und zurück dazu.)

## Erkunden und Freigabeprüfung

**Stadt erkunden** (Kopfzeile links): Beispielprogramm wählen und Schritt für Schritt durchgehen. Das Rathaus-Protokoll erklärt jeden Schritt, die Speicheransicht zeigt, welche Zelle gerade als Befehl gelesen, als Zahl gelesen oder beschrieben wird.

**Freigabeprüfung** (Kopfzeile rechts): Fragen zur Stufe, teils Multiple Choice, teils mit Zahlenantwort. Programme werden zufällig erzeugt, die richtige Antwort wird mit der Simulation berechnet.

- **5 richtige Antworten in Folge** ergeben das Prüfsiegel; ein Fehler setzt die Serie zurück, ebenso „Andere Frage“.
- Nach jeder Antwort steht die Erklärung im Protokoll, bei Programmfragen lässt sich mit „Ablauf zeigen“ das Programm in der Stadt durchspielen.
- Die Prüfsiegel werden im Browser gespeichert (localStorage). „zurücksetzen“ im Feld *Freigaben* löscht sie.

Beispiele für Prüfungsfragen:

| Stufe | Fragen |
|---|---|
| 1 | Wer holt und entschlüsselt Befehle? Was steht im Befehlszähler? Welcher Bus transportiert die Adresse? |
| 2 | Akku nach dem Befehl in Zelle k · Befehlszähler nach dem Holen · Anzahl der Busfahrten · `0x2D` entschlüsseln |
| 3 | Was passiert, wenn der Befehlszähler auf eine Zahl zeigt? Woran erkennt die CPU Befehle? Adresse in einem „Zahl-Befehl“ |
| 4 | Ausgabe einer Summen-Schleife · Anzahl der Schleifendurchläufe · Anzahl der Ausgaben beim Countdown |
| 5 | Unterschiede und Vorteile beider Architekturen · Takte eines Programms bei von Neumann bzw. Harvard |
| 6 | Takte bei n Pixeln und k Kernen · abhängige Aufgaben auf der GPU · kleine Aufgaben · Zeitvergleich mit Taktfrequenz |

## Bedienung

| Aktion | Wirkung |
|---|---|
| Stufen-Leiste (Reiter 1–6) | Freigabestufe wechseln, ✓ = Prüfsiegel vorhanden |
| Klick auf ein Gebäude (Stufe 1) | zur passenden Station der Stadtführung |
| Beispielprogramm / Aufgabe | Programm bzw. GPU-Aufgabe wählen |
| Stadt (Stufe 5) | von-Neumann- oder Harvard-Stadt |
| „Schritt“ oder **→** | nächster Schritt (Holen, Entschlüsseln, Ausführen) bzw. nächster Takt |
| „Automatisch“ oder **Leertaste** | ablaufen lassen / anhalten |
| „Neustart“ oder **R** | Programm von vorn |
| Tempo | langsam, mittel, schnell |
| Mond / Sonne oben rechts | dunkles oder helles Farbschema; die Wahl wird im Browser gespeichert und gilt für alle Lernsituationen |

## Ideen für den Unterricht

- **Einstieg:** Stufe 1 am Beamer, die Klasse ordnet die Gebäude den Bauteilen auf dem Arbeitsblatt „Interner Aufbau“ zu.
- **Befehlszyklus mitspielen:** Vier Schüler übernehmen Bürgermeisterin, Rechenmeister, Lieferwagen und Wohnblock und spielen „Zwei Messwerte addieren“ mit Zetteln nach. Die Simulation dient zur Kontrolle.
- **Bitmuster lesen:** Welche Zahl ist `LOAD 12`? Welcher Befehl ist die Zahl 37? (Verbindung zum Bit-Bahnhof und zu Hex.)
- **HALT vergessen:** Erst vorhersagen lassen, was passiert, dann durchsteppen. Warum steht am Ende 22 statt 92 in Zelle 6?
- **Selbstveränderndes Programm:** Was hat das mit Sicherheit zu tun? (Schadcode, der als „Daten“ eingeschleust und dann ausgeführt wird.)
- **Harvard-Vergleich:** Beide Fehlerprogramme in der Harvard-Stadt laufen lassen. Warum passiert dort nichts?
- **Flaschenhals:** Busfahrten von „Messwerte aufsummieren“ in beiden Städten zählen. Wie viel Prozent spart Harvard?
- **Ausblick 2. Schuljahr:** Der Arduino in Mikrocontrollertechnik ist ein Harvard-Rechner, der Raspberry Pi an der Modellanlage ein von-Neumann-Rechner.
- **Grafikkarte:** Warum trainiert man KI-Modelle auf Grafikkarten? Bei welcher Aufgabe aus dem Laborserver würde eine GPU nichts bringen?

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seite, bindet Schriften, p5.js und die Skripte ein |
| `style.css` | Gestaltung im Corporate Design der Schule |
| `maschine.js` | die Mini-CPU: Befehlssatz, Ver- und Entschlüsseln, Simulation für von Neumann und Harvard – reines JavaScript, ohne p5 |
| `stufen.js` | Freigabestufen, Beispielprogramme, Stadtführung, GPU-Aufgaben, Prüfungsfragen |
| `ui.js` | Knöpfe, Auswahllisten, Eingabefelder |
| `sketch.js` | Ablauf, Zeichnen: Stadt, Lieferwagen, Speicheransicht, Protokoll, GPU-Vergleich |
| `assets/logo-jps.png` | Logo der Jakob-Preh-Schule |
| `assets/logo-jps-hell.png` | Logo in Weiß für das dunkle Farbschema |
| `libraries/p5.min.js` | p5.js (lokal, damit die Seite auch offline läuft) |

### Ein eigenes Beispielprogramm ergänzen

In `stufen.js` einen Eintrag in `BSP` anlegen und seinen Namen in die Liste `beispiele` einer Stufe schreiben:

```js
meinProgramm: {
  name: "Mein Programm",
  text: "Was das Programm tun soll.",
  programm: { 0: "LOAD 12", 1: "ADD 13", 2: "STORE 14", 3: "HALT" },  // Befehle
  daten: { 12: 40, 13: 2, 14: 0 },                                    // Zahlen
  eingaben: [],                                                        // Messwerte für IN
},
```

Die Trennung in `programm` und `daten` benutzt nur die Harvard-Stadt. In der von-Neumann-Stadt landet beides im selben Speicher.

## Lokal starten

Am einfachsten in VS Code mit der Erweiterung **Live Server**: Rechtsklick auf `index.html` → „Open with Live Server“.

## Technische Hinweise

- Läuft mit **p5.js 1.x** (lokal mitgeliefert) und **p5.js 2.x**. Dafür verzichtet der Code bewusst auf Funktionen, die sich zwischen den Versionen geändert haben (z. B. `preload`, `loadFont`).
- Die Schriften (Quicksand, Inter, JetBrains Mono) kommen von Google Fonts. Ohne Internet weicht die Seite automatisch auf Systemschriften aus.
- Alle Schleifen haben geschweifte Klammern: Der p5-Web-Editor baut in Schleifen eine Endlosschleifen-Sicherung ein, die bei Schleifen ohne Klammern fehlschlägt.
- Die Simulation rechnet ein Programm vorab komplett durch (höchstens 150 Schritte, danach Meldung „Endlosschleife“). Die Anzeige blättert nur durch diese Schritte.
- Das Zeitmodell ist bewusst vereinfacht (1 Takt = 1 Busfahrt; bei Harvard läuft der Datenzugriff parallel zum Holen des nächsten Befehls). Echte Prozessoren brauchen je nach Befehl unterschiedlich viele Takte.
- Fehler in `draw()` werden abgefangen und als Hinweis angezeigt, statt das Programm einzufrieren.
- **Farbschema hell/dunkel:** Alle Farben stehen in zwei Paletten (`FARBE_HELL`, `FARBE_DUNKEL`); `FARBE` enthält die aktive Palette und wird beim Umschalten in place überschrieben. Die CSS-Variablen in `style.css` wechseln über die Klasse `dunkelmodus` am `<html>`-Element. Die Wahl steht im `localStorage` unter `jps-lernsituationen-farbschema` (ohne Speicher gilt die Systemeinstellung). Im dunklen Schema zeigt die Kopfzeile `assets/logo-jps-hell.png`.

## Lizenz

[![CC BY 4.0](https://img.shields.io/badge/Lizenz-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/deed.de)

**Platinenstadt · Der von-Neumann-Rechner** von **Christoph Rothaug, Jakob-Preh-Schule Bad Neustadt**, steht unter der Lizenz [Creative Commons Namensnennung 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.de). Der vollständige Lizenztext steht in der Datei [`LICENSE`](LICENSE).

Du darfst das Material (Quellcode, Texte, Aufgaben und Grafiken) kopieren, weitergeben und verändern, auch kommerziell. Dafür musst du

- den Urheber nennen: *Christoph Rothaug, Jakob-Preh-Schule Bad Neustadt*,
- auf die Lizenz verlinken: <https://creativecommons.org/licenses/by/4.0/deed.de>,
- angeben, ob du etwas verändert hast.

Vorschlag für die Namensnennung: *„Platinenstadt · Der von-Neumann-Rechner“ von Christoph Rothaug, Jakob-Preh-Schule Bad Neustadt, CC BY 4.0, https://github.com/FlowTheTensor/LS-Platinenstadt*

**Ausgenommen** von dieser Lizenz sind:

| Bestandteil | Rechte |
|---|---|
| `libraries/p5.min.js` | [p5.js](https://p5js.org), GNU LGPL 2.1 |
| `assets/logo-jps.png`, `assets/logo-jps-hell.png` | Logo der Jakob-Preh-Schule – alle Rechte bei der Schule |
| Schriften Quicksand, Inter, JetBrains Mono | über Google Fonts eingebunden, SIL Open Font License 1.1 |
