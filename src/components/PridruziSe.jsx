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
      .rpc('pridruzi_se_kucanstvu', { p_kod: kod })

    if (errFunkcija) {
      let poruka = errFunkcija.message

      if (poruka.includes('ne postoji')) {
        poruka = 'Kućanstvo s tim kodom ne postoji.'
      } else if (poruka.includes('Vec si clan') || poruka.includes('Već si član')) {
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
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            maxLength={6}
            required
            autoFocus
            style={{textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center', fontSize: 18}}
          />

          {error && <p className="message">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Odustani
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