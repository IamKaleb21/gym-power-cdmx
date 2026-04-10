'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { registerPayment } from '@/app/actions/payments'

const MX = 'America/Mexico_City'

function todayInputValue(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MX }).format(new Date())
}

type EntryMode = 'card' | 'cash' | 'pending'

export default function RegisterPaymentForm({
  members,
}: {
  members: Array<{ id: string; full_name: string; email: string }>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<EntryMode>('card')
  const [memberId, setMemberId] = useState('')
  const [amount, setAmount] = useState('')
  const [concept, setConcept] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayInputValue)
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const status = mode === 'pending' ? 'pending' : 'paid'
    const fd = new FormData()
    fd.set('member_id', memberId)
    fd.set('amount', amount)
    fd.set('concept', concept.trim())
    fd.set('status', status)
    if (status === 'paid') {
      fd.set('payment_date', paymentDate)
      fd.set('due_date', '')
    } else {
      fd.set('due_date', dueDate)
      fd.set('payment_date', '')
    }

    startTransition(async () => {
      const result = await registerPayment(fd)
      if (!result.success) {
        setError(result.error)
        return
      }
      setAmount('')
      setConcept('')
      setDueDate('')
      setPaymentDate(todayInputValue())
      setMode('card')
      router.refresh()
    })
  }

  const paid = mode !== 'pending'

  return (
    <div className="bg-surface-container-high p-8 rounded-lg relative">
      <div className="absolute -top-3 -left-3 bg-[#cafd00] text-[#0e0e0e] px-3 py-1 font-headline font-black text-xs uppercase italic">
        Registro manual
      </div>
      <h2 className="text-xl font-headline font-black uppercase tracking-tighter mb-6">Registrar pago</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <p className="text-error text-sm font-medium" role="alert">
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="payment-member"
            className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2"
          >
            Miembro
          </label>
          <select
            id="payment-member"
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full bg-surface-container-highest border-none focus:ring-0 focus:border-b-2 border-[#cafd00] text-white py-3 px-4 text-sm rounded-sm"
          >
            <option value="">Selecciona un miembro…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} — {m.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="payment-amount" className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2">
            Importe (MXN)
          </label>
          <input
            id="payment-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-surface-container-highest border-none focus:ring-0 focus:border-b-2 border-[#cafd00] text-white py-3 px-4 text-2xl font-headline font-black rounded-sm"
          />
        </div>
        <div>
          <label
            htmlFor="payment-concept"
            className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2"
          >
            Concepto
          </label>
          <input
            id="payment-concept"
            type="text"
            required
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Ej. mensualidad abril"
            className="w-full bg-surface-container-highest border-none focus:ring-0 focus:border-b-2 border-[#cafd00] text-white py-3 px-4 text-sm rounded-sm"
          />
        </div>
        <div>
          <p className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2">Método / estado</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMode('card')}
              className={`py-3 rounded-sm font-bold text-[10px] uppercase tracking-widest ${
                mode === 'card'
                  ? 'bg-[#cafd00] text-[#0e0e0e]'
                  : 'bg-surface-container-highest text-white/60 hover:text-white'
              }`}
            >
              Tarjeta
            </button>
            <button
              type="button"
              onClick={() => setMode('cash')}
              className={`py-3 rounded-sm font-bold text-[10px] uppercase tracking-widest ${
                mode === 'cash'
                  ? 'bg-[#cafd00] text-[#0e0e0e]'
                  : 'bg-surface-container-highest text-white/60 hover:text-white'
              }`}
            >
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => setMode('pending')}
              className={`py-3 rounded-sm font-bold text-[10px] uppercase tracking-widest ${
                mode === 'pending'
                  ? 'bg-error/30 text-error border border-error'
                  : 'bg-surface-container-highest text-white/60 hover:text-white'
              }`}
            >
              Pendiente
            </button>
          </div>
        </div>
        {paid && (
          <div>
            <label
              htmlFor="payment-date"
              className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2"
            >
              Fecha de pago
            </label>
            <input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-surface-container-highest border-none focus:ring-0 focus:border-b-2 border-[#cafd00] text-white py-3 px-4 text-sm rounded-sm"
            />
          </div>
        )}
        {!paid && (
          <div>
            <label htmlFor="due-date" className="block text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2">
              Fecha límite
            </label>
            <input
              id="due-date"
              type="date"
              required={!paid}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-surface-container-highest border-none focus:ring-0 focus:border-b-2 border-[#cafd00] text-white py-3 px-4 text-sm rounded-sm"
            />
          </div>
        )}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#cafd00] hover:bg-[#f3ffca] text-[#0e0e0e] py-4 rounded-sm font-black uppercase text-sm tracking-widest transition-all disabled:opacity-60"
          >
            {isPending ? 'Procesando…' : 'Registrar movimiento'}
          </button>
          <p className="text-[9px] text-white/30 text-center mt-4 uppercase tracking-[0.15em]">
            Registro interno · Gym Power CDMX
          </p>
        </div>
      </form>
    </div>
  )
}
