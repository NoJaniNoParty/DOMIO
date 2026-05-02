import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Financije({ kucanstvoId, session }) {
  const [proracuni, setProracuni] = useState([])
  const [troskovi, setTroskovi] = useState([])
  const [loading, setLoading] = useState(true)
  const [prikaz, setPrikaz] = useState('pregled')
  const [filterKategorija, setFilterKategorija] = useState('')
  
  // novi proracun
  const [showProracunModal, setShowProracunModal] = useState(false)
  const [proracunNaziv, setProracunNaziv] = useState('')
  const [proracunKategorija, setProracunKategorija] = useState('')
  const [proracunIznos, setProracunIznos] = useState('')
  const [proracunPeriod, setProracunPeriod] = useState('mjesecno')

  // novi trosak
  const [showTrosakModal, setShowTrosakModal] = useState(false)
  const [trosakIznos, setTrosakIznos] = useState('')
  const [trosakKategorija, setTrosakKategorija] = useState('')
  const [trosakOpis, setTrosakOpis] = useState('')
  const [trosakDatum, setTrosakDatum] = useState(new Date().toISOString().split('T')[0])

  // reload
  const ucitajPodatke = async () => {
    const { data: proracuniData } = await supabase
      .from('proracuni')
      .select('*')
      .eq('kucanstvo_id', kucanstvoId)
      .order('stvoren_u', { ascending: false })

    const { data: troskoviData } = await supabase
      .from('troskovi')
      .select('*, profili (ime, email)')
      .eq('kucanstvo_id', kucanstvoId)
      .order('datum', { ascending: false })

    setProracuni(proracuniData || [])
    setTroskovi(troskoviData || [])
  }

  useEffect(() => {
    let aktivan = true

    const ucitaj = async () => {
      const { data: proracuniData } = await supabase
        .from('proracuni')
        .select('*')
        .eq('kucanstvo_id', kucanstvoId)
        .order('stvoren_u', { ascending: false })

      const { data: troskoviData } = await supabase
        .from('troskovi')
        .select('*, profili (ime, email)')
        .eq('kucanstvo_id', kucanstvoId)
        .order('datum', { ascending: false })

      if (!aktivan) return

      setProracuni(proracuniData || [])
      setTroskovi(troskoviData || [])
      setLoading(false)
    }

    ucitaj()

    // azuriraj obje tablice sad
    const channel = supabase
      .channel(`financije-${kucanstvoId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'proracuni', filter: `kucanstvo_id=eq.${kucanstvoId}` },
        () => ucitajPodatke()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'troskovi', filter: `kucanstvo_id=eq.${kucanstvoId}` },
        () => ucitajPodatke()
      )
      .subscribe()

    return () => {
      aktivan = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kucanstvoId])

  // PRORACUN

  const otvoriProracunModal = () => {
    setProracunNaziv('')
    setProracunKategorija('')
    setProracunIznos('')
    setProracunPeriod('mjesecno')
    setShowProracunModal(true)
  }

  const spremiProracun = async (e) => {
    e.preventDefault()

    const { error } = await supabase
      .from('proracuni')
      .insert({
        kucanstvo_id: kucanstvoId,
        naziv: proracunNaziv.trim(),
        kategorija: proracunKategorija.trim(),
        iznos: parseFloat(proracunIznos),
        period: proracunPeriod
      })

    if (error) {
      alert('Greska: ' + error.message)
    } else {
      setShowProracunModal(false)
    }
  }

  const obrisiProracun = async (id) => {
    if (!confirm('Sigurno obrisati ovaj proracun?')) return

    const { error } = await supabase
      .from('proracuni')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Greska: ' + error.message)
    } else {
      setProracuni(prev => prev.filter(p => p.id !== id))
    }
  }

  // TROSAK

  const otvoriTrosakModal = (kategorijaPrijedlog = '') => {
    setTrosakIznos('')
    setTrosakKategorija(kategorijaPrijedlog)
    setTrosakOpis('')
    setTrosakDatum(new Date().toISOString().split('T')[0])
    setShowTrosakModal(true)
  }

  const spremiTrosak = async (e) => {
    e.preventDefault()

    const { error } = await supabase
      .from('troskovi')
      .insert({
        kucanstvo_id: kucanstvoId,
        platio: session.user.id,
        iznos: parseFloat(trosakIznos),
        kategorija: trosakKategorija.trim(),
        opis: trosakOpis.trim() || null,
        datum: trosakDatum
      })

    if (error) {
      alert('Greska: ' + error.message)
    } else {
      setShowTrosakModal(false)
    }
  }

  const obrisiTrosak = async (id) => {
    if (!confirm('Sigurno obrisati ovaj trosak?')) return

    const { error } = await supabase
      .from('troskovi')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Greska: ' + error.message)
    } else {
      setTroskovi(prev => prev.filter(t => t.id !== id))
    }
  }

  //ababab

  const formatIznos = (iznos) => {
    return parseFloat(iznos).toLocaleString('hr-HR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €'
  }

  const formatDatum = (datum) => {
    return new Date(datum).toLocaleDateString('hr-HR')
  }

  // Izracunaj potroseno za ovaj proracun za sada
  const potrosenoZaProracun = (proracun) => {
    const sada = new Date()
    let pocetakPerioda
    

    
    if (proracun.period === 'mjesecno') {
      pocetakPerioda = new Date(sada.getFullYear(), sada.getMonth(), 1)
    } else { 
      pocetakPerioda = new Date(sada.getFullYear(), 0, 1)
    }

    return troskovi
      .filter(t => 
        t.kategorija === proracun.kategorija &&
        new Date(t.datum) >= pocetakPerioda
      )
      .reduce((sum, t) => sum + parseFloat(t.iznos), 0)
  }

  // ukupno potroseno ovaj mjesec
  const ukupnoOvajMjesec = () => {
    const pocetakMjeseca = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    return troskovi
      .filter(t => new Date(t.datum) >= pocetakMjeseca)
      .reduce((sum, t) => sum + parseFloat(t.iznos), 0)
  }

  // lista kategorija
  const sveKategorije = [...new Set([
    ...proracuni.map(p => p.kategorija),
    ...troskovi.map(t => t.kategorija)
  ])].sort()

  // filtrirani troskovi
  const filtriraniTroskovi = filterKategorija ? troskovi.filter(t => t.kategorija === filterKategorija) : troskovi

  if (loading) return <p className="empty">Ucitavanje financija...</p>

  return (
    <div className="financije">
      
      <div className="financije-prikazi">
        <button
          className={`tab ${prikaz === 'pregled' ? 'active' : ''}`}
          onClick={() => setPrikaz('pregled')}>Pregled
        </button>
        <button
          className={`tab ${prikaz === 'proracuni' ? 'active' : ''}`}
          onClick={() => setPrikaz('proracuni')}>Proracuni
        </button>
        <button
          className={`tab ${prikaz === 'troskovi' ? 'active' : ''}`}
          onClick={() => setPrikaz('troskovi')}>Troskovi
        </button>
      </div>

      
      {prikaz === 'pregled' && (
        <>
          <div className="finance-summary">
            <div className="summary-card big">
              <div className="summary-label">Ukupno ovaj mjesec</div>
              <div className="summary-value">{formatIznos(ukupnoOvajMjesec())}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Aktivni proracuni</div>
              <div className="summary-value">{proracuni.length}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Ukupno troskova</div>
              <div className="summary-value">{troskovi.length}</div>
            </div>
          </div>

          <h3 className="lista-naslov-grupe">Status proracuna</h3>
          {proracuni.length === 0 ? (
            <p className="empty-mali">Nemas jos proracuna. Definiraj ih u tabu "Proracuni"!</p>) : ( proracuni.map(proracun => {
              const potroseno = potrosenoZaProracun(proracun)
              const limit = parseFloat(proracun.iznos)
              const postotak = Math.min((potroseno / limit) * 100, 100)
              const presao = potroseno > limit
              const blizu = potroseno > limit * 0.8 && !presao

              return (
                <div key={proracun.id} className={`proracun-progress ${presao ? 'presao' : blizu ? 'blizu' : ''}`}>
                  <div className="proracun-header">
                    <div>
                      <strong>{proracun.naziv}</strong>
                      <span className="meta-tag" style={{marginLeft: 8}}>{proracun.kategorija}</span>
                    </div>
                    <div className="proracun-iznosi">
                      {formatIznos(potroseno)} / {formatIznos(limit)}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{width: `${Math.min(postotak, 100)}%`}}
                    />
                  </div>
                  {presao && (
                    <div className="upozorenje">⚠️ Presao si proracun za {formatIznos(potroseno - limit)}!</div>
                  )}
                  {blizu && (
                    <div className="upozorenje warn">⚠️ Iskoristio si {postotak.toFixed(0)}% proracuna</div>
                  )}
                </div>
              )
            })
          )}
        </>
      )}

     
      {prikaz === 'proracuni' && (
        <>
          <div className="financije-actions">
            <button onClick={otvoriProracunModal}>+ Proracun</button>
          </div>

          {proracuni.length === 0 ? ( <p className="empty">Nemas jos proracuna. Kreiraj prvi!</p> ) : ( proracuni.map(proracun => (
              <div key={proracun.id} className="proracun-card">
                <div className="dogadaj-info">
                  <div className="dogadaj-naziv">{proracun.naziv}</div>
                  <div className="dogadaj-meta">
                    <span className="meta-tag">{proracun.kategorija}</span>
                    <span className="meta-tag">{formatIznos(proracun.iznos)}</span>
                    <span className="meta-tag">{proracun.period}</span>
                  </div>
                </div>
                <button className="link delete-btn" onClick={() => obrisiProracun(proracun.id)}>✕</button>
              </div>
            ))
          )}
        </>
      )} 

      
      {prikaz === 'troskovi' && (
        <>
          <div className="financije-actions">
            <select 
              value={filterKategorija} 
              onChange={(e) => setFilterKategorija(e.target.value)}
              className="filter-select">
              <option value="">Sve kategorije</option>
              {sveKategorije.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <button onClick={() => otvoriTrosakModal()}>+ Trosak</button>
          </div>

          {filtriraniTroskovi.length === 0 ? (
            <p className="empty">Nema troskova. Dodaj prvi!</p>) : (filtriraniTroskovi.map(trosak => (
              <div key={trosak.id} className="trosak-card">
                <div className="trosak-iznos">{formatIznos(trosak.iznos)}</div>
                <div className="dogadaj-info">
                  <div className="dogadaj-naziv">{trosak.opis || trosak.kategorija}</div>
                  <div className="dogadaj-meta">
                    <span className="meta-tag">{trosak.kategorija}</span>
                    <span className="meta-tag">{formatDatum(trosak.datum)}</span>
                    {trosak.profili && (
                      <span className="meta-tag">
                        👤 {trosak.profili.ime || trosak.profili.email}
                      </span>
                    )}
                  </div>
                </div>
                <button className="link delete-btn" onClick={() => obrisiTrosak(trosak.id)}>✕</button>
              </div>
            ))
          )}
        </>
      )}

      
      {showProracunModal && (
        <div className="modal-overlay" onClick={() => setShowProracunModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Novi proracun</h2>

            <form onSubmit={spremiProracun}>
              <input
                type="text"
                placeholder="Naziv (npr. 'Hrana')"
                value={proracunNaziv}
                onChange={(e) => setProracunNaziv(e.target.value)}
                required
                autoFocus/>
              <input
                type="text"
                placeholder="Kategorija (npr. 'Hrana', 'Rezije')"
                value={proracunKategorija}
                onChange={(e) => setProracunKategorija(e.target.value)}
                required/>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Iznos (€)"
                value={proracunIznos}
                onChange={(e) => setProracunIznos(e.target.value)}
                required/>
              <select
                value={proracunPeriod}
                onChange={(e) => setProracunPeriod(e.target.value)}>
                <option value="mjesecno">Mjesecno</option>
                <option value="godisnje">Godisnje</option>
              </select>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowProracunModal(false)}>Odustani</button>
                <button type="submit">Spremi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOVI TROSKOVI*/}
      {showTrosakModal && (
        <div className="modal-overlay" onClick={() => setShowTrosakModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Novi trosak</h2>

            <form onSubmit={spremiTrosak}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Iznos (€)"
                value={trosakIznos}
                onChange={(e) => setTrosakIznos(e.target.value)}
                required
                autoFocus/>
              <input
                type="text"
                placeholder="Kategorija"
                value={trosakKategorija}
                onChange={(e) => setTrosakKategorija(e.target.value)}
                list="kategorije-prijedlozi"
                required/>
              <datalist id="kategorije-prijedlozi">
                {sveKategorije.map(k => (
                  <option key={k} value={k} />
                ))}
              </datalist>
              <input
                type="text"
                placeholder="Opis (opcionalno)"
                value={trosakOpis}
                onChange={(e) => setTrosakOpis(e.target.value)}/>
              <input
                type="date"
                value={trosakDatum}
                onChange={(e) => setTrosakDatum(e.target.value)}
                required/>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowTrosakModal(false)}>Odustani</button>
                <button type="submit">Spremi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}