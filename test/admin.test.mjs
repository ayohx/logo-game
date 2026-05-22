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
    'admin-date-filter',
    'admin-search',
    'admin-page-size',
    'btn-admin-export',
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
  assert.ok(src.includes('admin-date-filter'), 'date range filter wiring missing')
  assert.ok(src.includes('dateRange'), 'admin request should send the selected date range')
  assert.ok(src.includes('admin-search'), 'search wiring missing')
  assert.ok(src.includes('renderPagination'), 'pagination rendering missing')
  assert.ok(src.includes('exportCurrentTabCsv'), 'CSV export handler missing')
  assert.ok(src.includes('categoryPerformance'), 'category performance tab missing')
  assert.ok(src.includes('questionInsights'), 'question insights tab missing')
  assert.ok(src.includes('logoHealth'), 'logo health tab missing')
})

test('admin CSV export uses current tab filters and exports all rows', () => {
  const src = read('src/admin.js')

  assert.ok(src.includes('fetchAllRowsForExport'), 'CSV export should fetch all matching rows')
  assert.ok(src.includes('limit: 100'), 'CSV export should page through the maximum API page size')
  assert.ok(src.includes('offset += rows.length'), 'CSV export should continue beyond the visible page')
  assert.ok(src.includes('toCsv'), 'CSV conversion helper missing')
  assert.ok(src.includes('downloadCsv'), 'CSV download helper missing')
  assert.ok(src.includes('csvFileName'), 'CSV filename helper missing')
})

test('admin date filter exposes useful preset ranges', () => {
  const html = read('admin.html')
  const src = read('src/admin.js')

  ;[
    'value="all"',
    'value="today"',
    'value="7d"',
    'value="30d"',
  ].forEach(option => {
    assert.ok(html.includes(option), `${option} date option missing`)
  })
  assert.ok(src.includes('formatDateRange'), 'admin should render a readable date range label')
})

test('admin client surfaces category popularity and performance metrics', () => {
  const src = read('src/admin.js')

  assert.ok(src.includes('Most played category'), 'overview should include most played category')
  assert.ok(src.includes('Best-performing category'), 'overview should include best-performing category')
  assert.ok(src.includes('strongest_category'), 'player and leaderboard tables should include strongest category')
  assert.ok(src.includes('completion_rate'), 'category table should include completion rate')
  assert.ok(src.includes('avg_score'), 'category table should include average score')
})

test('admin question insights show logo thumbnails and review flags', () => {
  const src = read('src/admin.js')
  const css = read('style.css')

  assert.ok(src.includes('question_logo'), 'question insights should include a logo thumbnail column')
  assert.ok(src.includes('difficulty_label'), 'question insights should include a difficulty column')
  assert.ok(src.includes('needs_review'), 'question insights should include a needs-review flag')
  assert.ok(src.includes('questionDifficulty'), 'difficulty helper missing')
  assert.ok(src.includes('needsQuestionReview'), 'needs-review helper missing')
  assert.ok(src.includes('logoStorageUrl'), 'logo thumbnail helper missing')
  assert.ok(css.includes('.admin-logo-thumb'), 'admin logo thumbnail styles missing')
  assert.ok(css.includes('.admin-chip'), 'admin review/difficulty chip styles missing')
})

test('admin CSV export keeps question insight values plain text', () => {
  const src = read('src/admin.js')

  assert.ok(src.includes('formatCsvCell'), 'CSV export should use a plain-text cell formatter')
  assert.ok(src.includes("if (key === 'question_logo') return row.correct_name"), 'CSV logo thumbnail column should export the logo name')
  assert.ok(src.includes("if (key === 'difficulty_label') return questionDifficulty(row).label"), 'CSV difficulty should export the label')
  assert.ok(src.includes("if (key === 'needs_review') return needsQuestionReview(row) ? 'Yes' : 'No'"), 'CSV review flag should export Yes/No')
})

test('admin styles include dashboard table and stats layouts', () => {
  const css = read('style.css')

  assert.ok(css.includes('.admin-shell'), 'admin shell styles missing')
  assert.ok(css.includes('.admin-stats'), 'admin stats styles missing')
  assert.ok(css.includes('.admin-table'), 'admin table styles missing')
  assert.ok(css.includes('.admin-tabs'), 'admin tab styles missing')
  assert.ok(css.includes('.admin-controls'), 'admin controls styles missing')
})

test('admin filters stay on one desktop row and collapse cleanly on mobile', () => {
  const css = read('style.css')

  assert.match(
    css,
    /\.admin-controls\s*\{[^}]*grid-template-columns:\s*minmax\(150px,\s*180px\)\s+minmax\(170px,\s*210px\)\s+minmax\(300px,\s*1fr\)\s+minmax\(96px,\s*120px\)/s,
    'admin filters should keep Search wider than Date range on desktop'
  )
  assert.ok(css.includes('@media (max-width: 900px)'), 'tablet admin filter layout breakpoint missing')
  assert.ok(css.includes('@media (max-width: 560px)'), 'mobile admin filter layout breakpoint missing')
})
