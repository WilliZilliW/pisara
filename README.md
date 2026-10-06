# Pisara

Selainpeli, jossa vesipisaroita liikutellaan lotuksenlehdellä puhelinta kallistamalla. Tavoite on yhdistää kaikki pisarat yhdeksi menettämättä liikaa vettä.

**Pelaa:** https://willizilliw.github.io/pisara/

## Pelaaminen

- **Puhelin:** kallista. Asento, jossa pidät puhelinta tason alkaessa, on suora.
- **Kosketus tai hiiri:** paina ruutua siihen suuntaan, johon haluat kallistaa.
- **Näppäimistö:** nuolinäppäimet, R aloittaa tason alusta.

Jokaisella tasolla on raja sille, paljonko vedestä saa menettää. Vettä menee, kun reikää pienempi pisara putoaa lehden läpi tai kun törmäyksestä irronneet roiskepisarat haihtuvat. Tasoja on 60 kuudessa maailmassa (Kaste, Sadekuuro, Helle, Sammal, Ukkonen, Lampi) helposta vaikeaan. Matkan varrella tulee vastaan lehden kohoumia, joista pisarat kimpoavat, aurinkoläikkiä, jotka haihduttavat vettä, ja sammalta, joka hidastaa pisaroita. Tason 10 jälkeen lehden reunaan tulee aukkoja: ensin yksi kulma, myöhemmin useampi kulma ja lopulta myös kohtia sivuilla. Aukosta valunut pisara putoaa lampeen.

## Tiedostot

- `index.html` – koko peli yhdessä tiedostossa (GitHub Pages näyttää tämän).
- `pisara.html` – sama peli ilman `<html>`/`<head>`-runkoa, Claude-artifaktina julkaisua varten.

`index.html` tehdään `pisara.html`-tiedostosta komennolla `sh build.sh`, joten muutokset tehdään `pisara.html`-tiedostoon.

## Testaus

`sh tools/testi.sh` tekee testisivun `_testi.html`, jolla tasot voi tarkistaa selaimessa:

- `pisaraAnalysis.all()` tarkistaa tasojen geometrian: pääseekö jokainen pisara muiden luo, mitkä pisarat pitää yhdistää ennen kuin ne mahtuvat reiän ohi, riittääkö vesi ja alkaako jokin pisara reuna-aukon vieressä.
- `pisaraSolver.followAll(PISARA_OHJEET)` pelaa jokaisen tason `tools/ohjeet.js`-tiedoston läpipeluuohjeilla ja kertoo, menikö taso läpi.
- `await pisaraSolver.solve(n)` etsii uuden läpipeluuohjeen tasolle n (numerointi alkaa nollasta), jos tasoa on muutettu.
