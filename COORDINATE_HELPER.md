# 🎯 HELPER PER TROVARE COORDINATE DAI SETTORI

Basato sulla griglia 60 colonne x 85 righe (10x10 pixel per cella)

## 📐 FORMULA PER CONVERTIRE SETTORE → COORDINATE

Dato un numero di settore, ecco come calcolare X e Y:

```
SETTORE = numero che vedi nel PDF (esempio: 611, 612, 1100, ecc.)

Colonna = (SETTORE - 1) % 60
Riga = Math.floor((SETTORE - 1) / 60)

X = Colonna × 10
Y = (84 - Riga) × 10

(Il PDF è alto 841.89, con 85 righe da 10px = 850, origine in basso)
```

## 📝 ESEMPI:

### Settore 611:
- Colonna: (611-1) % 60 = 610 % 60 = **10**
- Riga: (611-1) / 60 = 610 / 60 = **10** (floor)
- X: 10 × 10 = **100**
- Y: (84-10) × 10 = 74 × 10 = **740**
- **Coordinate: X=100, Y=740**

### Settore 612:
- Colonna: (612-1) % 60 = 611 % 60 = **11**
- Riga: (612-1) / 60 = 611 / 60 = **10** (floor)
- X: 11 × 10 = **110**
- Y: (84-10) × 10 = **740**
- **Coordinate: X=110, Y=740**

### Settore 1100:
- Colonna: (1100-1) % 60 = 1099 % 60 = **19**
- Riga: (1100-1) / 60 = 1099 / 60 = **18** (floor)
- X: 19 × 10 = **190**
- Y: (84-18) × 10 = 66 × 10 = **660**
- **Coordinate: X=190, Y=660**

---

## 🎯 COSA FARE:

1. Apri **PDF_CAMPIONE_CON_GRIGLIA.pdf**
2. Per ogni campo compilato, trova il **numero del settore rosso** più vicino
3. Dimmi il numero del settore per ogni campo
4. Io calcolo le coordinate esatte!

## 📋 LISTA CAMPI DA MAPPARE:

### PAGINA 1 - SEZIONE 1 (Antragsteller):

```
[ ] Checkbox Frau (X): settore ____
[ ] Checkbox Herr: settore ____
[ ] Vorname "Maria": settore ____
[ ] Name "Schmidt": settore ____
[ ] Straße "Musterstraße 123": settore ____
[ ] PLZ/Ort "51063 Köln": settore ____
[ ] Telefon "+49 221 12345678": settore ____
[ ] E-Mail "maria.schmidt@example.com": settore ____
[ ] Checkbox Pflegegrad 1: settore ____
[ ] Checkbox Pflegegrad 2: settore ____
[ ] Checkbox Pflegegrad 3 (X): settore ____
[ ] Checkbox Pflegegrad 4: settore ____
[ ] Checkbox Pflegegrad 5: settore ____
[ ] Checkbox gesetzlich (X): settore ____
[ ] Checkbox privat: settore ____
[ ] Checkbox beihilfeberechtigt: settore ____
[ ] Checkbox Ortsamt (X): settore ____
[ ] Ortsamt text "sozialamt": settore ____
```

### PAGINA 1 - SEZIONE 2 (Angehörige):

```
[ ] Checkbox Frau (X): settore ____
[ ] Checkbox Herr: settore ____
[ ] Vorname "Thomas": settore ____
[ ] Name "Schmidt": settore ____
[ ] Straße "Beispielweg 45": settore ____
[ ] PLZ/Ort "50667 Köln": settore ____
[ ] Telefon "+49 221 98765432": settore ____
[ ] E-Mail "thomas.schmidt@example.com": settore ____
[ ] Checkbox Familienangehörige (X): settore ____
[ ] Checkbox Private Pflegeperson: settore ____
[ ] Checkbox Betreuer: settore ____
```

### PAGINA 2 - HEADER:

```
[ ] Name, Vorname "Schmidt, Maria": settore ____
[ ] Geburtsdatum "15.03.1955": settore ____
[ ] Versichertennummer "A123456789": settore ____
[ ] Anschrift "Musterstraße 123, 51063 Köln": settore ____
[ ] Pflegekasse "AOK Rheinland/Hamburg": settore ____
```

---

## 💡 SUGGERIMENTO:

Puoi anche darmi i settori **approssimativi** se tra due numeri:
- "tra 611 e 612" → userò il centro
- "circa 1100" → va benissimo
- "settore 1520-1525" → prendo il centro

Inizia anche solo con **alcuni campi** - non serve tutto insieme!
