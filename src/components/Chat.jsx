import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export default function Chat({ kucanstvoId, session }) {
  const [poruke, setPoruke] = useState([])
  const [novaPoruka, setNovaPoruka] = useState('')
  const [loading, setLoading] = useState(true)
  const [salje, setSalje] = useState(false)
  const porukeKraj = useRef(null)

  // Učitavanje poruka i realtime subscription
  useEffect(() => {
    let aktivan = true

    // 1. Učitaj postojeće poruke
    const ucitajPoruke = async () => {
      const { data, error } = await supabase
        .from('poruke')
        .select(`
          id,
          sadrzaj,
          poslano_u,
          posiljatelj_id,
          profili (
            ime,
            email
          )
        `)
        .eq('kucanstvo_id', kucanstvoId)
        .order('poslano_u', { ascending: true })

      if (!aktivan) return

      if (error) {
        console.error('Greska pri ucitavanju poruka:', error)
      } else {
        setPoruke(data || [])
      }
      setLoading(false)
    }

    ucitajPoruke()

    // 2. Subscribe na nove poruke (REALTIME!)
    const channel = supabase
      .channel(`chat-${kucanstvoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'poruke',
          filter: `kucanstvo_id=eq.${kucanstvoId}`
        },
        async (payload) => {
          // Kad stigne nova poruka, dohvati podatke pošiljatelja
          const { data: profil } = await supabase
            .from('profili')
            .select('ime, email')
            .eq('id', payload.new.posiljatelj_id)
            .single()

          const novaPorukaObj = {
            ...payload.new,
            profili: profil
          }

          setPoruke((prev) => [...prev, novaPorukaObj])
        }
      )
      .subscribe()

    // Cleanup pri napuštanju komponente
    return () => {
      aktivan = false
      supabase.removeChannel(channel)
    }
  }, [kucanstvoId])

  // Auto-scroll na dno kad stigne nova poruka
  useEffect(() => {
    porukeKraj.current?.scrollIntoView({ behavior: 'smooth' })
  }, [poruke])

  const posaljiPoruku = async (e) => {
    e.preventDefault()
    if (!novaPoruka.trim()) return

    setSalje(true)

    const { error } = await supabase
      .from('poruke')
      .insert({
        kucanstvo_id: kucanstvoId,
        posiljatelj_id: session.user.id,
        sadrzaj: novaPoruka.trim()
      })

    if (error) {
      console.error('Greska pri slanju:', error)
      alert('Nije uspjelo slanje poruke: ' + error.message)
    } else {
      setNovaPoruka('')
    }

    setSalje(false)
  }

  const formatVrijeme = (timestamp) => {
    const datum = new Date(timestamp)
    return datum.toLocaleTimeString('hr-HR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="chat">
      <div className="chat-poruke">
        {loading ? (
          <p className="empty">Učitavanje poruka...</p>
        ) : poruke.length === 0 ? (
          <p className="empty">Još nema poruka. Budi prvi! 👋</p>
        ) : (
          poruke.map((poruka) => {
            const jeMoja = poruka.posiljatelj_id === session.user.id
            const ime = poruka.profili?.ime || poruka.profili?.email || 'Nepoznat'

            return (
              <div
                key={poruka.id}
                className={`poruka ${jeMoja ? 'moja' : 'tudja'}`}
              >
                {!jeMoja && <div className="poruka-ime">{ime}</div>}
                <div className="poruka-sadrzaj">{poruka.sadrzaj}</div>
                <div className="poruka-vrijeme">{formatVrijeme(poruka.poslano_u)}</div>
              </div>
            )
          })
        )}
        <div ref={porukeKraj} />
      </div>

      <form className="chat-form" onSubmit={posaljiPoruku}>
        <input
          type="text"
          placeholder="Napisi poruku"
          value={novaPoruka}
          onChange={(e) => setNovaPoruka(e.target.value)}
          disabled={salje}
          autoFocus
        />
        <button type="submit" disabled={salje || !novaPoruka.trim()}>
          {salje ? '...' : 'Pošalji'}
        </button>
      </form>
    </div>
  )
}