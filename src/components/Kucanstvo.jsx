import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Chat from './Chat'
import Zadaci from './Zadaci'
import Kalendar from './Kalendar'
import Financije from './Financije'

export default function Kucanstvo({ kucanstvo, session, onBack }) {
  const [aktivniTab, setAktivniTab] = useState('chat')

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const napustiKucanstvo = async () => {
    const potvrda = confirm(
      'Sigurno zelis napustiti ovo kucanstvo?\n\n' +
      'Ako si vlasnik, vlasnistvo ce preci na prvog clana po redu pridruzivanja.\n' +
      'Ako si jedini clan, kucanstvo i svi podaci ce biti obrisani.'
    )
    if (!potvrda) return

    const { error } = await supabase
      .rpc('napusti_kucanstvo', { p_kucanstvo_id: kucanstvo.id })

    if (error) {
      alert('Greska: ' + error.message)
    } else {
      onBack()
    }
  }

  const tabovi = [
    { id: 'chat', label: 'Chat' },
    { id: 'zadaci', label: 'Zadaci' },
    { id: 'kalendar', label: 'Kalendar' },
    { id: 'financije', label: 'Financije' },
  ]

  return (
    <div className="container container-wide">
      <div className="header">
        <button className="link" onClick={onBack}>Natrag</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary" onClick={napustiKucanstvo}>Napusti
          </button>
          <button onClick={handleLogout}>Odjavi se</button>
        </div>
      </div>

      <h1>{kucanstvo.naziv}</h1>
      <p className="kod-display">
        Pozivni kod: <strong>{kucanstvo.pozivni_kod}</strong>
      </p>

      <div className="tabovi">
        {tabovi.map(tab => (
          <button
            key={tab.id}
            className={`tab ${aktivniTab === tab.id ? 'active' : ''}`}
            onClick={() => setAktivniTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {aktivniTab === 'chat' && <Chat kucanstvoId={kucanstvo.id} session={session} />}
        {aktivniTab === 'zadaci' && <Zadaci kucanstvoId={kucanstvo.id} session={session} />}
        {aktivniTab === 'kalendar' && <Kalendar kucanstvoId={kucanstvo.id} session={session} />}
        {aktivniTab === 'financije' && <Financije kucanstvoId={kucanstvo.id} session={session} />}
      </div>
    </div>
  )
}