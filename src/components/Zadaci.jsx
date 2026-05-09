import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Zadaci({ kucanstvoId, session }) {
  const [liste, setListe] = useState([])
  const [zadaci, setZadaci] = useState({})
  const [clanovi, setClanovi] = useState([])
  const [loading, setLoading] = useState(true)
  const [novaLista, setNovaLista] = useState('')
  const [otvorenaLista, setOtvorenaLista] = useState(null)
  const [noviZadatak, setNoviZadatak] = useState('')
  const [noviRok, setNoviRok] = useState('')
  const [noviDodijeljen, setNoviDodijeljen] = useState('')
  const [editDodjelaId, setEditDodjelaId] = useState(null)

  //ne loadaj clanove svaki put nepotrebno je
  const ucitajPodatke = async () => {
    //sve liste otvorenog kucanstva
    const { data: listeData } = await supabase
      .from('liste_zadataka')
      .select('*')
      .eq('kucanstvo_id', kucanstvoId)
      .order('stvoren_u', { ascending: true })
    //svi zadaci assignani na te liste
    const listaIds = (listeData || []).map(l => l.id)
    let zadaciData = []
    if (listaIds.length > 0) {
      const { data } = await supabase
        .from('zadaci')
        .select('*, profili (ime, email)')
        .in('lista_id', listaIds)
        .order('stvoren_u', { ascending: true })
      zadaciData = data || []
    }

    setListe(listeData || [])
    //pogledaj jel postoji lista sa idjem zadatka, ako ne stvori praznu
    const grupirano = {}
    zadaciData.forEach(z => {
      if (!grupirano[z.lista_id]) grupirano[z.lista_id] = []
      grupirano[z.lista_id].push(z)
    })
    setZadaci(grupirano)
  }

 
  useEffect(() => {
    let aktivan = true

    const ucitajSve = async () => {
      const { data: listeData } = await supabase
        .from('liste_zadataka')
        .select('*')
        .eq('kucanstvo_id', kucanstvoId)
        .order('stvoren_u', { ascending: true })

      if (!aktivan) return

      const listaIds = (listeData || []).map(l => l.id)
      let zadaciData = []
      if (listaIds.length > 0) {
        const { data } = await supabase
          .from('zadaci')
          .select('*, profili (ime, email)')
          .in('lista_id', listaIds)
          .order('stvoren_u', { ascending: true })
        zadaciData = data || []
      }

      const { data: clanoviData } = await supabase
        .from('clanovi_kucanstva')
        .select('korisnik_id, profili (id, ime, email)')
        .eq('kucanstvo_id', kucanstvoId)

      if (!aktivan) return

      setListe(listeData || [])
      setClanovi(clanoviData || [])

      const grupirano = {}
      zadaciData.forEach(z => {
        if (!grupirano[z.lista_id]) grupirano[z.lista_id] = []
        grupirano[z.lista_id].push(z)
      })
      setZadaci(grupirano)
      setLoading(false)
    }

    ucitajSve()

    
    const channel = supabase
      .channel(`zadaci-i-liste-${kucanstvoId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'liste_zadataka', filter: `kucanstvo_id=eq.${kucanstvoId}` },
        () => ucitajPodatke()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'zadaci' },
        () => ucitajPodatke()
      )
      .subscribe()

      return () => {
        aktivan = false
        supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kucanstvoId])

  
  const kreirajListu = async (e) => {
    e.preventDefault()
    if (!novaLista.trim()) return

    const { error } = await supabase
      .from('liste_zadataka')
      .insert({
        kucanstvo_id: kucanstvoId,
        naziv: novaLista.trim(),
        stvorio: session.user.id
      })

    if (error) {
      alert('Greska: ' + error.message)
    } else {
      setNovaLista('')
    }
  }

 //pitanje
  const obrisiListu = async (listaId) => {
    if (!confirm('Sigurno obrisati listu i sve njene zadatke?')) return

    const { error } = await supabase
      .from('liste_zadataka')
      .delete()
      .eq('id', listaId)

    if (error) alert('Greska: ' + error.message)
    if (otvorenaLista === listaId) setOtvorenaLista(null)
  }

  //rok i dodijeljeno ne mora biti ispunjeno
  const dodajZadatak = async (listaId) => {
    if (!noviZadatak.trim()) return

    const { error } = await supabase
      .from('zadaci')
      .insert({
        lista_id: listaId,
        naziv: noviZadatak.trim(),
        rok: noviRok || null,
        dodijeljeno: noviDodijeljen || null
      })

    if (error) {
      alert('Greska: ' + error.message)
    } else {
      setNoviZadatak('')
      setNoviRok('')
      setNoviDodijeljen('')
    }
  }

  
  const toggleGotovo = async (zadatak) => {
    const { error } = await supabase
      .from('zadaci')
      .update({ zavrseno: !zadatak.zavrseno })
      .eq('id', zadatak.id)

      if (error) alert('Greska: ' + error.message)
  }

  
  const obrisiZadatak = async (zadatakId) => {
    const { error } = await supabase
      .from('zadaci')
      .delete()
      .eq('id', zadatakId)

      if (error) alert('Greska: ' + error.message)
  }
  const promijeniDodjelu = async (zadatakId, noviKorisnikId) => {
    const { error } = await supabase
      .from('zadaci')
      .update({ dodijeljeno: noviKorisnikId || null })
      .eq('id', zadatakId)

      if (error) {
        alert('Greska: ' + error.message)
      }
  // zatvori prozor
      setEditDodjelaId(null)  
  }

 
  const formatDatum = (datum) => {
    if (!datum) return null
    const d = new Date(datum)
    return d.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  
  //vrati ako zadatak nije gotov do roka
  const rokProsao = (rok, zavrseno) => {
    if (!rok || zavrseno) return false
    const danas = new Date()
    danas.setHours(0, 0, 0, 0)
    const datum = new Date(rok)
    return datum < danas
  }

  if (loading) return <p className="empty">Ucitavanje zadataka...</p>

  return (
    <div className="zadaci">
      <form className="nova-lista-forma" onSubmit={kreirajListu}>
        <input
          type="text"
          placeholder="Naziv nove liste (npr. 'Kupovina')"
          value={novaLista}
          onChange={(e) => setNovaLista(e.target.value)}/>
        <button type="submit" disabled={!novaLista.trim()}>+ Lista</button>
      </form>

      {liste.length === 0 ? (
        <p className="empty">Nemas jos lista. Kreiraj prvu!</p>) : (<div className="liste-container">
          {liste.map(lista => {
            const listaZadaci = zadaci[lista.id] || []
            const otvorena = otvorenaLista === lista.id
            const gotovo = listaZadaci.filter(z => z.zavrseno).length
            const ukupno = listaZadaci.length
            return (
              <div key={lista.id} className="lista-card">
                <div className="lista-header">
                  <button
                    className="lista-naslov"
                    onClick={() => setOtvorenaLista(otvorena ? null : lista.id)}>
                    <span>{otvorena ? '▼' : '▶'} {lista.naziv}</span>
                    <span className="lista-brojac">{gotovo}/{ukupno}</span>
                  </button>
                  <button className="link delete-btn" onClick={() => obrisiListu(lista.id)}>X
                  </button>
                </div>
                {otvorena && (
                  <div className="lista-sadrzaj">
                    
                    {listaZadaci.length === 0 ? (
                      <p className="empty-mali">Nema zadataka u ovoj listi.</p>) : (listaZadaci.map(zadatak => (
                        <div
                          key={zadatak.id}
                          className={`zadatak ${zadatak.zavrseno ? 'gotov' : ''}${rokProsao(zadatak.rok, zadatak.zavrseno) ? 'kasni' : ''}`}>
                          <input
                            type="checkbox"
                            checked={zadatak.zavrseno}
                            onChange={() => toggleGotovo(zadatak)}/>
                          <div className="zadatak-info">
                            <div className="zadatak-naziv">{zadatak.naziv}</div>
                            <div className="zadatak-meta">        
                              {editDodjelaId === zadatak.id ? (
                                <select
                                  value={zadatak.dodijeljeno || ''}
                                  onChange={(e) => promijeniDodjelu(zadatak.id, e.target.value)}
                                  onBlur={() => setEditDodjelaId(null)}
                                  autoFocus
                                  className="dodjela-select">
                                  <option value="">Bez dodjele</option>
                                    {clanovi.map(c => (
                                      <option key={c.korisnik_id} value={c.korisnik_id}>
                                        {c.profili.ime}
                                      </option>
                                  ))}
                                  </select>) : (
                                  <span 
                                    className="meta-tag dodjela-tag" 
                                    onClick={() => setEditDodjelaId(zadatak.id)}
                                    title="Klikni za promjenu dodjele">
                                    {zadatak.profili ? zadatak.profili.ime : 'Bez dodjele'}
                                  </span>)}

                                  {zadatak.rok && (
                                    <span className={`meta-tag ${rokProsao(zadatak.rok, zadatak.zavrseno) ? 'rok-kasni' : ''}`}>
                                     {formatDatum(zadatak.rok)}
                                    </span>
                                  )}
                              </div>
                          </div>
                          <button
                            className="link delete-btn"
                            onClick={() => obrisiZadatak(zadatak.id)}>X
                          </button>
                        </div>
                      ))
                    )}

                    
                    <div className="novi-zadatak-forma">
                        <input
                          type="text"
                          placeholder="Novi zadatak..."
                          //RESETIRANJE AKO SE OTVORI JEDNA NAKON DRUGE KOJA IMA TEKST U SEBI
                          value={otvorena ? noviZadatak : ''}
                         onChange={(e) => setNoviZadatak(e.target.value)}/>
                      <div className="novi-zadatak-meta">
                        <input
                          type="date"
                          value={noviRok}
                          onChange={(e) => setNoviRok(e.target.value)}
                          title="Rok"/>
                        <select
                          value={noviDodijeljen}
                          onChange={(e) => setNoviDodijeljen(e.target.value)}>
                          <option value="">Nije dodijeljeno</option>
                          {clanovi.map(c => (
                            <option key={c.korisnik_id} value={c.korisnik_id}>
                              {c.profili.ime}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => dodajZadatak(lista.id)}
                          disabled={!noviZadatak.trim()}>+ Dodaj
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}