import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  //ovo sam mogao u jedan objekt ali nema puno polja pa moze ovako
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ime, setIme] = useState('')
  const [isRegistered, setisRegistered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    //vrati samo error ako postoji
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {ime: ime}
        
      }
    })

    if (error) {
      setMessage('Greška: ' + error.message)
    } else {
      setMessage('Uspješno! Sad se možeš prijaviti.')
      setisRegistered(false)
    }
    setLoading(false)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Greška: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className= "modaltest">
    <div className="container">
      <h1>Domio</h1>
      <h2>{isRegistered ? 'Registracija' : 'Prijava'}</h2>

      <form onSubmit={isRegistered ? handleRegister : handleLogin}>
        {/*ako je true renderiraj element inace skip*/}
        {isRegistered && (
          <input
            type="text"
            placeholder="Ime"
            value={ime}
            onChange={(e) => setIme(e.target.value)}
            required/>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required/>
        <input
          type="password"
          placeholder="Lozinka (min. 6 znakova)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}/>
        <button type="submit" disabled={loading}>
          {loading ? 'Učitavanje...' : (isRegistered ? 'Registriraj se' : 'Prijavi se')}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <p>
        {/*ne brisi prazno to je razmak*/}
        {isRegistered ? 'Već imšs račun?' : 'Nemaš račun?'}{' '}
        <button
        //izbjegni submit - definiraj tip
          type="button"
          className="link"
          onClick={() => {
            setisRegistered(!isRegistered)
            setMessage('')
          }}>
          {isRegistered ? 'Prijavi se' : 'Registriraj se'}
        </button>
      </p>
    </div>
    </div>
  )
}