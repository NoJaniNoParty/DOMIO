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
      console.error('Greška pri učitavanju:', error)
    } else {
      setKucanstva(data)
    }
    setLoading(false)
  }

  // ucitaj kucanstva prvi put
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
        console.error('Greška pri učitavanju:', error)
      } else {
        setKucanstva(data)
      }
      setLoading(false)
    }

    dohvati()
    //cleanup stare komponente
    return () => { aktivan = false }
  }, [session.user.id])

    //onAuthStateChange listener detektira promjenu
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
          // ponovno ucitavanje u slucaju da je korisnik izasao iz trenutnog kucanstva
          ucitajKucanstva()
        }}/>
    )
  }

  return (
    <div className="container container-wide">
      <div className='made-by'><h4>Izradio Daniel Stjepić</h4></div>
      <div className="header">
          <h1>Domio</h1>
        <button onClick={handleLogout}>Odjavi se</button>
      </div>

      <p className="welcome">Bok, <strong>{session.user.user_metadata.ime}</strong>!</p>

      <h2>Tvoja kućanstva</h2>
      {loading ? (<p>Učitavanje...</p>) : kucanstva.length === 0 ? (
        <p className="empty">Nemas jos kućanstava. Kreiraj novo ili se pridruži postojećem!</p>) : ( 
        <div className="kucanstva-lista">
          {/*aaaaa ovo je bilo mukotrpno
          kucanstva.kucanstvo.kucanstva -> lista, element, tablica
          */}
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
        <button onClick={() => setShowKreiraj(true)}>+ Kreiraj kućanstvo</button>
        <button className="secondary" onClick={() => setShowPridruzi(true)}>Pridruži se</button>
      </div>

      {showKreiraj && (
        <KreirajKucanstvo
          //session={session}
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