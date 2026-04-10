'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { registerPaymentSchema } from '@/lib/validations/payment.schema'

const MX = 'America/Mexico_City'

function todayMexicoCity(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MX }).format(new Date())
}

export type ActionResult = { success: true } | { success: false; error: string }

export async function registerPayment(formData: FormData): Promise<ActionResult> {
  const raw = {
    member_id: formData.get('member_id'),
    amount: formData.get('amount'),
    concept: formData.get('concept'),
    status: formData.get('status'),
    payment_date: formData.get('payment_date') || null,
    due_date: formData.get('due_date') || null,
  }

  const parsed = registerPaymentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const supabase = createAdminClient()

  const paymentDate =
    parsed.data.status === 'paid'
      ? parsed.data.payment_date && String(parsed.data.payment_date).trim() !== ''
        ? String(parsed.data.payment_date)
        : todayMexicoCity()
      : null

  const dueDate = parsed.data.status === 'pending' ? parsed.data.due_date : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('payments').insert({
    member_id: parsed.data.member_id,
    amount: parsed.data.amount,
    concept: parsed.data.concept,
    status: parsed.data.status,
    payment_date: paymentDate,
    due_date: dueDate,
    created_by: user.id,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/payments')
  revalidatePath(`/admin/members/${parsed.data.member_id}`)
  return { success: true }
}

export async function updatePaymentStatus(id: string, status: 'paid' | 'pending'): Promise<ActionResult> {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: fetchErr } = await (supabase as any)
    .from('payments')
    .select('member_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr) return { success: false, error: fetchErr.message }
  if (!row?.member_id) return { success: false, error: 'Pago no encontrado' }

  const updatePayload =
    status === 'paid'
      ? {
          status,
          payment_date: todayMexicoCity(),
          due_date: null as string | null,
        }
      : {
          status,
          payment_date: null as string | null,
          due_date: todayMexicoCity(),
        }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('payments').update(updatePayload).eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/payments')
  revalidatePath(`/admin/members/${row.member_id}`)
  return { success: true }
}
