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

    // ---------- Media (videos) ----------
    {title:"Product Demo 2025", url:"assets/videos/sample.mp4", type:"media", icon:"fas fa-video", isVideo:true},
    {title:"Onboarding Intro", url:"assets/videos/onboarding.mp4", type:"media", icon:"fas fa-play-circle", isVideo:true},

    // ---------- News (PDF newsletters) ----------
    {title:"Q1 Newsletter", url:"assets/pdfs/newsletter-2025-01.pdf", type:"news", icon:"fas fa-newspaper", isPdf:true},
    {title:"Q2 Newsletter", url:"assets/pdfs/newsletter-2025-02.pdf", type:"news", icon:"fas fa-file-pdf", isPdf:true},

    // ---------- Applications ----------
    {title:"HR Portal", url:"https://hr.example.com", type:"app", icon:"fas fa-users-cog"},
    {title:"Finance Dashboard", url:"https://finance.example.com", type:"app", icon:"fas fa-chart-line"},

    // ---------- *** NEW LINKS *** ----------
    {title:"Rates", url:"https://rates.example.com", type:"rates", icon:"fas fa-percentage"},
    {title:"Learning", url:"https://learning.example.com", type:"learning", icon:"fas fa-graduation-cap"},
    {title:"Smart Applications", url:"https://smartapps.example.com", type:"smart", icon:"fas fa-robot"},
    {title:"Dashboards", url:"https://dashboards.example.com", type:"dashboard", icon:"fas fa-tachometer-alt"}
];

/* ====================== STORAGE ====================== */
const STORAGE_KEY = 'intranet_prefs';
let prefs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {clicks:{}, order:[]};

/* ====================== HELPERS ====================== */
function savePrefs() { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); }
function recordClick(id) {
    prefs.clicks[id] = (prefs.clicks[id]||0) + 1;
    savePrefs();
    sortAndRender();
}
function getSortedLinks() {
    return links.map((l,i)=>({...l, id:i}))
        .sort((a,b)=> (prefs.clicks[b.id]||0) - (prefs.clicks[a.id]||0) );
}

/* ====================== RENDER ====================== */
const grid = document.getElementById('linkGrid');
const modal = document.getElementById('videoModal');
const modalVideo = document.getElementById('modalVideo');
const closeModal = document.querySelector('.close');

function createCard(link) {
    const card = document.createElement('div');
    card.className = `card ${link.type}`;
    card.dataset.id = link.id;

    card.innerHTML = `
        <div class="icon"><i class="${link.icon}"></i></div>
        <h3>${link.title}</h3>
        <p>${link.url.replace(/^https?:\/\//,'').split('/')[0]}</p>
    `;

    card.addEventListener('click', e=>{
        e.preventDefault();
        recordClick(link.id);
        if (link.isVideo) {
            modalVideo.src = link.url;
            modal.style.display = 'flex';
        } else if (link.isPdf) {
            window.open(link.url, '_blank');
        } else {
            window.open(link.url, '_blank');
        }
    });
    return card;
}

function render() {
    grid.innerHTML = '';
    getSortedLinks().forEach(l => grid.appendChild(createCard(l)));
}
function sortAndRender() { render(); }

/* ====================== SEARCH ====================== */
document.getElementById('globalSearch').addEventListener('input', e=>{
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.card').forEach(c=>{
        c.style.display = c.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
});

/* ====================== DARK MODE ====================== */
document.getElementById('darkModeToggle').addEventListener('click', ()=>{
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    document.getElementById('darkModeToggle').innerHTML = isDark
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
});

/* ====================== MODAL CLOSE ====================== */
closeModal.onclick = () => { modal.style.display='none'; modalVideo.src=''; };
window.onclick = e => { if (e.target===modal) { modal.style.display='none'; modalVideo.src=''; } };

/* ====================== INIT ====================== */
render();