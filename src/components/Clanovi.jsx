import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function Clanovi({ kucanstvoId, session, onClose }) {
  const [clanovi, setClanovi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let aktivan = true

    const dohvati = async () => {
      const { data, error: rpcError } = await supabase
        .rpc('dohvati_clanove', { p_kucanstvo_id: kucanstvoId })

      if (!aktivan) return

      if (rpcError) {
        setError('Greška: ' + rpcError.message)
      } else {
        setClanovi(data || [])
      }
      setLoading(false)
    }
    dohvati()
    return () => { aktivan = false }
  }, [kucanstvoId])

  
  //  format datuma joina
  const formatDatum = (datum) => {
    return new Date(datum).toLocaleDateString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

   
  const trenutni = (korisnikId) => korisnikId === session.user.id

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Članovi kućanstva</h2>

        {loading ? (<p className="empty-mali">Učitavanje...</p>) : error ? (
          <p className="message">{error}</p>) : (
          <div className="clanovi-lista">
            {clanovi.map(clan => (
              <div key={clan.korisnik_id} className="clan-card">
                <div className="clan-info">
                  <div className="clan-ime">
                    {clan.ime}
                    {trenutni(clan.korisnik_id) && <span className="ti-tag">(ti)</span>}
                  </div>
                  <div className="clan-meta">
                    <span className={`uloga-tag ${clan.uloga}`}>
                      {clan.uloga === 'vlasnik' ? 'Vlasnik' : 'Clan'}
                    </span>
                    <span className="meta-tag">Od {formatDatum(clan.pridruzen_u)}</span>
                  </div>
                </div>
              </div>
            ))}

            <p className="empty-mali">Ukupno: {clanovi.length} {clanovi.length === 1 ? 'clan' : 'clanova'}
            </p>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose}>Zatvori</button>
        </div>
      </div>
    </div>
  )
}