import { GuideFlow, type GuideFlowStep } from '@/components/shared/guide/GuideFlow'

export type AboutFlowStep = GuideFlowStep

/** Dashboard flow diagram — the shared {@link GuideFlow} fixed to burgundy. */
export function AboutFlow({ steps }: { steps: GuideFlowStep[] }) {
  return <GuideFlow steps={steps} variant="burgundy" />
}
