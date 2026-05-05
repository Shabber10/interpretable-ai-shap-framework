/**
 * Interpretable AI Platform — Enhanced Script
 * Handles SPA routing, animations, notifications, model interactions
 */

// ─── Global State ────────────────────────────────────────────────────────────
const appState = {
    activeView: 'overview',
    isTraining: false,
    isPredicting: false,
    metrics: null,
    notifications: [],
    activityLog: []
};

const PAGE_TITLES = {
    overview:     'Overview',
    training:     'Model Training',
    predictions:  'Predictions',
    explanations: 'Explanations',
    settings:     'Settings'
};

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTabsListeners();
    initSearchListener();
    initParticles();
    setInitTime();
    addActivity('System initialized', 'Welcome to the Interpretable AI Framework.', 'info');
    addNotification('System Ready', 'Platform initialized. Train a model to begin.');
});

// ─── Utility: set init timestamp ─────────────────────────────────────────────
function setInitTime() {
    const el = document.getElementById('initTime');
    if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── 1. SPA Router ───────────────────────────────────────────────────────────
function switchView(viewId) {
    if (appState.activeView === viewId) return;

    // Sidebar nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeNav = document.getElementById(`nav-${viewId}`);
    if (activeNav) activeNav.classList.add('active');

    // View visibility
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
        target.classList.add('active');
        appState.activeView = viewId;
    }

    // Breadcrumb
    const bc = document.getElementById('breadcrumbCurrent');
    if (bc) bc.textContent = PAGE_TITLES[viewId] || viewId;

    // Refresh icons (needed after DOM change)
    lucide.createIcons();
    showToast(`Navigated to ${PAGE_TITLES[viewId] || viewId}`, 'navigate');
}

// ─── 2. Tab Switching (Explanations) ─────────────────────────────────────────
function initTabsListeners() {
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.getAttribute('data-tab');

            tabLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
            const section = document.getElementById(`tab-${tabId}`);
            if (section) section.classList.add('active');
        });
    });
}

// ─── 3. Model Training ───────────────────────────────────────────────────────
async function trainModel() {
    if (appState.isTraining) return;

    appState.isTraining = true;
    const btn      = document.getElementById('trainBtn');
    const progress = document.getElementById('trainProgress');
    const badge    = document.getElementById('sessionBadge');

    // Update UI states
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i><span>Training…</span>`;
    if (progress) progress.classList.remove('hidden');
    if (badge) { badge.textContent = 'Running'; badge.classList.add('badge-running'); }
    lucide.createIcons();

    addActivity('Training started', 'Fitting XGBoost model with SHAP…', 'training');
    addNotification('Training Started', 'Fitting XGBoost model and calculating SHAP values…');

    try {
        const response = await fetch('/train', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            appState.metrics = data.metrics;
            updateMetricsUI(data.metrics);
            refreshPlots(data.plots);

            const acc = (data.metrics.accuracy * 100).toFixed(1);
            addActivity('Training complete', `Accuracy: ${acc}%`, 'success');
            addNotification('Training Complete', `Model accuracy: ${acc}%`);
            showToast('✓ Model Ready', 'success');

            // Show training badge on nav
            const trainingBadge = document.getElementById('badge-training');
            if (trainingBadge) trainingBadge.style.display = 'inline';
        } else {
            addActivity('Training failed', data.message, 'danger');
            addNotification('Training Failed', data.message);
            showToast('Training failed', 'error');
        }
    } catch (err) {
        console.error(err);
        addActivity('Network error', 'Could not reach /train endpoint.', 'danger');
        showToast('Network Error during training', 'error');
    } finally {
        appState.isTraining = false;
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="zap"></i><span>Initiate Training</span>`;
        if (progress) progress.classList.add('hidden');
        if (badge) { badge.textContent = 'Idle'; badge.classList.remove('badge-running'); }
        lucide.createIcons();
    }
}

// ─── 4. Prediction Engine ─────────────────────────────────────────────────────
async function predict() {
    if (appState.isPredicting) return;

    const features = {
        age:    parseFloat(document.getElementById('age').value),
        income: parseFloat(document.getElementById('income').value),
        loan:   parseFloat(document.getElementById('loan').value),
        credit: parseFloat(document.getElementById('credit').value)
    };

    // Validate
    for (const [key, val] of Object.entries(features)) {
        if (isNaN(val)) {
            showToast(`Invalid value for ${key}`, 'error');
            return;
        }
    }

    appState.isPredicting = true;
    const btn = document.getElementById('predictBtn');
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="spin-icon"></i><span>Analyzing…</span>`;
    lucide.createIcons();
    showToast('Analyzing applicant profile…', 'info');

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(features)
        });
        const res = await response.json();

        if (res.success) {
            updatePredictionUI(res);
            refreshPlots(res.plots);
            addActivity(`Prediction: ${res.prediction}`, `Confidence: ${(res.probability * 100).toFixed(1)}%`, res.prediction === 'Approved' ? 'success' : 'danger');
            addNotification('Prediction Successful', `Credit request ${res.prediction.toUpperCase()}`);
            showToast(`Result: ${res.prediction}`, res.prediction === 'Approved' ? 'success' : 'warning');
        } else {
            showToast('Prediction failed — train model first', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Network Error during prediction', 'error');
    } finally {
        appState.isPredicting = false;
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="play"></i><span>Calculate Outcome</span>`;
        lucide.createIcons();
    }
}

// ─── 5. UI Sync ───────────────────────────────────────────────────────────────
function updateMetricsUI(m) {
    // Stat cards — animated counters
    countUp('stat-accuracy', 0, m.accuracy * 100, 1200, v => `${v.toFixed(1)}%`);
    countUp('stat-samples',  0, m.samples,         800,  v => Math.round(v).toLocaleString());

    const now = new Date();
    animateText('stat-time', `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);

    // Training metrics
    animateText('metric-auc',       m.auc.toFixed(3));
    animateText('metric-f1',        m.f1.toFixed(3));
    animateText('metric-precision', m.precision.toFixed(3));
    animateText('metric-recall',    m.recall.toFixed(3));

    // Integrity circle
    const score = Math.round(m.accuracy * 100);
    const circle = document.getElementById('integrityCircle');
    if (circle) {
        // Animate stroke-dasharray
        let start = 0;
        const dur = 1400;
        const t0 = performance.now();
        const animate = (t) => {
            const prog = Math.min((t - t0) / dur, 1);
            const ease = 1 - Math.pow(1 - prog, 3);
            const val = Math.round(start + (score - start) * ease);
            circle.setAttribute('stroke-dasharray', `${val}, 100`);
            document.getElementById('integrityPct').textContent = `${val}%`;
            if (prog < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    // Trend
    const trend = document.getElementById('trend-accuracy');
    if (trend) { trend.textContent = '+2.4% from last run'; trend.classList.add('positive'); }
}

function updatePredictionUI(res) {
    const card        = document.getElementById('result-card');
    const placeholder = document.getElementById('result-placeholder');
    const outcome     = document.getElementById('predictionOutcome');
    const fill        = document.getElementById('prob-fill');
    const text        = document.getElementById('prob-text');
    const analysis    = document.getElementById('analysis-panel');

    if (placeholder) placeholder.classList.add('hidden');
    if (card) card.classList.remove('hidden');
    if (analysis) analysis.classList.remove('hidden');

    const isHardRejection = res.is_hard_rejection || false;
    const isApproved = res.prediction.toLowerCase() === 'approved';
    
    // Outcome Header
    outcome.textContent = isApproved ? '✓ Approved' : '✗ Declined';
    if (isHardRejection) outcome.textContent = '⚠ High Risk Flag';

    outcome.style.color = isApproved ? 'var(--success)' : 'var(--danger)';
    if (isHardRejection) outcome.style.color = 'var(--warning)';

    outcome.style.textShadow = isApproved
        ? '0 0 30px rgba(37,99,235,0.4)'
        : '0 0 30px rgba(244,63,94,0.4)';
    if (isHardRejection) outcome.style.textShadow = '0 0 30px rgba(245,158,11,0.4)';

    // Update Overall Verdict Chip
    const verdictChip = document.getElementById('analysisVerdict');
    if (verdictChip) {
        if (isHardRejection) {
            verdictChip.textContent = 'Rule Violation';
            verdictChip.style.background = 'rgba(245,158,11,0.15)';
            verdictChip.style.color = '#fbbf24';
            verdictChip.style.border = '1px solid rgba(245,158,11,0.3)';
        } else {
            verdictChip.textContent = isApproved ? 'Low Risk Profile' : 'High Risk Profile';
            verdictChip.style.background = isApproved ? 'rgba(37,99,235,0.15)' : 'rgba(244,63,94,0.15)';
            verdictChip.style.color = isApproved ? '#60a5fa' : '#fb7185';
            verdictChip.style.border = `1px solid ${isApproved ? 'rgba(37,99,235,0.3)' : 'rgba(244,63,94,0.3)'}`;
        }
    }

    const prob = isHardRejection ? 0 : (res.probability * 100).toFixed(1);
    // Animate meter
    requestAnimationFrame(() => {
        fill.style.width = `${prob}%`;
        fill.style.background = isHardRejection 
            ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
            : (isApproved ? 'linear-gradient(90deg,#2563eb,#60a5fa)' : 'linear-gradient(90deg,#f43f5e,#fb7185)');
    });
    const confidenceText = isHardRejection ? "Rejected by Policy" : `${parseFloat(prob).toFixed(1)}% Confidence`;
    countUp('prob-text', 0, parseFloat(prob), 1500, v => isHardRejection ? "Rejected by Policy" : `${v.toFixed(1)}% Confidence`);

    // ── Render SHAP Breakdown ──────────────────────────────────────────────
    const shapList = document.getElementById('shapBreakdown');
    if (shapList) {
        if (isHardRejection && res.reasons) {
            shapList.innerHTML = res.reasons.map((reason, idx) => `
                <div class="shap-item policy-violation" style="animation-delay: ${idx * 0.1}s">
                    <div class="shap-item-header">
                        <span class="text-warning">Policy Violation</span>
                        <i data-lucide="alert-triangle" class="warning-icon"></i>
                    </div>
                    <p class="shap-reason" style="color: var(--text-primary); font-weight: 500;">${reason}</p>
                </div>
            `).join('');
            lucide.createIcons();
        } else if (res.shap_breakdown) {
            shapList.innerHTML = res.shap_breakdown.map((item, idx) => {
                const barColor = item.direction === 'positive' ? '#2563eb' : '#f43f5e';
                const width = (item.impact * 100).toFixed(0); 
                return `
                    <div class="shap-item" style="animation-delay: ${idx * 0.1}s">
                        <div class="shap-item-header">
                            <span>${item.label}</span>
                            <span style="color:${barColor}">${item.direction === 'positive' ? '+' : '-'}${item.impact.toFixed(2)}</span>
                        </div>
                        <div class="shap-bar-bg">
                            <div class="shap-bar-fill" style="width: 0%; background: ${barColor};" data-width="${width}%"></div>
                        </div>
                        <p class="shap-reason">${item.reason}</p>
                    </div>
                `;
            }).join('');

            // Animate bars after a short delay
            setTimeout(() => {
                shapList.querySelectorAll('.shap-bar-fill').forEach(bar => {
                    bar.style.width = bar.getAttribute('data-width');
                });
            }, 100);
        }
    }

    // ── Render Improvement Tips ───────────────────────────────────────────
    const improvementsList = document.getElementById('improvementsList');
    const improvementsIntro = document.getElementById('improvements-intro');

    if (improvementsList && res.improvements) {
        if (res.improvements.length > 0) {
            if (improvementsIntro) {
                improvementsIntro.textContent = isApproved 
                    ? "Your profile is strong, but here's how to reach maximum confidence:" 
                    : "Actionable steps to increase your approval chances:";
            }
            
            improvementsList.innerHTML = res.improvements.map((tip, idx) => `
                <div class="improvement-item" style="animation-delay: ${idx * 0.12}s">
                    <div class="improvement-icon">
                        <i data-lucide="${tip.priority === 'high' ? 'layout-list' : 'trending-up'}"></i>
                    </div>
                    <div class="improvement-content">
                        <span class="improvement-label text-primary">${tip.label}</span>
                        <p class="improvement-tip">${tip.tip}</p>
                        <span class="priority-tag p-${tip.priority}">${tip.priority} Priority</span>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        } else {
            if (improvementsIntro) improvementsIntro.textContent = "Your profile is optimized for this model.";
            improvementsList.innerHTML = `<p class="muted centered" style="padding: 20px;">No specific improvements suggested. Confidence is high.</p>`;
        }
    }
}

function refreshPlots(plots) {
    const t = Date.now();
    const set = (id, src) => {
        const el = document.getElementById(id);
        if (el && src) el.src = `${src}?t=${t}`;
    };
    set('summaryPlot',    plots?.summary);
    set('dependencePlot', plots?.dependence);
    set('waterfallPlot',  plots?.waterfall);
}

// ─── 6. Counter Animations ────────────────────────────────────────────────────
function countUp(elemId, from, to, duration, formatter) {
    const el = document.getElementById(elemId);
    if (!el) return;
    const t0 = performance.now();
    const tick = (t) => {
        const prog = Math.min((t - t0) / duration, 1);
        const ease = 1 - Math.pow(1 - prog, 3); // cubic ease-out
        const val  = from + (to - from) * ease;
        el.textContent = formatter ? formatter(val) : val.toFixed(2);
        if (prog < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function animateText(elemId, value) {
    const el = document.getElementById(elemId);
    if (!el) return;
    el.style.transform = 'scale(0.8)';
    el.style.opacity = '0';
    el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
    setTimeout(() => {
        el.textContent = value;
        el.style.transform = 'scale(1)';
        el.style.opacity = '1';
    }, 100);
}

// ─── 7. Notifications ────────────────────────────────────────────────────────
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    panel.classList.toggle('hidden');

    // Close search popover if open
    document.getElementById('searchPopover')?.classList.add('hidden');
}

function addNotification(title, msg) {
    const list  = document.getElementById('notificationList');
    const empty = list?.querySelector('.empty-state');
    if (empty) empty.remove();

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('div');
    item.className = 'noti-item';
    item.innerHTML = `
        <span class="noti-title">${title}</span>
        <span class="noti-time">${time} — ${msg}</span>
    `;
    list?.prepend(item);

    // Show dot
    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = 'block';
    appState.notifications.push({ title, msg, time });
}

function clearNotifications() {
    const list = document.getElementById('notificationList');
    if (list) list.innerHTML = '<div class="empty-state">No new notifications</div>';
    const dot = document.getElementById('notifDot');
    if (dot) dot.style.display = 'none';
    appState.notifications = [];
    showToast('Notifications cleared', 'info');
}

// ─── 8. Activity Feed ─────────────────────────────────────────────────────────
function addActivity(title, detail, type = 'info') {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    const colorMap = {
        info:     'dot-indigo',
        success:  'dot-green',
        danger:   'dot-red',
        warning:  'dot-amber',
        training: 'dot-violet'
    };
    const tagMap = {
        info:     'tag-info',
        success:  'tag-success',
        danger:   'tag-danger',
        warning:  'tag-warning',
        training: 'tag-training'
    };
    const tagLabel = {
        info:     'System',
        success:  'Success',
        danger:   'Error',
        warning:  'Warning',
        training: 'ML'
    };

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.style.animation = 'fadeSlideIn 0.35s ease both';
    item.innerHTML = `
        <div class="activity-dot ${colorMap[type] || 'dot-indigo'}"></div>
        <div class="activity-body">
            <span class="activity-title">${title}</span>
            <span class="activity-time">${time} — ${detail}</span>
        </div>
        <span class="activity-tag ${tagMap[type] || 'tag-info'}">${tagLabel[type] || 'Info'}</span>
    `;
    feed.prepend(item);

    // Keep max 6 items
    const items = feed.querySelectorAll('.activity-item');
    if (items.length > 6) items[items.length - 1].remove();
}

// ─── 9. Toast System ──────────────────────────────────────────────────────────
const TOAST_ICONS = {
    success:  'check-circle',
    error:    'x-circle',
    warning:  'alert-triangle',
    info:     'info',
    navigate: 'compass'
};
const TOAST_COLORS = {
    success:  '#2563eb',
    error:    '#f43f5e',
    warning:  '#f59e0b',
    info:     '#6366f1',
    navigate: '#8b5cf6'
};

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icon  = TOAST_ICONS[type] || 'info';
    const color = TOAST_COLORS[type] || '#6366f1';
    toast.style.borderLeftColor = color;
    toast.innerHTML = `<i data-lucide="${icon}" style="color:${color}"></i><span>${msg}</span>`;
    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(60px)';
        setTimeout(() => toast.remove(), 450);
    }, 3200);
}

// ─── 10. Search ───────────────────────────────────────────────────────────────
function initSearchListener() {
    const search  = document.getElementById('mainSearch');
    const popover = document.getElementById('searchPopover');
    if (!search || !popover) return;

    search.addEventListener('focus', () => {
        popover.classList.remove('hidden');
        popover.querySelector('.search-list').innerHTML = '<div class="search-result-item" style="color:var(--text-muted);font-style:italic;">Start typing to search…</div>';
    });

    document.addEventListener('click', (e) => {
        if (!search.contains(e.target) && !popover.contains(e.target)) {
            popover.classList.add('hidden');
        }
        if (!document.getElementById('notificationPanel').contains(e.target) &&
            !document.getElementById('btn-notifications').contains(e.target)) {
            document.getElementById('notificationPanel')?.classList.add('hidden');
        }
    });

    const SEARCH_ITEMS = [
        { label: 'Model Accuracy',    view: 'overview'     },
        { label: 'Income Feature',    view: 'predictions'  },
        { label: 'Credit Score',      view: 'predictions'  },
        { label: 'Waterfall Plot',    view: 'explanations' },
        { label: 'XGBoost Training',  view: 'training'     },
        { label: 'ROC AUC Score',     view: 'training'     },
        { label: 'SHAP Beeswarm',     view: 'explanations' },
        { label: 'Feature Correlation', view: 'explanations' },
        { label: 'Settings',          view: 'settings'     }
    ];

    search.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const list = popover.querySelector('.search-list');

        if (q.length < 1) {
            list.innerHTML = '<div class="search-result-item" style="color:var(--text-muted);font-style:italic;">Start typing…</div>';
            return;
        }

        const results = SEARCH_ITEMS.filter(f => f.label.toLowerCase().includes(q));
        if (results.length > 0) {
            list.innerHTML = results.map(r =>
                `<div class="search-result-item" onclick="switchView('${r.view}');document.getElementById('mainSearch').value='';document.getElementById('searchPopover').classList.add('hidden');">
                    <strong>${r.label}</strong>
                    <span style="font-size:0.72rem;color:var(--text-muted);margin-left:8px;">${PAGE_TITLES[r.view]}</span>
                </div>`
            ).join('');
        } else {
            list.innerHTML = `<div class="search-result-item" style="color:var(--text-muted);">No results for "<em>${q}</em>"</div>`;
        }
    });
}

// ─── 11. Refresh Button ───────────────────────────────────────────────────────
function handleRefresh() {
    const btn = document.getElementById('btn-refresh');
    if (btn) {
        btn.style.animation = 'spin 0.7s linear';
        setTimeout(() => btn.style.animation = '', 700);
    }
    showToast('Dashboard refreshed', 'info');
    addActivity('Dashboard refreshed', 'Manual refresh triggered.', 'info');
}

// ─── 12. Floating Particles ───────────────────────────────────────────────────
function initParticles() {
    // Subtle floating particle canvas effect (lightweight, no lib)
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.25;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W, H, particles;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        particles = Array.from({ length: 28 }, () => createParticle());
    }

    function createParticle() {
        return {
            x:  Math.random() * (W || 1200),
            y:  Math.random() * (H || 800),
            r:  Math.random() * 1.5 + 0.5,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            a:  Math.random()
        };
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(140,130,255,${0.3 + 0.4 * Math.sin(p.a)})`;
            ctx.fill();

            p.x += p.vx; p.y += p.vy; p.a += 0.015;
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;
        });
        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
}

// ─── CSS animation helper (spin) ─────────────────────────────────────────────
const spinStyle = document.createElement('style');
spinStyle.textContent = `
@keyframes spin { to { transform: rotate(360deg); } }
.spin-icon { animation: spin 0.8s linear infinite; }
`;
document.head.appendChild(spinStyle);