import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Chat from './Chat'
import Zadaci from './Zadaci'
import Kalendar from './Kalendar'
import Financije from './Financije'
import Clanovi from './Clanovi'

export default function Kucanstvo({ kucanstvo, session, onBack }) {
  const [aktivniTab, setAktivniTab] = useState('chat')
  const [showClanovi, setShowClanovi] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const napustiKucanstvo = async () => {
    const potvrda = confirm(
      'Sigurno želiš napustiti ovo kućanstvo?\n\n' +
      'Ako si vlasnik, vlasništvo će preći na prvog člana po redu pridruživanja.\n' +
      'Ako si jedini član, kućanstvo i svi podaci će biti obrisani.')

    if (!potvrda) return

    const { error } = await supabase
    //rpc zbog atomarnosti - sve u jednoj transakciji na bazi
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
        {/*DODAJ STYLE KLASU ZA OVO */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary" onClick={napustiKucanstvo}>Napusti
          </button>
          <button onClick={handleLogout}>Odjavi se</button>
        </div>
      </div>

      <h1>{kucanstvo.naziv}</h1>
   <div className="kucanstvo-info">
     <button className="secondary clanovi-btn" onClick={() => setShowClanovi(true)}>Članovi
     </button>
     <p className="kod-display">Pozivni kod: <strong>{kucanstvo.pozivni_kod}</strong>
     </p>
  </div>

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
      {showClanovi && (
  <Clanovi
    kucanstvoId={kucanstvo.id}
    session={session}
    onClose={() => setShowClanovi(false)}
  />
)}
    </div>
  )
}