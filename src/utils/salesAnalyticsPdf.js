import html2pdf from 'html2pdf.js';

function escapeHtml(s) {
    if (s == null || s === undefined) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const formatProductId = (id) => {
    if (!id) return '';
    return String(id).toUpperCase();
};

/**
 * Roll up sales by product: qty, revenue, cost (purchase_rate × qty), profit.
 */
export function computeSalesAnalytics(sales) {
    const byProduct = new Map();

    for (const s of sales) {
        const pid = s.product_id;
        const name = s.products?.name || `Product #${pid}`;
        const qty = Number(s.quantity || 0);
        const rev = Number(s.total_amount || 0);
        const rate = Number(s.products?.purchase_rate ?? 0);
        const cost = rate * qty;
        const profit = rev - cost;

        if (!byProduct.has(pid)) {
            byProduct.set(pid, {
                productId: pid,
                name,
                totalQty: 0,
                totalRevenue: 0,
                totalCost: 0,
                totalProfit: 0,
                saleCount: 0,
            });
        }
        const a = byProduct.get(pid);
        a.totalQty += qty;
        a.totalRevenue += rev;
        a.totalCost += cost;
        a.totalProfit += profit;
        a.saleCount += 1;
    }

    const rows = Array.from(byProduct.values());
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const totalPaid = sales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
    const totalPending = totalRevenue - totalPaid;

    if (rows.length === 0) {
        return {
            rows: [],
            totalRevenue,
            totalPaid,
            totalPending,
            transactionCount: sales.length,
        };
    }

    const byQty = [...rows].sort((a, b) => b.totalQty - a.totalQty);
    const byProfit = [...rows].sort((a, b) => b.totalProfit - a.totalProfit);
    const byRev = [...rows].sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
        rows,
        totalRevenue,
        totalPaid,
        totalPending,
        transactionCount: sales.length,
        topByQty: byQty[0],
        lowestByQty: byQty[byQty.length - 1],
        topByProfit: byProfit[0],
        lowestByProfit: byProfit[byProfit.length - 1],
        topByRevenue: byRev[0],
        lowestByRevenue: byRev[byRev.length - 1],
    };
}

function insightRow(label, valueHtml) {
    return `
        <tr>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;color:#334155;width:42%;">${escapeHtml(label)}</td>
            <td style="padding:10px 12px;border:1px solid #e2e8f0;color:#0f172a;">${valueHtml}</td>
        </tr>`;
}

function buildInnerHtml(sales, analytics, periodLabel) {
    const gen = new Date().toLocaleString('en-GB');
    const {
        rows,
        totalRevenue,
        totalPaid,
        totalPending,
        transactionCount,
        topByQty,
        lowestByQty,
        topByProfit,
        lowestByProfit,
        topByRevenue,
        lowestByRevenue,
    } = analytics;

    const fmtRs = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

    let insightsBody = '';
    if (rows.length > 0) {
        insightsBody =
            insightRow(
                'Most units sold',
                `<strong>${escapeHtml(topByQty.name)}</strong> — ${topByQty.totalQty} pcs &middot; ${fmtRs(topByQty.totalRevenue)} revenue`
            ) +
            insightRow(
                'Lowest selling (by quantity)',
                `<strong>${escapeHtml(lowestByQty.name)}</strong> — ${lowestByQty.totalQty} pcs &middot; ${fmtRs(lowestByQty.totalRevenue)} revenue`
            ) +
            insightRow(
                'Highest total profit',
                `<strong>${escapeHtml(topByProfit.name)}</strong> — ${fmtRs(topByProfit.totalProfit)} profit &middot; cost ${fmtRs(topByProfit.totalCost)}`
            ) +
            insightRow(
                'Lowest total profit',
                `<strong>${escapeHtml(lowestByProfit.name)}</strong> — ${fmtRs(lowestByProfit.totalProfit)} profit &middot; cost ${fmtRs(lowestByProfit.totalCost)}`
            ) +
            insightRow(
                'Highest revenue (product)',
                `<strong>${escapeHtml(topByRevenue.name)}</strong> — ${fmtRs(topByRevenue.totalRevenue)}`
            ) +
            insightRow(
                'Lowest revenue (product)',
                `<strong>${escapeHtml(lowestByRevenue.name)}</strong> — ${fmtRs(lowestByRevenue.totalRevenue)}`
            );
    } else {
        insightsBody = `<tr><td colspan="2" style="padding:16px;text-align:center;color:#64748b;">No product-level data for this period.</td></tr>`;
    }

    const productRows = rows
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .map((r) => {
            return `<tr>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;">${escapeHtml(r.name)} <span style="color:#64748b;font-size:11px;">(${escapeHtml(formatProductId(r.productId))})</span></td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;">${r.totalQty}</td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;">${fmtRs(r.totalRevenue)}</td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;">${fmtRs(r.totalCost)}</td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:${r.totalProfit >= 0 ? '#15803d' : '#b91c1c'};">${fmtRs(r.totalProfit)}</td>
                <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:center;">${r.saleCount}</td>
            </tr>`;
        })
        .join('');

    const detailRows = sales
        .map((sale, idx) => {
            const pending = Number(sale.total_amount || 0) - Number(sale.paid_amount || 0);
            const rate = Number(sale.products?.purchase_rate ?? 0);
            const qty = Number(sale.quantity || 0);
            const lineProfit = Number(sale.total_amount || 0) - rate * qty;
            return `<tr>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">${idx + 1}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">#${sale.id}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">${sale.purchase_date ? escapeHtml(new Date(sale.purchase_date).toLocaleDateString('en-GB')) : '—'}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">${escapeHtml(sale.products?.name || '—')}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;font-size:10px;">${escapeHtml(sale.buyers?.name || 'Walk-in')}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">${qty}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">${fmtRs(sale.total_amount)}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">${fmtRs(sale.paid_amount)}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">${pending > 0 ? fmtRs(pending) : '—'}</td>
                <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:11px;">${fmtRs(lineProfit)}</td>
            </tr>`;
        })
        .join('');

    return `
        <div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
            <h1 style="margin:0 0 6px;font-size:22px;color:#1e3a8a;text-align:center;">Sales analytics report</h1>
            <p style="margin:0 0 4px;text-align:center;font-size:13px;color:#475569;">Period: <strong>${escapeHtml(periodLabel)}</strong></p>
            <p style="margin:0 0 18px;text-align:center;font-size:11px;color:#64748b;">Generated ${escapeHtml(gen)}</p>

            <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:18px;justify-content:center;">
                <div style="flex:1;min-width:140px;border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#fff;border-top:3px solid #22c55e;">
                    <div style="font-size:10px;color:#64748b;font-weight:700;">TOTAL REVENUE</div>
                    <div style="font-size:18px;font-weight:700;color:#15803d;">${fmtRs(totalRevenue)}</div>
                </div>
                <div style="flex:1;min-width:140px;border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#fff;border-top:3px solid #8b5cf6;">
                    <div style="font-size:10px;color:#64748b;font-weight:700;">TOTAL PAID</div>
                    <div style="font-size:18px;font-weight:700;color:#6d28d9;">${fmtRs(totalPaid)}</div>
                </div>
                <div style="flex:1;min-width:140px;border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#fff;border-top:3px solid #ef4444;">
                    <div style="font-size:10px;color:#64748b;font-weight:700;">PENDING (UDHAAR)</div>
                    <div style="font-size:18px;font-weight:700;color:#b91c1c;">${fmtRs(totalPending)}</div>
                </div>
                <div style="flex:1;min-width:140px;border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#fff;border-top:3px solid #3b82f6;">
                    <div style="font-size:10px;color:#64748b;font-weight:700;">TRANSACTIONS</div>
                    <div style="font-size:18px;font-weight:700;color:#1d4ed8;">${transactionCount}</div>
                </div>
            </div>

            <h2 style="font-size:15px;color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:6px;margin:20px 0 10px;">Product insights</h2>
            <p style="font-size:11px;color:#64748b;margin:-4px 0 10px;">Profit = sale amount − (purchase rate × qty). Uses current product purchase rate.</p>
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:22px;">${insightsBody}</table>

            <h2 style="font-size:15px;color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:6px;margin:20px 0 10px;">Summary by product</h2>
            <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:22px;">
                <thead>
                    <tr style="background:#1e3a8a;color:#fff;">
                        <th style="padding:8px;text-align:left;">Product</th>
                        <th style="padding:8px;text-align:right;">Qty sold</th>
                        <th style="padding:8px;text-align:right;">Revenue</th>
                        <th style="padding:8px;text-align:right;">Est. cost</th>
                        <th style="padding:8px;text-align:right;">Profit</th>
                        <th style="padding:8px;text-align:center;">Bills</th>
                    </tr>
                </thead>
                <tbody>${productRows || '<tr><td colspan="6" style="padding:12px;text-align:center;">—</td></tr>'}</tbody>
            </table>

            <h2 style="font-size:15px;color:#1e3a8a;border-bottom:2px solid #dbeafe;padding-bottom:6px;margin:20px 0 10px;">All transactions</h2>
            <table style="width:100%;border-collapse:collapse;font-size:10px;">
                <thead>
                    <tr style="background:#1e3a8a;color:#fff;">
                        <th style="padding:6px;">#</th>
                        <th style="padding:6px;">Inv</th>
                        <th style="padding:6px;">Date</th>
                        <th style="padding:6px;">Product</th>
                        <th style="padding:6px;">Customer</th>
                        <th style="padding:6px;text-align:right;">Qty</th>
                        <th style="padding:6px;text-align:right;">Total</th>
                        <th style="padding:6px;text-align:right;">Paid</th>
                        <th style="padding:6px;text-align:right;">Due</th>
                        <th style="padding:6px;text-align:right;">Line profit</th>
                    </tr>
                </thead>
                <tbody>${detailRows || '<tr><td colspan="10" style="padding:12px;text-align:center;">—</td></tr>'}</tbody>
            </table>

            <p style="margin-top:24px;font-size:10px;color:#94a3b8;text-align:center;">Inventory Pro — Sales report</p>
        </div>
    `;
}

/**
 * PDF for currently filtered sales (same rows as on screen).
 */
export async function downloadSalesAnalyticsPdf(filteredSales, periodLabel, activeFilterKey) {
    if (!filteredSales?.length) {
        alert('No sales to export for this filter.');
        return;
    }

    const analytics = computeSalesAnalytics(filteredSales);
    const root = document.createElement('div');
    root.setAttribute('data-sales-pdf', '1');
    root.style.position = 'absolute';
    root.style.left = '-10000px';
    root.style.top = '0';
    root.style.width = '1000px';
    root.style.padding = '20px';
    root.style.background = '#ffffff';
    root.innerHTML = buildInnerHtml(filteredSales, analytics, periodLabel);
    document.body.appendChild(root);

    await new Promise((r) => setTimeout(r, 80));

    const heightMm = root.scrollHeight * 0.264583;
    const safeFilename = `Sales_Report_${String(activeFilterKey).replace(/[^a-z0-9_-]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

    const opt = {
        margin: [8, 8, 8, 8],
        filename: safeFilename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 1.4, useCORS: true, width: 1000, windowWidth: 1000 },
        jsPDF: { unit: 'mm', format: [210, Math.max(heightMm + 24, 280)], orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.document.write(
            '<body><p style="font-family:sans-serif;text-align:center;margin-top:22vh;">Generating sales PDF…</p></body>'
        );
    }

    try {
        await html2pdf()
            .set(opt)
            .from(root)
            .toPdf()
            .get('pdf')
            .then((pdf) => {
                const pdfUrl = pdf.output('bloburl');
                if (newWindow) newWindow.location.href = pdfUrl;
                else window.open(pdfUrl, '_blank');
            });
    } finally {
        document.body.removeChild(root);
    }
}
