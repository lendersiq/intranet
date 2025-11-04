/* ====================== DATA ====================== */
const links = [
    // ---------- SaaS ----------
    {title:"Slack", url:"https://slack.com", type:"saas", icon:"fab fa-slack"},
    {title:"Notion", url:"https://notion.so", type:"saas", icon:"fas fa-book"},
    {title:"Figma", url:"https://figma.com", type:"saas", icon:"fas fa-pen-fancy"},

    // ---------- Google ----------
    {title:"Gmail", url:"https://mail.google.com", type:"google", icon:"fas fa-envelope"},
    {title:"Drive", url:"https://drive.google.com", type:"google", icon:"fas fa-folder"},
    {title:"Calendar", url:"https://calendar.google.com", type:"google", icon:"fas fa-calendar-alt"},

    // ---------- Media ----------
    {title:"Product Demo 2025", url:"assets/videos/sample.mp4", type:"media", icon:"fas fa-video", isVideo:true},
    {title:"Onboarding Intro", url:"assets/videos/onboarding.mp4", type:"media", icon:"fas fa-play-circle", isVideo:true},

    // ---------- News ----------
    {title:"Q1 Newsletter", url:"assets/pdfs/newsletter-2025-01.pdf", type:"news", icon:"fas fa-newspaper", isPdf:true},
    {title:"Q2 Newsletter", url:"assets/pdfs/newsletter-2025-02.pdf", type:"news", icon:"fas fa-file-pdf", isPdf:true},

    // ---------- Apps ----------
    {title:"HR Portal", url:"https://hr.example.com", type:"app", icon:"fas fa-users-cog"},
    {title:"Finance Dashboard", url:"https://finance.example.com", type:"app", icon:"fas fa-chart-line"},

    // ---------- Other ----------
    {title:"Rates", url:"https://rates.example.com", type:"rates", icon:"fas fa-percentage"},
    {title:"Learning", url:"https://learning.example.com", type:"learning", icon:"fas fa-graduation-cap"},
    {title:"Smart Applications", url:"https://smartapps.example.com", type:"smart", icon:"fas fa-robot"},
    {title:"Dashboards", url:"https://dashboards.example.com", type:"dashboard", icon:"fas fa-tachometer-alt"},
    {title:"Policy", url:"https://policy.example.com", type:"policy", icon:"fas fa-gavel"},

    // ---------- FOLDER EXAMPLE ----------
    {
        title: "Atlassian Tools",
        type: "folder",
        icon: "fas fa-folder",
        subcards: [
            {title:"Jira", url:"https://jira.example.com", type:"saas", icon:"fab fa-jira"},
            {title:"Confluence", url:"https://confluence.example.com", type:"saas", icon:"fab fa-confluence"},
            {title:"Bitbucket", url:"https://bitbucket.example.com", type:"saas", icon:"fab fa-bitbucket"}
        ]
    }
];

/* ====================== DOM ELEMENTS ====================== */
const grid       = document.getElementById('linkGrid');
const modal      = document.getElementById('videoModal');
const modalVideo = document.getElementById('modalVideo');
const closeModal = document.querySelector('.close');

/* ====================== STORAGE & CLICK TRACKING ====================== */
const STORAGE_KEY = 'intranet_prefs';
let prefs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {clicks:{}};

function savePrefs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// Only regular links trigger re-sort
function recordClick(id) {
    prefs.clicks[id] = (prefs.clicks[id] || 0) + 1;
    savePrefs();
    sortAndRender();  // ← Only here (after user leaves page)
}

function getSortedLinks() {
    return links.map((l,i) => ({...l, id:i}))
               .sort((a,b) => (prefs.clicks[b.id]||0) - (prefs.clicks[a.id]||0));
}

/* ====================== UTILS ====================== */
function getTypeColor(type) {
    const colors = {
        saas: '#4caf50', google: '#4285f4', media: '#e91e63', news: '#ff9800',
        app: '#9c27b0', rates: '#c9a02c', learning: '#003366', smart: '#87CEEB',
        dashboard: '#6A5ACD', policy: '#607D8B', folder: '#FF8C00'
    };
    return colors[type] || '#666';
}

/* ====================== CARD CREATION ====================== */
function createSubcard(link) {
    //console.log(`  [Subcard] Creating: ${link.title} (ID: ${link.id})`);

    const div = document.createElement('div');
    div.className = 'subcard';
    div.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
            <i class="${link.icon}" style="color:${getTypeColor(link.type)}; font-size:1.2rem;"></i>
            <strong>${link.title}</strong>
        </div>
    `;

    div.addEventListener('click', e => {
        e.stopPropagation();
        console.log(`  [Subcard Click] Opening: ${link.title}`);
        if (link.isVideo) {
            modalVideo.src = link.url;
            modal.style.display = 'flex';
        } else if (link.isPdf) {
            window.open(link.url, '_blank');
        } else {
            window.open(link.url, '_blank');
        }
        recordClick(link.id);  // ← Triggers re-sort (user is leaving)
    });

    return div;
}

function createCard(link) {
    //console.log('Creating card for:', link.title, 'Type:', link.type, 'ID:', link.id);

    const card = document.createElement('div');
    card.className = `card ${link.type}`;
    card.dataset.id = link.id;

    if (link.subcards) {
        console.log(`Folder detected: ${link.title} has ${link.subcards.length} subcards`);

        const subgrid = document.createElement('div');
        subgrid.className = 'subgrid';

        link.subcards.forEach((sub, i) => {
            const subId = `${link.id}-${i}`;
            const sublink = { ...sub, id: subId };
            console.log(`  → Adding subcard: ${sublink.title} (ID: ${subId})`);
            subgrid.appendChild(createSubcard(sublink));
        });

        card.innerHTML = `
            <div class="icon"><i class="${link.icon}"></i></div>
            <h3>${link.title} <small>(${link.subcards.length})</small></h3>
            <p>Click to expand</p>
        `;

        card.appendChild(subgrid);

        // FOLDER: Toggle only — NO re-render!
        card.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Clicked folder: ${link.title} | Toggling subgrid`);
            const isExpanded = subgrid.classList.toggle('show');
            card.classList.toggle('expanded', isExpanded);

            // Record click but DON'T re-render
            prefs.clicks[link.id] = (prefs.clicks[link.id] || 0) + 1;
            savePrefs();
        });

    } else {
        // console.log(`Regular link: ${link.title} → ${link.url}`);
        card.innerHTML = `
            <div class="icon"><i class="${link.icon}"></i></div>
            <h3>${link.title}</h3>
            <p>${link.url.replace(/^https?:\/\//,'').split('/')[0]}</p>
        `;

        card.addEventListener('click', e => {
            e.preventDefault();
            recordClick(link.id);  // ← Triggers re-sort (user is leaving)
            if (link.isVideo) {
                modalVideo.src = link.url;
                modal.style.display = 'flex';
            } else if (link.isPdf) {
                window.open(link.url, '_blank');
            } else {
                window.open(link.url, '_blank');
            }
        });
    }
    return card;
}

/* ====================== RENDER ====================== */
function render() {
    grid.innerHTML = '';
    getSortedLinks().forEach(l => grid.appendChild(createCard(l)));
}
function sortAndRender() { render(); }

/* ====================== SEARCH ====================== */
document.getElementById('globalSearch').addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.card').forEach(c => {
        const txt = c.textContent.toLowerCase();
        c.style.display = txt.includes(term) ? '' : 'none';
    });
});

/* ====================== DARK MODE ====================== */
document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('darkModeToggle').innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
});

/* ====================== MODAL CLOSE ====================== */
closeModal.onclick = () => {
    modal.style.display = 'none';
    modalVideo.src = '';
};
window.onclick = e => {
    if (e.target === modal) {
        modal.style.display = 'none';
        modalVideo.src = '';
    }
};

/* ====================== INIT ====================== */
render();