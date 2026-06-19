import { useMemo, useState } from 'react'
import './App.css'
import { characters, questions } from './gameData'
import { applyAnswer, createInitialScores, pickNextQuestion, rankCandidates, shouldGuess } from './gameEngine'
import type { Answer, AnswerRecord, ScoreBoard } from './types'

const answerLabels: Array<{ answer: Answer; label: string }> = [
  { answer: 'yes', label: 'Yes' },
  { answer: 'probably', label: 'Probably' },
  { answer: 'unknown', label: 'Unknown' },
  { answer: 'probably-not', label: 'Probably not' },
  { answer: 'no', label: 'No' },
]

function App() {
  const [started, setStarted] = useState(false)
  const [answered, setAnswered] = useState<AnswerRecord[]>([])
  const [scores, setScores] = useState<ScoreBoard>(() => createInitialScores(characters))
  const currentQuestion = useMemo(
    () => pickNextQuestion(characters, questions, scores, answered),
    [answered, scores],
  )
  const rankedCandidates = useMemo(() => rankCandidates(characters, scores), [scores])
  const isGuessing = started && shouldGuess(characters, questions, scores, answered)
  const topCandidate = rankedCandidates[0]
  const runnerUp = rankedCandidates[1]
  const progress = Math.round((answered.length / questions.length) * 100)

  function answerQuestion(answer: Answer) {
    if (!currentQuestion) {
      return
    }

    setAnswered((records) => [
      ...records,
      {
        questionId: currentQuestion.id,
        trait: currentQuestion.trait,
        answer,
      },
    ])
    setScores((currentScores) => applyAnswer(characters, currentScores, currentQuestion.trait, answer))
  }

  function resetGame() {
    setStarted(false)
    setAnswered([])
    setScores(createInitialScores(characters))
  }

  return (
    <main className="app-shell">
      <section className="brand-panel" aria-label="Game status">
        <div className="sigil" aria-hidden="true">
          <span />
        </div>
        <p className="eyebrow">Notebook Oracle</p>
        <h1>Think of a Death Note character.</h1>
        <p className="intro">
          Answer the questions and the page will narrow the suspects. This fan-made prototype uses
          original presentation and local character data only.
        </p>

        <div className="case-file">
          <div>
            <span>Questions</span>
            <strong>{answered.length}</strong>
          </div>
          <div>
            <span>Characters</span>
            <strong>{characters.length}</strong>
          </div>
          <div>
            <span>Confidence</span>
            <strong>{Math.max(0, Math.round(topCandidate?.score ?? 0))}</strong>
          </div>
        </div>
      </section>

      <section className="play-panel" aria-label="Akinator game">
        {!started ? (
          <div className="start-state">
            <p className="chapter">Case 001</p>
            <h2>Choose a character in your head.</h2>
            <p>
              Pick anyone from the included cast, then answer honestly. Unknown answers are allowed
              and will not change the score.
            </p>
            <button className="primary-action" type="button" onClick={() => setStarted(true)}>
              Begin questioning
            </button>
          </div>
        ) : isGuessing || !currentQuestion ? (
          <div className="guess-state">
            <p className="chapter">Final deduction</p>
            <h2>{topCandidate?.character.name}</h2>
            <p className="alias">{topCandidate?.character.alias}</p>
            <p>{topCandidate?.character.description}</p>
            <div className="deduction-grid">
              <div>
                <span>Score</span>
                <strong>{Math.round(topCandidate?.score ?? 0)}</strong>
              </div>
              <div>
                <span>Lead</span>
                <strong>{Math.round((topCandidate?.score ?? 0) - (runnerUp?.score ?? 0))}</strong>
              </div>
            </div>
            <button className="primary-action" type="button" onClick={resetGame}>
              Play again
            </button>
          </div>
        ) : (
          <div className="question-state">
            <div className="progress-row">
              <span>Question {answered.length + 1}</span>
              <span>{progress}% logged</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div style={{ width: `${progress}%` }} />
            </div>
            <h2>{currentQuestion.text}</h2>
            <div className="answer-grid">
              {answerLabels.map(({ answer, label }) => (
                <button key={answer} type="button" onClick={() => answerQuestion(answer)}>
                  {label}
                </button>
              ))}
            </div>
            <button className="ghost-action" type="button" onClick={resetGame}>
              Restart
            </button>
          </div>
        )}

        <aside className="candidate-list" aria-label="Current suspects">
          <div className="list-header">
            <span>Top suspects</span>
            <span>{rankedCandidates.length}</span>
          </div>
          {rankedCandidates.slice(0, 5).map(({ character, score }, index) => (
            <div className="candidate" key={character.id}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{character.name}</strong>
                <small>{character.alias}</small>
              </div>
              <b>{Math.round(score)}</b>
            </div>
          ))}
        </aside>
      </section>
    </main>
  )
}

export default App
