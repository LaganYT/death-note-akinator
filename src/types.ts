export type TraitValue = boolean | 'unknown'

export type Character = {
  id: string
  name: string
  alias: string
  description: string
  traits: Record<string, TraitValue>
}

export type Question = {
  id: string
  text: string
  trait: string
}

export type Answer = 'yes' | 'probably' | 'unknown' | 'probably-not' | 'no'

export type AnswerRecord = {
  questionId: string
  trait: string
  answer: Answer
}

export type ScoreBoard = Record<string, number>
