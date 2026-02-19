# Errori Checker

Applicazione per la revisione sistematica degli errori sui cataloghi.

## Come fare il deploy su GitHub Pages

### 1. Crea il repository su GitHub
- Vai su github.com → **New repository**
- Nome: `errori-checker` (deve corrispondere al `base` in `vite.config.js`)
- Visibilità: Public o Private (Pages funziona con entrambi)

### 2. Subi il codice
```bash
cd errori-checker
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/TUO_UTENTE/errori-checker.git
git push -u origin main
```

### 3. Attiva GitHub Pages
- Nel repository → **Settings** → **Pages**
- Source: **GitHub Actions**
- Salva

### 4. Deploy automatico
Il workflow si avvia automaticamente ad ogni push su `main`.
L'app sarà disponibile su:
```
https://TUO_UTENTE.github.io/errori-checker/
```

---

## ⚠️ Se il nome del repository è diverso da `errori-checker`

Modifica `vite.config.js`:
```js
base: '/NOME_DEL_TUO_REPO/',
```

## Sviluppo locale

```bash
npm install
npm run dev
```

## Funzionalità
- Carica il file `Errori_table_normalizado.xlsx`
- Assegna stati a ogni errore: Pendente / In revisione / Fatto / Non eseguibile
- I progressi vengono salvati nel browser (localStorage)
- Filtra per stato, cerca per ID catalogo
- Esporta il log in Excel
