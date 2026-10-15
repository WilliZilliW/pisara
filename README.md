# Pisara

Otsosoftin selainpeli, jossa vesipisaroita liikutellaan lotuksenlehdellä puhelinta kallistamalla. Tavoite on yhdistää kaikki pisarat yhdeksi menettämättä liikaa vettä.

**Pelaa:** https://willizilliw.github.io/pisara/

**Android:** https://github.com/WilliZilliW/pisara/releases/latest/download/Pisara.apk (uusin virallinen versio)

**Android-testiversio:** https://github.com/WilliZilliW/pisara/releases/download/testi/Pisara.apk (uusin main)

## Pelaaminen

- **Puhelin:** kallista. Asento, jossa pidät puhelinta tason alkaessa, on suora.
- **Kosketus tai hiiri:** paina ruutua siihen suuntaan, johon haluat kallistaa. Puhelimen kallistusohjauksen saa pois vesimittarin vieressä olevasta puhelinnapista, jolloin pisaroita ohjataan pelkällä kosketuksella.
- **Näppäimistö:** nuolinäppäimet, R aloittaa tason alusta.

Peli on suomeksi ja englanniksi. Kieli valitaan laitteen kielen mukaan, ja sen voi vaihtaa valikon oikeasta yläkulmasta (FI · EN).

Jokaisella tasolla on raja sille, paljonko vedestä saa menettää. Vettä menee, kun reikää pienempi pisara putoaa lehden läpi tai kun törmäyksestä irronneet roiskepisarat haihtuvat. Tasoja on 90 yhdeksässä maailmassa. Ensimmäiset 60 kuudessa maailmassa (Kaste, Sadekuuro, Helle, Sammal, Ukkonen, Lampi) etenevät helposta vaikeaan. Matkan varrella tulee vastaan lehden kohoumia, joista pisarat kimpoavat, aurinkoläikkiä, jotka haihduttavat vettä, ja sammalta, joka hidastaa pisaroita. Tason 10 jälkeen lehden reunaan tulee aukkoja: ensin yksi kulma, myöhemmin useampi kulma ja lopulta myös kohtia sivuilla. Aukosta valunut pisara putoaa lampeen.

Kun taso 60 on läpi, avautuu seitsemäs maailma Vesivärit (tasot 61–70). Siinä värilliset portit päästävät läpi vain samanvärisen pisaran. Pisarat värjäytyvät väripisteistä (punainen, keltainen, sininen), ja portin värin saa vain sekoittamalla: keltainen + sininen = vihreä, punainen + keltainen = oranssi, punainen + sininen = violetti, ja kaikki kolme tekevät kurasta, joka ei pääse minkään portin läpi. Kirkas vesipiste huuhtelee värin pois. Pisaroissa, väripisteissä ja porteissa näkyvät värisymbolit (punainen ▲, keltainen ●, sininen ■). Ne saa pois ▲●■-napista valikosta tai väritasoilla pelinäkymästä.

Kahdeksas maailma Hunaja (tasot 71–80) tuo kuusikulmaiset hunajakennot. Kennon läpi kulkenut pisara muuttuu tahmeaksi: se liikkuu hitaasti, ei kimpoa eikä halkea, ja reiän kohdalla se tarttuu reiän reunaan ja kiertää sitä pitkin putoamatta. Hunaja leviää yhdistyessä, ja huuhtelupiste pesee sen pois. Hitaan pisaran kiinni saa nopealla pisaralla keskellä lehteä, missä mikään seinä ei pysäyttäisi kumpaakaan.

Yhdeksäs maailma Monsuuni (tasot 81–90) yhdistää kaiken aiemman: reiät, kohoumat, auringot, sammaleen, reuna-aukot, väriportit ja hunajan.

Kaikki tasot avautuvat samalla tavalla: seuraava taso aukeaa, kun edellinen on läpäisty tai ohitettu.

## Tiedostot

- `index.html` – koko peli yhdessä tiedostossa (GitHub Pages näyttää tämän).
- `pisara.html` – sama peli ilman `<html>`/`<head>`-runkoa, Claude-artifaktina julkaisua varten.
- `android/`, `capacitor.config.json` – Android-sovellus (Capacitor 8), joka näyttää pelin `www/`-kansiosta.
- `assets/` – sovelluskuvakkeiden ja käynnistyskuvan lähdekuvat (piirtää `tools/kuvat.ps1`), `kauppa/` – Play-kaupan kuvat. Puhelimen kuvakaappaukset suomeksi ja englanniksi (`kauppa/kuvakaappaukset/fi/` ja `en/`, 1080 × 2160) otetaan komennolla `sh tools/kuvakaappaukset.sh` (tarvitsee Node.js:n ja Chromen).
- `tietosuoja.html` – tietosuojaseloste: https://willizilliw.github.io/pisara/tietosuoja.html

Muutokset tehdään `pisara.html`-tiedostoon. `sh build.sh` tekee siitä `index.html`:n, ja `sh tools/sovellus.sh` tekee sovellusversion `www/`-kansioon (fontit mukana, toimii ilman verkkoa). `npm run rakenna` tekee molemmat ja synkronoi Android-projektin.

## Android

Android-projekti rakennetaan Java 21:llä (projektin Gradle 8.14 ei toimi Java 25:llä):

```bash
npm install
```

```bash
npm run rakenna
```

```bash
cd android && ./gradlew assembleDebug
```

### Julkaisu

Virallinen versio tehdään tagista. Pushaa tagi, esimerkiksi `v1.1`, niin [.github/workflows/julkaisu.yml](.github/workflows/julkaisu.yml) rakentaa latausavaimella allekirjoitetun APK:n ja AAB:n:

- **APK** julkaistaan tagin GitHub-releasena, joka merkitään uusimmaksi. Uusin virallinen APK on aina osoitteessa https://github.com/WilliZilliW/pisara/releases/latest/download/Pisara.apk.
- **AAB** ladataan automaattisesti Google Playhin kanavalle, jonka repomuuttuja `PLAY_TRACK` kertoo (oletus `alpha` = suljettu testaus, tuotanto `production`). Julkaisutiedote luetaan tiedostoista `kauppa/julkaisutiedote/whatsnew-fi-FI` ja `whatsnew-en-US`, jotka päivitetään ennen tagia. Lataus vaatii salaisuuden `PLAY_SERVICE_ACCOUNT_JSON` (Google Play -palvelutilin avain); ilman sitä lataus ohitetaan ja AAB haetaan ajon liitteestä käsin. AAB on ajon liitteenä vuorokauden.

Play allekirjoittaa oman kopionsa Googlen avaimella, joten GitHubista ja Playsta asennetut versiot eivät päivitä toisiaan.

```bash
git tag v1.1
```

```bash
git push origin v1.1
```

Versionumero (versionCode) lasketaan tagista: `v1.1` → 10100, `v1.1.2` → 10102. Työnkulun voi ajaa myös käsin (Actions → Play-julkaisu → Run workflow) ja antaa version itse.

Allekirjoitus tehdään latausavaimella, joka luetaan repon salaisuuksista `PISARA_UPLOAD_KEYSTORE_BASE64`, `PISARA_KEYSTORE_PASSWORD`, `PISARA_KEY_ALIAS` ja `PISARA_KEY_PASSWORD`. Avainta tai salasanoja ei pidetä repossa.

### Ohitusten myynti

Android-sovelluksessa (Google Playsta asennettuna) voi ostaa ohituksia, kun ilmaiset kolme on käytetty: ohitusnappiin tulee plusmerkki, ja epäonnistuneen tason ruudussa on Osta ohituksia -nappi. Ostot hoitaa Google Play Billing liitännäisellä `@capgo/native-purchases`. Play Consolessa tuotteen pitää olla sovelluksen sisäinen kertatuote tunnisteella `ohitukset_3` (3 ohitusta). Ostettu ohitus käytetään kerran, ilmaiset palautuvat edelleen. Peli kirjaa oston ensin edistymiseensä ja kuluttaa sen vasta sitten, ja kesken jääneet ostot haetaan, kun sovellus käynnistyy tai palaa etualalle. Verkkoversiossa ostoja ei ole, eikä niihin pidä luottaa GitHubin APK:ssa, joka on allekirjoitettu eri avaimella kuin Play-versio.

### Testiversio

GitHub Actions ([.github/workflows/apk.yml](.github/workflows/apk.yml)) tekee testi-APK:n jokaisesta mainiin pushatusta muutoksesta ja julkaisee sen esijulkaisuna `testi`, joka korvaa edellisen: https://github.com/WilliZilliW/pisara/releases/download/testi/Pisara.apk. Testiversiot allekirjoitetaan repon avaimella `android/testiavain.keystore` (Androidin julkinen oletussalasana `android`), joten uusi testiversio asentuu edellisen päälle mutta ei virallisen version päälle.

## Testaus

`sh tools/testi.sh` tekee testisivun `_testi.html`, jolla tasot voi tarkistaa selaimessa:

- `pisaraAnalysis.all()` tarkistaa tasojen geometrian: pääseekö jokainen pisara muiden luo, mitkä pisarat pitää yhdistää ennen kuin ne mahtuvat reiän ohi, riittääkö vesi ja alkaako jokin pisara reuna-aukon vieressä.
- `pisaraSolver.followAll(PISARA_OHJEET)` pelaa jokaisen tason `tools/ohjeet.js`-tiedoston läpipeluuohjeilla ja kertoo, menikö taso läpi.
- `await pisaraSolver.solve(n)` etsii uuden läpipeluuohjeen tasolle n (numerointi alkaa nollasta), jos tasoa on muutettu.
