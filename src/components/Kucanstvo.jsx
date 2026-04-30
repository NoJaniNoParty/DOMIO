import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Chat from './Chat'

export default function Kucanstvo({ kucanstvo, session, onBack }) {
  const [aktivniTab, setAktivniTab] = useState('chat')

  const handleLogout = async () => {
    await supabase.auth.signOut()
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
        <button className="link" onClick={onBack}>
          ← Natrag
        </button>
        <button onClick={handleLogout}>Odjavi se</button>
      </div>

      <h1>🏡 {kucanstvo.naziv}</h1>
      <p className="kod-display">
        Pozivni kod: <strong>{kucanstvo.pozivni_kod}</strong>
      </p>

      <div className="tabovi">
        {tabovi.map(tab => (
          <button
            key={tab.id}
            className={`tab ${aktivniTab === tab.id ? 'active' : ''}`}
            onClick={() => setAktivniTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {aktivniTab === 'chat' && (
          <Chat kucanstvoId={kucanstvo.id} session={session} />
        )}
        {aktivniTab === 'zadaci' && (
          <p className="empty">Prazno</p>
        )}
        {aktivniTab === 'kalendar' && (
          <p className="empty">Prazno</p>
        )}
        {aktivniTab === 'financije' && (
          <p className="empty">Prazno</p>
        )}
      </div>
    </div>
  )
}