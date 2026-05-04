import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function KreirajKucanstvo({ onClose, onSuccess }) {
  const [naziv, setNaziv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!naziv.trim()){
      setError("Naziv ne može biti prazno polje") 
      return
    }
      
    setLoading(true)
    setError('')

    // Pozovi SQL funkciju koja sve napravi odjednom
    const { error: errFunkcija } = await supabase
    // RLS politika daje korisniku da vidi samo kucanstva ciji je clan
    // to znaci da ne moze kreirati kucanstvo jer jos nije clan -> u bazi je setupana funkcija sa security idenfitifierom
    // rls politika se na taj nacin zaobiđe jer je admin taj koji izvrsi insert umjesto korisnika
      .rpc('kreiraj_kucanstvo', { p_naziv: naziv.trim() })
    if (errFunkcija) {
      setError('Greška: ' + errFunkcija.message)
      setLoading(false)
      return
    }
    setLoading(false)
    onSuccess()
  }

  return (
    //overlay dodan za zatvaranje u slucaju klika izvan okvira
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Kreiraj kucanstvo</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Naziv (npr. 'Stan u Zagrebu')"
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            required
            autoFocus/>

          {error && <p className="message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Odustani
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Kreiram...' : 'Kreiraj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}