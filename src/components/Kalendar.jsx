import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Kalendar({ kucanstvoId, session }) {
  const [dogadaji, setDogadaji] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDogWin,setShowNewDogWin] = useState(false)

  
  const [naziv, setNaziv] = useState('')
  const [opis, setOpis] = useState('')
  const [pocetak, setPocetak] = useState('')
  const [kraj, setKraj] = useState('')
  const [cijeliDan, setCijeliDan] = useState(false)

  const ucitajDogadaje = async () => {
    const { data, error } = await supabase
      .from('dogadaji')
      .select('*, profili (ime, email)')
      .eq('kucanstvo_id', kucanstvoId)
      .order('pocetak', { ascending: true })

    if (error) {
      console.error('Greška:', error)
    } else {
      setDogadaji(data || [])
    }
  }

  useEffect(() => {
    let aktivan = true

    const ucitaj = async () => {
      
      const { data, error } = await supabase
        .from('dogadaji')
        .select('*, profili (ime, email)')
        .eq('kucanstvo_id', kucanstvoId)
        .order('pocetak', { ascending: true })

      if (!aktivan) return

      if (error) {
        console.error('Greška:', error)
      } else {
        setDogadaji(data || [])
      }
        

      setLoading(false)
    }

    ucitaj()

    const channel = supabase
      .channel(`dogadaji-${kucanstvoId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'dogadaji', filter: `kucanstvo_id=eq.${kucanstvoId}` },
        () => ucitajDogadaje()
    ).subscribe()

    return () => {
      aktivan = false
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kucanstvoId])

  const otvoriNewDogWin = () => {
    setNaziv('')
    setOpis('')
    setPocetak('')
    setKraj('')
    setCijeliDan(false)
    setShowNewDogWin(true)
  }

  const spremiDogadaj = async (e) => {
    e.preventDefault()
    if (!naziv.trim() || !pocetak) return

    const { error } = await supabase
      .from('dogadaji')
      .insert({
        kucanstvo_id: kucanstvoId,
        stvorio: session.user.id,
        naziv: naziv.trim(),
        opis: opis.trim() || null,
        pocetak: new Date(pocetak).toISOString(),
        kraj: kraj ? new Date(kraj).toISOString() : null,
        cijeli_dan: cijeliDan
      })

    if (error) {
      alert('Greška: ' + error.message)
    } else {
      setShowNewDogWin(false)
    }
  }

  const obrisiDogadaj = async (id) => {
    if (!confirm('Sigurno obrisati ovaj događaj?')) return

    const { error } = await supabase
      .from('dogadaji')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Greška: ' + error.message)
    } else {
      setDogadaji(prev => prev.filter(d => d.id !== id))
    }
  }

  const formatVrijeme = (datum) => {
    return new Date(datum).toLocaleTimeString('hr-HR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDatum = (datum) => {
    return new Date(datum).toLocaleDateString('hr-HR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // provjera je li dogadjaj aktivan
  const jeAktivan = (d) => {
    const sada = new Date()
    const pocetak = new Date(d.pocetak)
    let kraj
    //ako nema kraja racunaj da je 1 sat
    if (d.kraj) {
      kraj = new Date(d.kraj)
    } else if (d.cijeli_dan) {
      kraj = new Date(pocetak)
      kraj.setHours(23, 59, 59, 999)
    } else {
      kraj = new Date(pocetak.getTime() + 60 * 60 * 1000)
    }

    return pocetak <= sada && sada <= kraj
  }

  // prikaz jednog dogadjaja
  const renderirajDogadaj = (d, opcije = {}) => (
    <div 
      key={d.id} 
      className={`dogadaj-card ${opcije.prosli ? 'prosli' : ''}${opcije.aktivni ? 'aktivni' : ''}`}>
      <div className="dogadaj-info">
        <div className="dogadaj-naziv">{d.naziv}
        </div>
        <div className="dogadaj-meta">
          <span className="meta-tag">{formatDatum(d.pocetak)}</span>
          {!d.cijeli_dan && (<span className="meta-tag">{formatVrijeme(d.pocetak)}{d.kraj && ` - ${formatVrijeme(d.kraj)}`}</span>)}
          {d.cijeli_dan && <span className="meta-tag">Cijeli dan</span>}
          {d.kraj && (<span className="meta-tag">do {formatDatum(d.kraj)}</span>)}
          {d.profili && (<span className="meta-tag">{d.profili.ime}</span>)}
        </div>
        {d.opis && <div className="dogadaj-opis">{d.opis}</div>}
      </div>
      <button className="link delete-btn" onClick={() => obrisiDogadaj(d.id)}>X</button>
    </div>
  )

  if (loading) return <p className="empty">Učitavanje kalendara...</p>

  const sada = new Date()
  const aktivni = dogadaji.filter(d => jeAktivan(d))
  const nadolazeci = dogadaji.filter(d => new Date(d.pocetak) > sada && !jeAktivan(d))
  const prosli = dogadaji.filter(d => {
    if (!jeAktivan(d))
      return new Date(d.pocetak) < sada
  }).reverse()

  return (
    <div className="kalendar">
      <div className="financije-actions">
        <button onClick={otvoriNewDogWin}>+ Događaj</button>
      </div>

      {/* AKTIVNI */}
      <h3 className="lista-naslov-grupe">Trenutno aktivni ({aktivni.length})</h3>
      {aktivni.length === 0 ? (
        <p className="empty-mali">Nema trenutno aktivnih događaja.</p>) : (aktivni.map(d => renderirajDogadaj(d, { aktivni: true }))
      )}

      {/* NADOLAZECI */}
      <h3 className="lista-naslov-grupe">Nadolazeći ({nadolazeci.length})</h3>
      {nadolazeci.length === 0 ? (
        <p className="empty-mali">Nema nadolazećih događaja.</p>) : (nadolazeci.map(d => renderirajDogadaj(d))
      )}

      {/* PROSLI */}

      <h3 className="lista-naslov-grupe opasiti">Prošli ({prosli.length})</h3>
      {prosli.length === 0 ? (
        <p className="empty-mali">Nema prošlih događaja.</p>) : (prosli.slice(0,10).map(d => renderirajDogadaj(d, {prosli: true}))
      )}
     

      {showDogWin && (
        <div className="modal-overlay" onClick={() => setShowNewDogWin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Novi događaj</h2>
            <form onSubmit={spremiDogadaj}>
              <input
                type="text"
                placeholder="Naziv (npr. 'Putovanje')"
                value={naziv}
                onChange={(e) => setNaziv(e.target.value)}
                required
                autoFocus/>

              <textarea
                placeholder="Opis (opcionalno)"
                value={opis}
                onChange={(e) => setOpis(e.target.value)}/>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={cijeliDan}
                  onChange={(e) => setCijeliDan(e.target.checked)}/>Cijeli dan</label>

              <label>Početak:
                <input
                  type={cijeliDan ? 'date' : 'datetime-local'}
                  value={cijeliDan ? pocetak.split('T')[0] : pocetak}
                  onChange={(e) => setPocetak(e.target.value + (cijeliDan ? 'T00:00' : ''))}
                  required/>
              </label>

              <label>Kraj (opcionalno):
                <input
                  type={cijeliDan ? 'date' : 'datetime-local'}
                  value={cijeliDan ? (kraj ? kraj.split('T')[0] : '') : kraj}
                  onChange={(e) => setKraj(e.target.value + (cijeliDan && e.target.value ? 'T23:59' : ''))}/>
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowNewDogWin(false)}>Odustani</button>
                <button type="submit" disabled={!naziv.trim() || !pocetak}>Spremi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}