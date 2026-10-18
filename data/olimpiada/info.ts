/**
 * Olimpiada Wiedzy Ekonomicznej – informacje z oficjalnych źródeł (owe.pte.pl): regulamin XL OWE,
 * „Informator o XL OWE” (struktura pytań i punktacja), kalendarium XL OWE, lista haseł przewodnich.
 * Stan na `AS_OF`; przy nowej edycji – zaktualizować dane i datę.
 */

export const AS_OF = "18 października 2026 r.";
export const SOURCES = {
  site: "https://owe.pte.pl/",
  regulamin: "https://owe.pte.pl/informacje/program-i-regulamin.html",
  informator: "https://owe.pte.pl/upload/files/informatory/informator-o-xl-owe.pdf",
  kalendarium: "https://owe.pte.pl/informacje/informacje-ogolne/ramowy-harmonogram-zawodow.html",
  haslo: "https://owe.pte.pl/informacje/informacje-ogolne/opis-hasla-biezacej-edycji.html",
  archiwum: "https://owe.pte.pl/informacje/poprzednie-edycje/zestawy-pytan-z-poprzednich-edycji.html",
  edycje: "https://owe.pte.pl/informacje/poprzednie-edycje.html",
};

export const ORGANIZER =
  "Organizatorem jest Polskie Towarzystwo Ekonomiczne (Warszawa, ul. Nowy Świat 49). Zawody przeprowadzają Komitet Główny, 17 Komitetów Okręgowych przy oddziałach PTE oraz Komisje Szkolne.";

export const GOALS = [
  "pobudzanie i rozwijanie zainteresowań młodzieży problematyką społeczno-ekonomiczną oraz kierunkami rozwoju Polski na tle gospodarki światowej",
  "propagowanie kultury ekonomicznej i zasad racjonalnego gospodarowania",
  "upowszechnianie nowoczesnej wiedzy ekonomicznej",
  "wyłanianie i wspieranie rozwoju najbardziej utalentowanej młodzieży oraz zachęcanie jej do podejmowania studiów wyższych",
];

export const WHO =
  "Uczniowie liceów ogólnokształcących, techników oraz branżowych szkół I i II stopnia w Polsce; także uczniowie szkół podstawowych (zwłaszcza z indywidualnym programem lub tokiem nauki) rekomendowani przez szkołę. Udział zgłasza się przez szkołę.";

export interface StagePart { label: string; pts: number; note?: string; practice?: { href: string; label: string } }
export interface Stage {
  id: "I" | "II" | "III"; name: string; date: string; where: string; form: string; time?: string;
  parts: StagePart[]; total: number; extra?: { title: string; parts: StagePart[]; total: number; note: string };
  next: string;
}

export const STAGES: Stage[] = [
  {
    id: "I", name: "Zawody I stopnia (szkolne)", date: "18 listopada 2026 r., godz. 10:00", where: "w szkołach, które zgłosiły udział",
    form: "pisemna – w XL edycji wyłącznie test jednokrotnego wyboru (zmiana względem poprzednich edycji)", time: "60 minut",
    parts: [{ label: "50 pytań testowych jednokrotnego wyboru: +2 pkt za poprawną, −1 pkt za błędną odpowiedź", pts: 100, practice: { href: "/", label: "Test jednokrotnego wyboru – etap szkolny" } }],
    total: 100,
    next: "Do II stopnia przechodzi 300 osób z najwyższym wynikiem w rankingu ogólnopolskim (przy remisie na granicy – wszyscy z tą samą liczbą punktów). Listę uzupełniają „dzikie karty” z okręgów, tak by z okręgu przeszło łącznie 10% jego uczestników (najwyżej 100 osób z okręgu, co najmniej 5).",
  },
  {
    id: "II", name: "Zawody II stopnia (okręgowe)", date: "14 stycznia 2027 r., godz. 11:00", where: "w 17 komitetach okręgowych przy oddziałach PTE w największych miastach",
    form: "pisemna, anonimowa; każdą pracę oceniają niezależnie co najmniej dwie osoby z jury (wynik to średnia)",
    parts: [
      { label: "Pytanie o charakterze ogólnym (przekrojowym) nawiązujące do hasła przewodniego – część teoretyczna", pts: 15, practice: { href: "/eseje", label: "Eseje z poprzednich lat" } },
      { label: "… część praktyczna", pts: 10 },
      { label: "Zadanie z analizy finansowej", pts: 15, practice: { href: "/zadania", label: "Zadania z poprzednich lat" } },
      { label: "30 pytań testowych jednokrotnego wyboru (po 2 pkt)", pts: 60, practice: { href: "/", label: "Test – etap okręgowy" } },
    ],
    total: 100,
    next: "Do III stopnia przechodzi 100 osób z najwyższym wynikiem. Przy remisie na granicy decydują kolejno: punkty z testu, punkty z zadania analitycznego, a przy dalszym remisie przechodzą wszyscy z tą samą liczbą punktów.",
  },
  {
    id: "III", name: "Zawody III stopnia (centralne)", date: "3–4 kwietnia 2027 r.", where: "Falenty (woj. mazowieckie)",
    form: "pisemna (pierwszego dnia) i ustna (drugiego dnia, dla osób z minimum kwalifikacyjnym ustalonym przez jury)",
    parts: [
      { label: "Pytanie o charakterze ogólnym nawiązujące do hasła przewodniego – część teoretyczna", pts: 15, practice: { href: "/eseje", label: "Eseje z poprzednich lat" } },
      { label: "… część praktyczna", pts: 10 },
      { label: "Zadanie analityczne – interpretacja zjawisk i tendencji w gospodarce", pts: 15, practice: { href: "/zadania", label: "Zadania z poprzednich lat" } },
      { label: "30 pytań testowych wielokrotnego wyboru (do 2 pkt, punktowane 0–1–2)", pts: 60, practice: { href: "/", label: "Test wielokrotnego wyboru" } },
    ],
    total: 100,
    extra: {
      title: "Część ustna", total: 35,
      parts: [
        { label: "Jedno dwuczłonowe pytanie (teoretyczno-praktyczne) z wylosowanego zestawu", pts: 20 },
        { label: "Wypowiedź na jeden z pięciu tematów podanych przed zawodami (temat wskazuje jury)", pts: 15 },
      ],
      note: "Odpowiedź ocenia trzyosobowy zespół jury; wynik to średnia, zaokrąglona w górę do pełnego punktu. Od części ustnej nie ma odwołania.",
    },
    next: "Tytuł laureata otrzymuje 30 osób z najwyższą łączną liczbą punktów (maks. 135). Pozostali uczestnicy zawodów centralnych są finalistami, jeśli zdobyli co najmniej 30% punktów części pisemnej. Przy remisie decydują: test, zadanie analityczne, cała część pisemna.",
  },
];

export const CALENDAR: { date: string; what: string; main?: boolean }[] = [
  { date: "30 października 2026 r.", what: "zgłoszenie udziału szkoły (liczba uczestników, skład Komisji Szkolnej) – termin przesunięty z 7 października" },
  { date: "18 listopada 2026 r.", what: "zawody I stopnia (szkolne), godz. 10:00", main: true },
  { date: "25 listopada 2026 r.", what: "przekazanie prac z zawodów I stopnia do Komitetów Okręgowych" },
  { date: "do 2 grudnia 2026 r.", what: "wstępne wyniki zawodów I stopnia (Komitety Okręgowe)" },
  { date: "do 8 grudnia 2026 r.", what: "lista zakwalifikowanych do zawodów II stopnia" },
  { date: "14 stycznia 2027 r.", what: "zawody II stopnia (okręgowe), godz. 11:00", main: true },
  { date: "6 lutego 2027 r.", what: "lista zakwalifikowanych do zawodów III stopnia wraz z wynikami" },
  { date: "do 28 lutego 2027 r.", what: "pisemne zawiadomienia o zakwalifikowaniu do zawodów centralnych" },
  { date: "3–4 kwietnia 2027 r.", what: "zawody III stopnia (centralne)", main: true },
  { date: "4 kwietnia 2027 r.", what: "lista laureatów" },
  { date: "do 30 czerwca 2027 r.", what: "uroczyste spotkanie z laureatami – dyplomy, zaświadczenia i nagrody" },
];

export const RULES = [
  "Na zawody trzeba zabrać dokument ze zdjęciem (np. legitymację), przybory do pisania, linijkę i prosty kalkulator – bez funkcji telefonu, internetu i zapisu tekstu; kalkulatory graficzne i programowalne są niedozwolone.",
  "Korzystanie z jakichkolwiek pomocy, telefonu albo porozumiewanie się z innymi uczestnikami oznacza dyskwalifikację.",
  "W teście każda zmiana zaznaczonej odpowiedzi jest traktowana jako odpowiedź błędna; odpowiedzi zaznaczone ołówkiem nie są punktowane.",
  "Wątpliwości merytoryczne do pytań można zgłaszać w ciągu 3 dni od zawodów I i II stopnia oraz w ciągu 2 godzin od części pisemnej zawodów III stopnia.",
  "Klucz odpowiedzi do zawodów II stopnia jest publikowany na stronie Olimpiady w ciągu 24 godzin od ich zakończenia.",
  "Uczestnikom zawodów II stopnia zwracane są koszty podróży; na zawodach centralnych organizator zapewnia też zakwaterowanie i wyżywienie.",
];

export const REWARDS = [
  "Laureaci i finaliści są zwolnieni z części pisemnej egzaminu zawodowego w zawodach technik ekonomista i technik rachunkowości (z najwyższym wynikiem).",
  "Przy rekrutacji na studia laureaci i finaliści mają uprawnienia określone w uchwałach senatów poszczególnych uczelni – sprawdź zasady na stronie wybranej uczelni.",
  "Nagrody pieniężne i stypendia od mecenasów (w XXXIX edycji m.in. 5000 zł za 1. i 2. miejsce, stypendia po 3800 zł), notebooki NBP dla laureatów, książki, staże na GPW.",
  "5 najlepszych uczestników reprezentuje Polskę na Międzynarodowej Olimpiadzie Ekonomicznej.",
];

/** Hasła przewodnie wszystkich edycji (numer rzymski, rok szkolny, hasło). */
export const THEMES: { ed: string; n: number; year: string; theme: string }[] = [
  ["I", "1987/1988", "Polska reforma gospodarcza 1982 r."], ["II", "1988/1989", "Pieniądz i rynek"],
  ["III", "1989/1990", "Nowy ład społeczno-gospodarczy"], ["IV", "1990/1991", "Przedsiębiorczość i efektywność gospodarowania"],
  ["V", "1991/1992", "Restrukturyzacja i wzrost gospodarczy"], ["VI", "1992/1993", "Pieniądz, kredyt i rynek kapitałowy"],
  ["VII", "1993/1994", "Przedsiębiorczość i inwestowanie"], ["VIII", "1994/1995", "Praca i zarządzanie"],
  ["IX", "1995/1996", "Polska w procesie integracji europejskiej: współpraca – konkurencyjność"], ["X", "1996/1997", "Polityka finansowa w rozwoju gospodarczym"],
  ["XI", "1997/1998", "Badania rynkowe i marketing"], ["XII", "1998/1999", "Globalizacja gospodarki"],
  ["XIII", "1999/2000", "Decentralizacja finansów publicznych"], ["XIV", "2000/2001", "Rola rynku kapitałowego w rozwoju gospodarczym Polski"],
  ["XV", "2001/2002", "Rynek pracy w epoce cywilizacji informacyjnej"], ["XVI", "2002/2003", "Gospodarka Polski wobec integracji z Unią Europejską"],
  ["XVII", "2003/2004", "Przedsiębiorstwo w warunkach globalizacji"], ["XVIII", "2004/2005", "Polityka regionalna i fundusze strukturalne Unii Europejskiej"],
  ["XIX", "2005/2006", "Ryzyko w działalności gospodarczej"], ["XX", "2006/2007", "Kapitał ludzki i innowacyjność w gospodarce polskiej"],
  ["XXI", "2007/2008", "Gospodarstwo domowe – wymiar społeczno-ekonomiczny"], ["XXII", "2008/2009", "Środowisko naturalne w procesie gospodarowania"],
  ["XXIII", "2009/2010", "Wahania koniunktury a rozwój gospodarki"], ["XXIV", "2010/2011", "Człowiek w świecie pieniądza"],
  ["XXV", "2011/2012", "W poszukiwaniu nowego ładu ekonomicznego"], ["XXVI", "2012/2013", "Nierównowagi w gospodarce. Przyczyny i skutki"],
  ["XXVII", "2013/2014", "Strefa euro – szansa czy zagrożenie?"], ["XXVIII", "2014/2015", "Polska droga do wolności gospodarczej. 25 lat transformacji"],
  ["XXIX", "2015/2016", "Nierówności społeczne a rozwój gospodarczy"], ["XXX", "2016/2017", "Państwo a gospodarka"],
  ["XXXI", "2017/2018", "Wyzwania współczesnego rynku pracy"], ["XXXII", "2018/2019", "Gospodarka światowa – wolny handel czy protekcjonizm?"],
  ["XXXIII", "2019/2020", "Gospodarka i społeczeństwo w erze czwartej rewolucji przemysłowej"], ["XXXIV", "2020/2021", "Ekonomia wobec kryzysów. Gospodarcze i społeczne skutki pandemii"],
  ["XXXV", "2021/2022", "Rola giełd w rozwoju społeczno-gospodarczym"], ["XXXVI", "2022/2023", "W świecie rosnącej inflacji. Wymiar mikro- i makroekonomiczny"],
  ["XXXVII", "2023/2024", "Kapitał społeczny w procesie gospodarowania"], ["XXXVIII", "2024/2025", "Polska w Unii Europejskiej – bilans XX-lecia"],
  ["XXXIX", "2025/2026", "Protekcjonizm w teorii i w praktyce"], ["XL", "2026/2027", "Gospodarka wobec wyzwań demograficznych"],
].map(([ed, year, theme], i) => ({ ed, n: i + 1, year, theme }));

export const CURRENT_THEME = THEMES[THEMES.length - 1];
export const THEME_SCOPE = [
  "demografia i jej kluczowe zjawiska: prognozy liczby ludności świata, spadek dzietności, wydłużanie życia, starzenie się społeczeństw, migracje i urbanizacja",
  "wpływ demografii na gospodarkę: od teorii Malthusa, przez podaż pracy i produktywność, po oszczędności, stopy procentowe i rynek finansowy",
  "srebrna gospodarka – zmiany w konsumpcji osób starszych",
  "finanse publiczne: koszty polityki demograficznej, wydatki na emerytury, zdrowie, edukację i opiekę długoterminową, erozja bazy podatkowej",
];
