import React from 'react';
import ReactDOM from 'react-dom';
import SmartbookEditor from './smartbook-editor';
import ReactTestRenderer from 'react-test-renderer';

let mockCount = 0;
// IMPORTANT: Mocking randomness of Draft.js. Otherwise snapshot-tests will fail!
jest.mock('draft-js/lib/generateRandomKey', () => () => `key${mockCount++}`);

const norskText = 
`
Sherlock Holmes.


HOLMES, som vanligvis var meget sent oppe om morgenen, untatt i de ikke sjeldne tilfellene da han var oppe hele natten — satt ved frokostbordet.

Jeg stod på kaminteppet og tok opp stokken som vår gjest den foregående aften hadde etterlatt seg. Den var forarbeidet av vakkert, fast tre, og hadde et løkformet hode. Like under håndtaket gikk et nesten tommebredt sølvbånd.

Til doktor James Mortimer fra hans venner i C. C. H. var inngravert på båndet sammen med årstallet 1884.

Det var nettopp en slik stokk som eldre husleger pleier å ha med seg — respektabel, solid og anselig.

“Nå, Watson, hva får De ut av den?”

Holmes satt med ryggen til meg, og jeg hadde ikke gitt ham noe slags vink om hva jeg holdt på med.

“Hvordan kunne De vite hva jeg tok meg til? Jeg tror De har øyne i nakken.”

“Jeg har i alle fall vår blankpussede sølvkaffekanne foran meg,” sa han. “Men, si meg, Watson, hva får De ut av stokken? Siden vi har vært så uheldige at eiermannen er blitt borte for oss, og vi ikke vet noe om hans ærende, får dette tilfeldige etterlatenskap betydning. La meg høre hvordan De ser for Dem mannen etter å ha undersøkt hans stokk.”

“Jeg tror,” sa jeg, i det jeg fulgte så godt jeg kunne min venns fremgangsmåte, “at Doktor Mortimer er en meget populær eldre lege, velansett, siden de som kjente ham ga ham dette tegn på sin respekt.”

“Godt!” sa Holmes. “Utmerket!”

“Jeg tror også at det er sannsynlig at han er en landsens lege som gjør en stor del av sine sykebesøk til fots.”

“Hvorfor det?”

“Fordi stokken her, som opprinnelig var meget pen, er så medtatt at jeg vanskelig kan tenke meg at en en bylege ville gå med den. Den tykke jerndoppskoen er så utslitt at det er klart at han må ha brukt den meget på fotturer.”

“Nokså fornuftig!” sa Holmes.

“Og så er det dette med venner i C. C. H. Jeg skulle anta at dette har noe med harejakt å gjøre, et lokalt jaktselskap, hvor han muligens har bistått medlemmer med legehjelp, og som til vederlag har skjenket ham en liten oppmerksomhet.”

“De overgår virkelig Dem selv, Watson,” sa Holmes, skjøv stolen tilbake og tente en sigarett. “Jeg må si at De i alle de fortellingene som De har vært så vennlig å gi om mine små foretagender, har hatt for vane å underordne Deres egen dyktighet. Det kan nok være at De ikke er selvlysende, men De er allikevel en lysbringer. Noen mennesker har, uten selv å være genier, en merkelig evne til å fremme geniet hos andre. Jeg innrømmer, kjære venn, at jeg står i stor gjeld til Dem.”

Han hadde aldri før sagt så mye, og jeg må tilstå at hans ord gledet meg mye, siden jeg hadde ofte følt meg støtt over hvor likegyldig han var for min beundring og de forsøk jeg hadde gjort på å få hans fremgangsmåter offentlig kjent. Jeg var også stolt ved tanken på at jeg i den grad hadde tilegnet meg hans system at jeg kunne anvende det på en måte som vakte hans bifall.

Han tok nå stokken fra meg og undersøkte den i noen minutter med blotte øyne. Deretter la han med en interessert mine sigaretten vekk, tok stokken bort til vinduet og betraktet den igjen nøye gjennom en lupe.

“Interessant, skjønt alminnelig,” sa han, i det han satte seg i sitt yndlingshjørne i sofaen. “Det er utvilsomt et par antydninger på stokken. De gir oss grunnlag for adskillige slutninger.”

“Har noe ungått meg?” spurte jeg med en viss selvfølelse. “Jeg skulle tro at det ikke er noe av betydning som jeg har oversett?”

“Jeg er redd, kjære Watson, at de fleste av Deres slutninger er feil. Når jeg sa at De ansporet meg, mente jeg ærlig talt at ved å merke meg Deres feiltagelser er jeg av og til ledet på rett vei. Ikke så å forstå at De i dette tilfelle har urett i alle Deres slutninger. Mannen er sikkert landslege. Og han ferdes også meget til fots.”

“Altså har jeg rett?”

“For så vidt.”
    `; 
    
const gaeilgeText = 
`
CBE NA CILLE 


Thomáisín beannaithe chugam as an gCnoc an t-am sin a 
mb’éigin Tomáisín a cheangal go deireannach. Dúirt mé leo an 
chrois sin a chur orm freisin. Is cuidsúlaí go mór í ná uu eeann 
seo. ó a thuit an chrois se« ó ghasúir Phádraig, tá cor ca&gt;n 
sa Slánaiodóir uirthi. An Slánaíodóir atá ar an gceann dubh 
is mór an áilleacht é. Céard sin orm? Nach iné atá dearmad- 
ach i gcónaí. Sin í faoi mo cheann í. Nach mairg nacli hí a 
chuir siad ar mo chliabhrach . . . 

Bhí acu snaidhm ni b’fhearr a chur ar an bpáidrin ar mo 
mhéarachaí. Neil fhéin, go siúráilte, a rinne é sin. Bheadli 
sásamh aici dhá dtuiteadh sé ar an talamh san am a raibli siad 
do mo chur i gcónra. A Thiarna Thiarna, b’fhada amach uaimse 
a d’fhanfadh sí sin . . . 

Tá súil agam gur las siad na hocht gcoinneal as cionn mo 
chónra sa séipéal. D’fhág mé faoi réir acu iad, i gcúinne an 
chomhra faoi pháipéir an chíosa. Sin rud nach raibh ariamh 
ar chorp sa séipéal sin : ocht gcoinneal. Ní raibh ar an gCur- 
raoineach ach cheithre cinn. Sé cinn ar Liam Thomáis Táilliúr, 
ach tá inín Jeis sin sna mná rialta i Meiriocá . . . 

Tri leath-bhairille pórtair adúirt mé a chur orm, agus gheall 
Eamonn na Tamhnaí dhom fhéin dhá mbeadh deoir ar bith faoi 
shliabh go dtiocfadh sé leis gan cuireadh gan iarraidh. Níorbh 
fholáir sin agus a mbeadh d’altóir ann. Ceathair déag nó cúig 
déag de phunta ar a laghad ar bith. Chuaigh duine nó scilling 
naim i gcuid mhaith áiteachaí nach raibh sochraide ar bith dlite 
dhom iontu, le cúig nó sé de bhlianta ó a d’airigh mé mé fhéin 
ag tabhairt uaim. Is dóigh gur tháinig lucht an tsléibhe uilig. 
Ba bhocht dóibh nach dtiocfadh. Bhíomar acu. Sin cúnamh 
maith de phnnt ar an gcéad iarraidh. Agus muintir Dhoire 
Locha leanfaidís sin na cliamhaineachaí. Sin cúnamh maith 
de phunt eile. Agus bhí sochraide dlite ag Gleann na Buaile 

as éadan dom ... Ní bheadh íontas orm mara dteagadh 

Stiofán Bán. Bhíomar ag chuile shochraide ariarnh aige. Ach 
déarfadh sé nar chuala sé é, nó go raibh mé curtha. Agus an 

ghailimaisíocht a bheadh ansin air: “ Go deimhin dhuit a 


14 



CBÉ NA CILLE 


Phádraig Uí Loideáin, dhá mbeadh féitli de mo chroí air, bheinn 
ag an tso'chraide. Níor ehumaoin domsa gan a theacht ar 
shochraide Chaitríona Pháidín dhá mba ar mo ghlúine a ghabii- 
fainn ann. Ach dheamhan smid a chuala mé faoi go dtí an 
oíche ar cuireadh í. Scurach le . . . ” An sciaibéara ós é 
Stiofán Bán é ! . . . 

Dheamhan a fhios agnm ar caoineadh go maith mé. Gan 
bhréig gan mhagadh tá racht breá bogúrach ag Bid Shorcha 
mara raibh sí ro-óltach. Tá mé siúráilte go raibh Neil ag 
imeacht ag diúgaireacht ann freisin. Neil ag caoineadh agus 
gan deoir len a grua, an smuitín ! A dúshlán sin an teach a 
thaobhachtáil agus mise beo . . . 

Tá sí sásta anois. Shil rné go mairfinn cupla bliain eile, agus 
go gcuirfinn rómham an raicleach, Thug sí anuas go mór ó 
d'eirigh an gortú dhá mac. Bhíodh sí ag dul coitiannta go ieor 
ag an dochtúr le scathamh roimhe sin fhéin. Ach ní brí a bhfuil 
uirthi. Scoilteachaí. Ní thiúrfaidh siad sin aon bhás di go 
ceann fada. Tá sí an-phrámhaí uirthi fhéin. Sin caoi nach 
raibh rnise. Anois atá a fhios agam é. Mharaigh mé mé fhéin 
le obair agus luainn . . . Dhá dtapaínn an phian sin shul a 
ndeachaigh sí in ainsil orm. Ach ó a bhuailfeas sé sna dúánaf 
duine tá a chaiscín meilte . . . 

Bhí dhá bhliain agam ar Neil, ar aon chor . . . Baba. Ansin 
mise agus Neil. Bliain go Féil Míchil seo caite a fuair mé an 
pinsean. Ach fuair mé roimh an am é. Tá Baba suas agus 
anuas le trí déag agus cheithre fichid. Is gearr an bás uaithi 
anois, th’éis a díchill. Ní raibh an mhuintir se’againne saolach. 
Ach a bhfaighe sí scéal mo bháis-se, beidh a fliios aici gur beag 
é a seal fhéin, agus déanfaidh sí a huachta go cinnte . . . Ag 
Neil a fhágfas sí chuile chianóg ag gabháil léi. Tá sásamh 
maith ag an smuitín orm ina dhiaidh sin. Tá Baba blite suas 
aici. Ach dhá bhfaghainnse saol nó go ndéanfadh Baba uachta 
déarfainn go dtiúrfadh sí leath an airgid dom de bhuíochas Ne.il. 
Duine sách luath intinneach í Baba. Chugamsa is mó a bhf 
sí ag scríobhadh le trí bliana anois ó d’athraigh sí ó mhuintir 
    `;


it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<SmartbookEditor />, div);
});

/*
it('renders correctly', () => {
    const tree = renderer
        .create(<SmartbookEditor 
                    textAlignment='left'
                    bookFirst={norskText}
                    bookSecond={gaeilgeText} 
                />)
        .toJSON();
    expect(tree).toMatchSnapshot();
});*/


it('simple initial parameters', () => {
    const text1 = "1row1\n1row2";
    const text2 = "2row1\n2row2\n2row3";
    const tree = ReactTestRenderer
        .create(<SmartbookEditor 
                    textAlignment='left'
                    bookFirst={text1}
                    bookSecond={text2}
                    editorKey="mykey"
                />)
        .toJSON();
    expect(tree).toMatchSnapshot();
});