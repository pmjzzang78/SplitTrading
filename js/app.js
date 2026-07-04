// app.js — DOM 바인딩. 계산은 calc.js의 순수 함수에 위임한다.
import {
  calcBuySplit,
  calcSellSplit,
  calcAverageDown,
  calcProfit,
} from './calc.js';

// ---------- 포맷터 ----------
const wonFmt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

// 원화 금액: 천 단위 콤마 + 반올림
function won(v) {
  return wonFmt.format(Math.round(v)) + '원';
}

// 코인 수량: 유효숫자 8자리
function qtyFmt(v) {
  if (v === 0) return '0';
  const s = v.toPrecision(8);
  // 지수표기 방지 및 불필요한 0 제거
  return trimZeros(Number(s).toFixed(8));
}

function trimZeros(s) {
  if (s.indexOf('.') === -1) return s;
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

// 가격: 1000 이상은 정수(콤마), 미만은 소수
function priceFmt(v) {
  if (Math.abs(v) >= 1000) {
    return wonFmt.format(Math.round(v));
  }
  // 1000 미만: 소수점 유효하게
  return trimZeros(v.toFixed(4));
}

// 퍼센트: 소수 2자리
function pct(v) {
  const sign = v > 0 ? '+' : '';
  return sign + v.toFixed(2) + '%';
}

// 손익 방향 클래스 (상승=빨강/up, 하락=파랑/down)
function pnlClass(v) {
  if (v > 0) return 'up';
  if (v < 0) return 'down';
  return 'zero';
}

// ---------- DOM 헬퍼 ----------
function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.html != null) node.innerHTML = opts.html;
  if (opts.text != null) node.textContent = opts.text;
  for (const c of children) node.appendChild(c);
  return node;
}

function stat(k, v, cls) {
  const box = el('div', { class: 'stat' });
  box.appendChild(el('div', { class: 'k', text: k }));
  box.appendChild(el('div', { class: 'v' + (cls ? ' ' + cls : ''), text: v }));
  return box;
}

function buildTable(headers, rows) {
  const wrap = el('div', { class: 'table-wrap' });
  const table = el('table');
  const thead = el('thead');
  const htr = el('tr');
  for (const h of headers) htr.appendChild(el('th', { text: h }));
  thead.appendChild(htr);
  const tbody = el('tbody');
  for (const r of rows) {
    const tr = el('tr');
    for (const cell of r) {
      if (cell && typeof cell === 'object' && 'text' in cell) {
        tr.appendChild(el('td', { text: cell.text, class: cell.class || '' }));
      } else {
        tr.appendChild(el('td', { text: String(cell) }));
      }
    }
    tbody.appendChild(tr);
  }
  table.appendChild(thead);
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function renderResults(container, summaryNodes, tableNode) {
  container.innerHTML = '';
  const s = el('div', { class: 'summary' });
  for (const n of summaryNodes) s.appendChild(n);
  container.appendChild(s);
  if (tableNode) {
    container.appendChild(el('p', { class: 'results-title', text: '주문 상세' }));
    container.appendChild(tableNode);
  }
  container.hidden = false;
}

// 폼 입력을 숫자로 파싱 (빈 문자열은 null)
function num(form, name) {
  const raw = form.elements[name].value.trim();
  if (raw === '') return null;
  return Number(raw);
}

// ---------- 탭 전환 ----------
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.tab;
    tabs.forEach((t) => {
      const active = t === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((p) => {
      const active = p.id === 'panel-' + key;
      p.classList.toggle('active', active);
      p.hidden = !active;
    });
  });
});

// 계산 핸들러 공통 래퍼: 에러 잡아서 표시
function bindForm(formId, errorId, resultsId, handler) {
  const form = document.getElementById(formId);
  const errorEl = document.getElementById(errorId);
  const resultsEl = document.getElementById(resultsId);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    try {
      handler(form, resultsEl);
    } catch (err) {
      resultsEl.hidden = true;
      errorEl.textContent = err && err.message ? err.message : '계산 중 오류가 발생했습니다';
    }
  });
}

// ---------- 1. 분할매수 ----------
bindForm('form-buy', 'error-buy', 'results-buy', (form, out) => {
  const r = calcBuySplit({
    total: num(form, 'total'),
    count: num(form, 'count'),
    highPrice: num(form, 'highPrice'),
    lowPrice: num(form, 'lowPrice'),
    mode: form.elements['mode'].value,
  });
  const rows = r.rows.map((row) => [
    row.index,
    priceFmt(row.price),
    won(row.amount),
    qtyFmt(row.qty),
  ]);
  renderResults(
    out,
    [
      stat('총 매수 수량', qtyFmt(r.totalQty)),
      stat('총 투자금', won(r.totalAmount)),
      stat('평균 매수단가', priceFmt(r.avgPrice)),
      stat('최저가 도달 손익률', pct(r.worstPnlRate), pnlClass(r.worstPnlRate)),
    ],
    buildTable(['회차', '매수가', '매수 금액', '매수 수량'], rows)
  );
});

// ---------- 2. 분할매도 ----------
bindForm('form-sell', 'error-sell', 'results-sell', (form, out) => {
  const avg = num(form, 'avgBuyPrice');
  const r = calcSellSplit({
    holdingQty: num(form, 'holdingQty'),
    avgBuyPrice: avg,
    count: num(form, 'count'),
    lowTarget: num(form, 'lowTarget'),
    highTarget: num(form, 'highTarget'),
    mode: form.elements['mode'].value,
  });
  const hasAvg = 'totalProfit' in r;
  const headers = hasAvg
    ? ['회차', '매도가', '매도 수량', '예상 금액', '수익률']
    : ['회차', '매도가', '매도 수량', '예상 금액'];
  const rows = r.rows.map((row) => {
    const base = [row.index, priceFmt(row.price), qtyFmt(row.qty), won(row.amount)];
    if (hasAvg) base.push({ text: pct(row.pnlRate), class: pnlClass(row.pnlRate) });
    return base;
  });
  const summary = [
    stat('총 매도 금액', won(r.totalAmount)),
    stat('평균 매도단가', priceFmt(r.avgSellPrice)),
  ];
  if (hasAvg) {
    summary.push(stat('총 수익금', won(r.totalProfit), pnlClass(r.totalProfit)));
    summary.push(stat('총 수익률', pct(r.totalPnlRate), pnlClass(r.totalPnlRate)));
  }
  renderResults(out, summary, buildTable(headers, rows));
});

// ---------- 3. 물타기 ----------
bindForm('form-avgdown', 'error-avgdown', 'results-avgdown', (form, out) => {
  const r = calcAverageDown({
    avgPrice: num(form, 'avgPrice'),
    holdingQty: num(form, 'holdingQty'),
    addPrice: num(form, 'addPrice'),
    addAmount: num(form, 'addAmount'),
  });
  renderResults(
    out,
    [
      stat('새 평균단가', priceFmt(r.newAvgPrice)),
      stat('추가 매수 수량', qtyFmt(r.addQty)),
      stat('총 보유 수량', qtyFmt(r.totalQty)),
      stat('총 투자금', won(r.totalInvest)),
      stat('평단 하락률', pct(r.avgDropRate), pnlClass(r.avgDropRate)),
      stat('본전까지 필요 상승률', pct(r.breakEvenRate), pnlClass(r.breakEvenRate)),
    ],
    null
  );
});

// ---------- 4. 수익 계산 ----------
bindForm('form-profit', 'error-profit', 'results-profit', (form, out) => {
  const fee = num(form, 'feeRate');
  const r = calcProfit({
    buyPrice: num(form, 'buyPrice'),
    sellPrice: num(form, 'sellPrice'),
    qty: num(form, 'qty'),
    feeRate: fee === null ? 0.05 : fee,
  });
  renderResults(
    out,
    [
      stat('실현 손익', won(r.profit), pnlClass(r.profit)),
      stat('수익률', pct(r.pnlRate), pnlClass(r.pnlRate)),
      stat('총 매수금(수수료 포함)', won(r.totalBuy)),
      stat('총 매도금(수수료 차감)', won(r.totalSell)),
      stat('총 수수료', won(r.totalFee)),
    ],
    null
  );
});
