import { TrainerForm } from '@/components/admin/TrainerForm'

export default function NewTrainerPage() {
  return (
    <div className="px-8 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-black text-white tracking-tighter uppercase">
          NUEVO <span className="text-[#cafd00]">ENTRENADOR</span>
        </h1>
      </div>
      <TrainerForm mode="new" />
    </div>
  )
}
