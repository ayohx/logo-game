import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

test('admin page exists with password login and analytics containers', () => {
  const html = read('admin.html')

  assert.ok(html.includes('admin-password'), 'admin password input missing')
  assert.ok(html.includes('btn-admin-login'), 'admin login button missing')
  assert.ok(html.includes('admin-stats'), 'admin stats container missing')
  assert.ok(html.includes('admin-panel'), 'admin panel container missing')
  assert.ok(html.includes('admin-table'), 'admin table container missing')
  assert.ok(html.includes('src/admin.js'), 'admin module missing')
})

test('admin page has tabbed analytics sections and table controls', () => {
  const html = read('admin.html')

  ;[
    'admin-tab-overview',
    'admin-tab-recent',
    'admin-tab-players',
    'admin-tab-leaderboard',
    'admin-tab-categories',
    'admin-tab-questions',
    'admin-tab-logo-health',
    'admin-pack-filter',
    'admin-search',
    'admin-page-size',
  ].forEach(id => {
    assert.ok(html.includes(id), `${id} missing from admin page`)
  })
})

test('admin client calls only the admin Edge Function and does not hard-code password', () => {
  const src = read('src/admin.js')

  assert.ok(src.includes('logo-game-admin'), 'admin Edge Function call missing')
  assert.ok(!src.includes('coachAOG'), 'admin password must not be hard-coded in frontend')
  assert.ok(!src.includes('service_role'), 'service role key must not be exposed in frontend')
})

test('admin client supports paged, sorted, filtered tab data', () => {
  const src = read('src/admin.js')

  assert.ok(src.includes('activeTab'), 'admin tabs state missing')
  assert.ok(src.includes('sortBy'), 'admin sorting state missing')
  assert.ok(src.includes('pageSize'), 'admin page size state missing')
  assert.ok(src.includes('admin-pack-filter'), 'pack filter wiring missing')
  assert.ok(src.includes('admin-search'), 'search wiring missing')
  assert.ok(src.includes('renderPagination'), 'pagination rendering missing')
  assert.ok(src.includes('categoryPerformance'), 'category performance tab missing')
  assert.ok(src.includes('questionInsights'), 'question insights tab missing')
  assert.ok(src.includes('logoHealth'), 'logo health tab missing')
})

test('admin client surfaces category popularity and performance metrics', () => {
  const src = read('src/admin.js')

  assert.ok(src.includes('Most played category'), 'overview should include most played category')
  assert.ok(src.includes('Best-performing category'), 'overview should include best-performing category')
  assert.ok(src.includes('strongest_category'), 'player and leaderboard tables should include strongest category')
  assert.ok(src.includes('completion_rate'), 'category table should include completion rate')
  assert.ok(src.includes('avg_score'), 'category table should include average score')
})

test('admin styles include dashboard table and stats layouts', () => {
  const css = read('style.css')

  assert.ok(css.includes('.admin-shell'), 'admin shell styles missing')
  assert.ok(css.includes('.admin-stats'), 'admin stats styles missing')
  assert.ok(css.includes('.admin-table'), 'admin table styles missing')
  assert.ok(css.includes('.admin-tabs'), 'admin tab styles missing')
  assert.ok(css.includes('.admin-controls'), 'admin controls styles missing')
})
