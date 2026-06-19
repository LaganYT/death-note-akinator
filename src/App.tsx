import { useMemo, useState } from 'react'
import './App.css'
import { characters, questions } from './gameData'
import { applyAnswer, createInitialScores, pickNextQuestion, rankCandidates, shouldGuess } from './gameEngine'
import type { Answer, AnswerRecord, ScoreBoard } from './types'

const answerLabels: Array<{ answer: Answer; label: string; indicator: string }> = [
  { answer: 'yes',          label: 'Yes',          indicator: '●●●' },
  { answer: 'probably',     label: 'Probably',     indicator: '●●○' },
  { answer: 'unknown',      label: 'Unknown',      indicator: '●○○' },
  { answer: 'probably-not', label: 'Probably not', indicator: '○○○' },
  { answer: 'no',           label: 'No',           indicator: '───' },
]

function getLSpeech(started: boolean, isGuessing: boolean, answeredCount: number): string {
  if (!started)           return 'Think of a character from Death Note...'
  if (isGuessing)         return 'I have reached my conclusion.'
  if (answeredCount === 0) return 'Let us begin. Answer as honestly as you can.'
  if (answeredCount < 4)  return 'Interesting. Continue answering.'
  if (answeredCount < 8)  return 'The field is narrowing considerably.'
  if (answeredCount < 12) return 'I\'m growing more certain with each response.'
  return 'Almost certain now...'
}

function App() {
  const [started, setStarted] = useState(false)
  const [suspectsOpen, setSuspectsOpen] = useState(false)
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
  const lSpeech = getLSpeech(started, isGuessing, answered.length)

  function answerQuestion(answer: Answer) {
    if (!currentQuestion) return
    setAnswered((records) => [
      ...records,
      { questionId: currentQuestion.id, trait: currentQuestion.trait, answer },
    ])
    setScores((currentScores) =>
      applyAnswer(characters, currentScores, currentQuestion.trait, answer),
    )
  }

  function resetGame() {
    setStarted(false)
    setSuspectsOpen(false)
    setAnswered([])
    setScores(createInitialScores(characters))
  }

  return (
    <main className="app-shell">

      {/* ── L Panel ── */}
      <div className="l-panel">
        <div className="l-image-wrap">
          <img src="/L.png" alt="L — The World's Greatest Detective" />
        </div>
        <div className="l-hud">
          <p className="l-title">L · World's Greatest Detective</p>
          <p className="l-speech">{lSpeech}</p>
          {started && (
            <div className="l-stats">
              <div>
                <span>Questions</span>
                <strong>{answered.length}</strong>
              </div>
              <div>
                <span>Suspects</span>
                <strong>{characters.length}</strong>
              </div>
              <div>
                <span>Confidence</span>
                <strong>{Math.max(0, Math.round(topCandidate?.score ?? 0))}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Game Panel ── */}
      <div className="game-panel">

        {/* Start */}
        {!started ? (
          <div className="state-card">
            <p className="eyebrow">Notebook Oracle</p>
            <h1>Death Note<br />Akinator</h1>
            <p className="intro-text">
              Think of any character from Death Note. I will ask a series of questions and
              deduce exactly who you have in mind. Answer honestly — unknown responses are
              allowed.
            </p>
            <button className="primary-btn" type="button" onClick={() => setStarted(true)}>
              Begin Inquiry
            </button>
          </div>

        /* Guess */
        ) : isGuessing || !currentQuestion ? (
          <div className="state-card">
            <p className="eyebrow">Final Deduction</p>
            <h2>{topCandidate?.character.name}</h2>
            <p className="alias-tag">{topCandidate?.character.alias}</p>
            <p className="description-text">{topCandidate?.character.description}</p>
            <div className="score-row">
              <div>
                <span>Score</span>
                <strong>{Math.round(topCandidate?.score ?? 0)}</strong>
              </div>
              <div>
                <span>Lead</span>
                <strong>+{Math.round((topCandidate?.score ?? 0) - (runnerUp?.score ?? 0))}</strong>
              </div>
              <div>
                <span>Questions</span>
                <strong>{answered.length}</strong>
              </div>
            </div>
            <button className="primary-btn" type="button" onClick={resetGame}>
              Play Again
            </button>
          </div>

        /* Question */
        ) : (
          <div className="state-card">
            <div className="progress-header">
              <p className="eyebrow" style={{ margin: 0 }}>Question {answered.length + 1}</p>
              <span className="progress-pct">{progress}% logged</span>
            </div>
            <div className="progress-track">
              <div style={{ width: `${progress}%` }} />
            </div>
            <h2>{currentQuestion.text}</h2>
            <div className="answer-grid">
              {answerLabels.map(({ answer, label, indicator }) => (
                <button
                  key={answer}
                  className="answer-btn"
                  type="button"
                  onClick={() => answerQuestion(answer)}
                >
                  <span className="answer-indicator">{indicator}</span>
                  {label}
                </button>
              ))}
            </div>
            <button className="ghost-btn" type="button" onClick={resetGame}>
              Restart
            </button>
          </div>
        )}

        {/* Suspects */}
        <div className="suspects-section">
          <button
            className="suspects-toggle"
            type="button"
            onClick={() => setSuspectsOpen((v) => !v)}
            aria-expanded={suspectsOpen}
          >
            <span>Current Suspects</span>
            <span className="toggle-badge">{rankedCandidates.length}</span>
            <span className="toggle-arrow" aria-hidden="true">{suspectsOpen ? '▲' : '▼'}</span>
          </button>
          {suspectsOpen && (
            <div className="suspect-list">
              {rankedCandidates.slice(0, 8).map(({ character, score }, index) => (
                <div className="suspect-item" key={character.id}>
                  <span className="suspect-rank">{String(index + 1).padStart(2, '0')}</span>
                  <div className="suspect-info">
                    <strong>{character.name}</strong>
                    <small>{character.alias}</small>
                  </div>
                  <b className="suspect-score">{Math.round(score)}</b>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}

export default App
