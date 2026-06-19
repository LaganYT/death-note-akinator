import { describe, expect, it } from 'vitest'
import { applyAnswer, createInitialScores, pickNextQuestion, scoreTrait } from './gameEngine'
import type { Character, Question } from './types'

const testCharacters: Character[] = [
  {
    id: 'detective',
    name: 'Detective',
    alias: 'The solver',
    description: 'Test character',
    traits: { detective: true, publicFigure: false },
  },
  {
    id: 'idol',
    name: 'Idol',
    alias: 'The star',
    description: 'Test character',
    traits: { detective: false, publicFigure: true },
  },
]

const testQuestions: Question[] = [
  { id: 'detective', text: 'Are they a detective?', trait: 'detective' },
  { id: 'public', text: 'Are they public?', trait: 'publicFigure' },
]

describe('game engine', () => {
  it('rewards matching answers and penalizes contradictions', () => {
    const scores = applyAnswer(testCharacters, createInitialScores(testCharacters), 'detective', 'yes')

    expect(scores.detective).toBeGreaterThan(0)
    expect(scores.idol).toBeLessThan(0)
  })

  it('leaves scores unchanged for unknown answers', () => {
    const initialScores = createInitialScores(testCharacters)
    const scores = applyAnswer(testCharacters, initialScores, 'detective', 'unknown')

    expect(scores).toEqual(initialScores)
    expect(scoreTrait(true, 'unknown')).toBe(0)
  })

  it('uses probably answers as softer evidence', () => {
    expect(scoreTrait(true, 'probably')).toBeGreaterThan(0)
    expect(scoreTrait(true, 'probably')).toBeLessThan(scoreTrait(true, 'yes'))
    expect(scoreTrait(true, 'probably-not')).toBeLessThan(0)
    expect(scoreTrait(true, 'probably-not')).toBeGreaterThan(scoreTrait(true, 'no'))
  })

  it('chooses an unasked question that splits current candidates', () => {
    const nextQuestion = pickNextQuestion(testCharacters, testQuestions, createInitialScores(testCharacters), [
      { questionId: 'detective', trait: 'detective', answer: 'unknown' },
    ])

    expect(nextQuestion?.id).toBe('public')
  })
})
