import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildBrandQuestions } from '../src/game/questions.js'

const keepOrder = items => [...items]

const pool = [
  { domain: 'alpha.test',   name: 'Alpha',   cat: 'Tech' },
  { domain: 'bravo.test',   name: 'Bravo',   cat: 'Food' },
  { domain: 'charlie.test', name: 'Charlie', cat: 'Auto' },
  { domain: 'delta.test',   name: 'Delta',   cat: 'Media' },
  { domain: 'echo.test',    name: 'Echo',    cat: 'Tech' },
  { domain: 'foxtrot.test', name: 'Foxtrot', cat: 'Food' },
  { domain: 'golf.test',    name: 'Golf',    cat: 'Auto' },
  { domain: 'hotel.test',   name: 'Hotel',   cat: 'Media' },
  { domain: 'india.test',   name: 'India',   cat: 'Tech' },
  { domain: 'juliet.test',  name: 'Juliet',  cat: 'Food' },
  { domain: 'kilo.test',    name: 'Kilo',    cat: 'Auto' },
  { domain: 'lima.test',    name: 'Lima',    cat: 'Media' },
]

test('buildBrandQuestions returns unique correct answers and unique options', () => {
  const questions = buildBrandQuestions(pool, { count: 6, shuffleFn: keepOrder })
  const correctDomains = questions.map(q => q.correct.domain)

  assert.strictEqual(questions.length, 6)
  assert.strictEqual(new Set(correctDomains).size, correctDomains.length)

  for (const question of questions) {
    const optionDomains = question.options.map(option => option.domain)
    assert.strictEqual(question.options.length, 3)
    assert.strictEqual(new Set(optionDomains).size, optionDomains.length)
    assert.ok(optionDomains.includes(question.correct.domain))
    assert.strictEqual(question.correctIndex, question.options.indexOf(question.correct))
  }
})

test('buildBrandQuestions prefers same-category distractors when available', () => {
  const questions = buildBrandQuestions(pool, { count: 4, shuffleFn: keepOrder })

  for (const question of questions) {
    const distractors = question.options.filter(option => option.domain !== question.correct.domain)
    assert.ok(
      distractors.some(option => option.cat === question.correct.cat),
      `Expected a ${question.correct.cat} distractor for ${question.correct.name}`
    )
  }
})

test('buildBrandQuestions avoids using other correct answers as distractors when alternatives exist', () => {
  const questions = buildBrandQuestions(pool, { count: 4, shuffleFn: keepOrder })
  const correctDomains = new Set(questions.map(q => q.correct.domain))

  for (const question of questions) {
    const distractorDomains = question.options
      .filter(option => option.domain !== question.correct.domain)
      .map(option => option.domain)

    assert.deepStrictEqual(
      distractorDomains.filter(domain => correctDomains.has(domain)),
      [],
      `${question.correct.name} used another answer as a distractor`
    )
  }
})
