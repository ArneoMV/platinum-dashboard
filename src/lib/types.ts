export type Klijent = { id:string; naziv:string; grad:string; regija:string; email:string; kontakt_osoba:string; uobicajena_narudzba:string; status:string; zadnji_kontakt:string; biljeska?:string };
export type Vino = { id:string; naziv:string; kategorija:string; sorta:string; porijeklo:string; pakiranje:string; alkohol:number; prodajna_cijena:number; nabavna_cijena:number; zaliha:number; biljeska?:string };
export type Narudzba = { id:string; datum:string; klijent_id:string; klijent_naziv:string; stavke:number; iznos:number; kanal:string; biljeska?:string };
export type Baza = { Klijenti:Klijent[]; Vina:Vino[]; Narudzbe:Narudzba[] };
