import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import KreirajKucanstvo from './KreirajKucanstvo'
import PridruziSe from './PridruziSe'
import Kucanstvo from './Kucanstvo'

export default function Dashboard({ session }) {
  const [kucanstva, setKucanstva] = useState([])
  const [loading, setLoading] = useState(true)
  const [showKreiraj, setShowKreiraj] = useState(false)
  const [showPridruzi, setShowPridruzi] = useState(false)
  const [aktivnoKucanstvo, setAktivnoKucanstvo] = useState(null)

  // ucitavanje kucanstava
  const ucitajKucanstva = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('clanovi_kucanstva')
      .select(`
        uloga,
        kucanstva (
          id,
          naziv,
          pozivni_kod
        )
      `)
      .eq('korisnik_id', session.user.id)

    if (error) {
      console.error('Greska pri ucitavanju:', error)
    } else {
      setKucanstva(data)
    }
    setLoading(false)
  }

  // ucitaj kucanstva kad se pokrene
  useEffect(() => {
    let aktivan = true

    const dohvati = async () => {
      const { data, error } = await supabase
        .from('clanovi_kucanstva')
        .select(`
          uloga,
          kucanstva (
            id,
            naziv,
            pozivni_kod
          )
        `)
        .eq('korisnik_id', session.user.id)

      if (!aktivan) return

        if (error) {
        console.error('Greska pri ucitavanju:', error)
      } else {
        setKucanstva(data)
      }
      setLoading(false)
    }

    dohvati()

    return () => { aktivan = false }
  }, [session.user.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  
  // Ako je odabrano kucanstvo
  if (aktivnoKucanstvo)   {
    return (
      <Kucanstvo
        kucanstvo={aktivnoKucanstvo}
        session={session}
        onBack={() => {setAktivnoKucanstvo(null)
          ucitajKucanstva()
        }}/>
    )
  }

  return (
    <div className="container container-wide">
      <div className="header">
        <h1>Domio</h1>
        <button onClick={handleLogout}>Odjavi se</button>
      </div>

      <p className="welcome">Bok, <strong>{session.user.email}</strong>!</p>

      <h2>Tvoja kucanstva</h2>
      {loading ? (<p>Ucitavanje...</p>) : kucanstva.length === 0 ? (
        <p className="empty">Nemas jos kucanstava. Kreiraj novo ili se pridruzi postojecem!</p>) 
        : (
        <div className="kucanstva-lista">
          {/*aaaaa ovo je bilo mukotrpno*/}
          {kucanstva.map((kucanstvo) => (
            <div
              key={kucanstvo.kucanstva.id}
              className="kucanstvo-card"
              onClick={() => setAktivnoKucanstvo(kucanstvo.kucanstva)}>
              <h3>{kucanstvo.kucanstva.naziv}</h3>
              <p>Uloga: <strong>{kucanstvo.uloga}</strong></p>
              <p className="kod">Kod: {kucanstvo.kucanstva.pozivni_kod}</p>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-actions">
        <button onClick={() => setShowKreiraj(true)}>
          + Kreiraj kucanstvo
        </button>
        <button className="secondary" onClick={() => setShowPridruzi(true)}>
          Pridruzi se
        </button>
      </div>

      {showKreiraj && (
        <KreirajKucanstvo
          session={session}
          onClose={() => setShowKreiraj(false)}
          onSuccess={() => {
            setShowKreiraj(false)
            ucitajKucanstva()
          }}/>
      )}

      {showPridruzi && (
        <PridruziSe
          session={session}
          onClose={() => setShowPridruzi(false)}
          onSuccess={() => {
            setShowPridruzi(false)
            ucitajKucanstva()
          }}/>
      )}
    </div>
  )
}