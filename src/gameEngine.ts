import type { Answer, AnswerRecord, Character, Question, ScoreBoard, TraitValue } from './types'

const answerWeights: Record<Answer, number> = {
  yes: 1,
  probably: 0.55,
  unknown: 0,
  'probably-not': -0.55,
  no: -1,
}

const matchPoints = 8
const contradictionPoints = -7
const unknownTraitPoints = 0.5

export function createInitialScores(characters: Character[]): ScoreBoard {
  return Object.fromEntries(characters.map((character) => [character.id, 0]))
}

export function scoreTrait(traitValue: TraitValue, answer: Answer): number {
  const answerWeight = answerWeights[answer]

  if (answerWeight === 0) {
    return 0
  }

  if (traitValue === 'unknown') {
    return Math.abs(answerWeight) * unknownTraitPoints
  }

  const answerSuggestsTrue = answerWeight > 0
  const matches = traitValue === answerSuggestsTrue

  return Math.abs(answerWeight) * (matches ? matchPoints : contradictionPoints)
}

export function applyAnswer(
  characters: Character[],
  scores: ScoreBoard,
  trait: string,
  answer: Answer,
): ScoreBoard {
  return Object.fromEntries(
    characters.map((character) => [
      character.id,
      scores[character.id] + scoreTrait(character.traits[trait] ?? 'unknown', answer),
    ]),
  )
}

export function rankCandidates(characters: Character[], scores: ScoreBoard) {
  return characters
    .map((character) => ({
      character,
      score: scores[character.id] ?? 0,
    }))
    .sort((a, b) => b.score - a.score || a.character.name.localeCompare(b.character.name))
}

export function shouldGuess(
  characters: Character[],
  questions: Question[],
  scores: ScoreBoard,
  answered: AnswerRecord[],
) {
  const ranked = rankCandidates(characters, scores)
  const leader = ranked[0]
  const runnerUp = ranked[1]
  const answeredCount = answered.filter((record) => record.answer !== 'unknown').length

  if (!leader || answered.length === 0) {
    return false
  }

  if (answered.length >= questions.length) {
    return true
  }

  return answeredCount >= 6 && leader.score >= 26 && leader.score - (runnerUp?.score ?? 0) >= 12
}

export function pickNextQuestion(
  characters: Character[],
  questions: Question[],
  scores: ScoreBoard,
  answered: AnswerRecord[],
): Question | undefined {
  const askedIds = new Set(answered.map((record) => record.questionId))
  const ranked = rankCandidates(characters, scores)
  const contenderCount = Math.min(8, ranked.length)
  const contenders = ranked.slice(0, contenderCount).map(({ character }) => character)
  const remainingQuestions = questions.filter((question) => !askedIds.has(question.id))

  return remainingQuestions
    .map((question) => {
      const trueCount = contenders.filter((character) => character.traits[question.trait] === true).length
      const falseCount = contenders.filter((character) => character.traits[question.trait] === false).length
      const knownCount = trueCount + falseCount
      const splitScore = knownCount === 0 ? 0 : Math.min(trueCount, falseCount) / knownCount
      const coverageScore = knownCount / contenderCount

      return {
        question,
        value: splitScore * 2 + coverageScore,
      }
    })
    .sort((a, b) => b.value - a.value || a.question.text.localeCompare(b.question.text))[0]?.question
}
