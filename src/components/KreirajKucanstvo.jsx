import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function KreirajKucanstvo({ onClose, onSuccess }) {
  const [naziv, setNaziv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Pozovi SQL funkciju koja sve napravi u jednom koraku
    const { error: errFunkcija } = await supabase
      .rpc('kreiraj_kucanstvo', { p_naziv: naziv })

    if (errFunkcija) {
      setError('Greška: ' + errFunkcija.message)
      setLoading(false)
      return
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Kreiraj kućanstvo</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Naziv (npr. 'Stan u Zagrebu')"
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            required
            autoFocus
          />

          {error && <p className="message">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Odustani
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