import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function PridruziSe({onClose, onSuccess }) {
  const [kod, setKod] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: errFunkcija } = await supabase
      .rpc('pridruzi_se_kucanstvu', { p_kod: kod.toUpperCase() })

    if (errFunkcija) {
      let poruka = errFunkcija.message

      if (poruka.includes('ne postoji')) {
        poruka = 'Kućanstvo s tim kodom ne postoji.'
      } else if (poruka.includes('Već si član') || poruka.includes('Već si član')) {
        poruka = 'Već si član ovog kućanstva.'
      } else if (poruka.includes('nije prijavljen')) {
        poruka = 'Nisi prijavljen. Osvježi stranicu i prijavi se opet.'
      } else {
        poruka = 'Greška: ' + poruka
      }

      setError(poruka)
      setLoading(false)
      return
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Pridruži se kućanstvu</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Pozivni kod (6 znakova)"
            value={kod.trim()}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            maxLength={6}
            required
            autoFocus/>

          {error && <p className="message">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Odustani
            </button>
            <button type="submit" disabled={loading}> 
              {loading ? 'Pridružujem...' : 'Pridruži se'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}