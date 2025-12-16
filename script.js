console.log("SCRIPT CARREGOU");

// ==========================
// DADOS DO SISTEMA
// ==========================
const skills = [
    'Destreza', 'Agilidade', 'Luta', 'Contra-ataque',
    'Inteligência', 'Psicologia', 'Vigor', 'Percepção',
    'Intimidar', 'Poder', 'Sorte', 'Sentido',
    'Medicina', 'Primeiro Socorros', 'Pontaria', 'Furtividade',
    'Lábia', 'Carisma', 'Correr', 'Força'
];

let character = {
    name: '',
    hpCurrent: 100,
    hpMax: 100,
    sanityCurrent: 100,
    sanityMax: 100,
    manaBlocks: 0,
    skills: {}
};

skills.forEach(s => character.skills[s] = 40);

// ==========================
// INICIALIZAÇÃO
// ==========================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCharacterTabs();
    renderSkills();
    initCharacterInputs();
    initAttacks();
    loadCharacterFromStorage();
});

// ==========================
// NAVEGAÇÃO PRINCIPAL
// ==========================
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.page)?.classList.add('active');
        });
    });
}

// ==========================
// ABAS DO PERSONAGEM
// ==========================
function initCharacterTabs() {
    const tabs = document.querySelectorAll('.char-tab');
    const contents = document.querySelectorAll('.char-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tab.dataset.tab)?.classList.add('active');
        });
    });
}

// ==========================
// PERÍCIAS
// ==========================
function renderSkills() {
    const container = document.getElementById('skills-container');
    if (!container) return;

    container.innerHTML = '';

    skills.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'skill-item';

        div.innerHTML = `
            <label>${skill}</label>
            <input type="number" min="0" max="100" value="${character.skills[skill]}" data-skill="${skill}">
            <button class="dice-btn" data-skill="${skill}">🎲</button>
        `;

        container.appendChild(div);
    });

    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', e => {
            character.skills[e.target.dataset.skill] = Number(e.target.value) || 0;
        });
    });

    container.querySelectorAll('.dice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            quickRollSkill(btn.dataset.skill);
        });
    });
}

// ==========================
// ROLAGEM DE PERÍCIA
// ==========================
function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}
function getCritThreshold(skill) {
    if (skill >= 90) return 5;
    if (skill >= 76) return 4;
    if (skill >= 60) return 3;
    if (skill >= 36) return 2;
    if (skill >= 10) return 1;
    return 0;
}

function evaluateSkillRoll(roll, skillValue) {
    const extreme = Math.floor(skillValue / 3);
    const good = Math.floor((skillValue * 2) / 3);

    const critThreshold = getCritThreshold(skillValue);
    const isCrit = roll <= critThreshold && critThreshold > 0;

    return {
        success: roll <= skillValue,
        good: roll <= good,
        extreme: roll <= extreme,
        crit: isCrit,
        critThreshold
    };
}

function quickRollSkill(skill) {
    const skillValue = character.skills[skill];
    const mod = Number(document.getElementById('advantage-mod')?.value) || 0;

    let rolls = [];
    let finalRoll;

    if (Math.abs(mod) <= 1) {
        finalRoll = rollDice(100);
    } else {
        for (let i = 0; i < Math.abs(mod); i++) {
            rolls.push(rollDice(100));
        }
        finalRoll = mod > 0 ? Math.min(...rolls) : Math.max(...rolls);
    }

    const result = evaluateSkillRoll(finalRoll, skillValue);

    showQuickRollModal(skill, finalRoll, skillValue, result, rolls, mod);
}


function showQuickRollModal(skillName, roll, skillValue, result, rolls = [], mod = 0) {
    const modal = document.getElementById('quick-roll-modal');
    const resultDiv = document.getElementById('quick-roll-result');

    if (!modal || !resultDiv) return;

    let successClass = result.success ? 'result-success' : 'result-failure';
    let successText = result.success ? '✅ SUCESSO' : '❌ FALHA';

    let html = `
        <div class="result-title">Teste de ${skillName}</div>
        <div class="result-details">🎲 Resultado: <strong>${roll}</strong></div>
        <div class="result-details">🎯 Perícia: <strong>${skillValue}</strong></div>
        <div class="${successClass}">${successText}</div>
    `;

    if (result.success) {
        if (result.crit) {
            html += `<div class="result-success">💥 SUCESSO CRÍTICO!!!</div>`;
        } else if (result.extreme) {
            html += `<div class="result-success">💎 SUCESSO EXTREMO!</div>`;
        } else if (result.good) {
            html += `<div class="result-success">⭐ SUCESSO BOM!</div>`;
        } else {
            html += `<div class="result-success">✅ SUCESSO NORMAL</div>`;
        }
    }

    if (rolls.length > 0) {
        html += `
            <div class="result-details">
                🎲 Dados Rolados (${mod > 0 ? 'Vantagem' : 'Desvantagem'}):
                ${rolls.join(', ')}
            </div>
        `;
    }

    resultDiv.innerHTML = html;
    modal.classList.add('show');
}


// Fechar modal
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    }
});

// ==========================
// INPUTS DO PERSONAGEM
// ==========================
function initCharacterInputs() {
    const map = {
        'char-name': 'name',
        'hp-current': 'hpCurrent',
        'hp-max': 'hpMax',
        'sanity-current': 'sanityCurrent',
        'sanity-max': 'sanityMax',
        'mana-blocks': 'manaBlocks'
    };

    Object.keys(map).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('change', e => {
            character[map[id]] = e.target.type === 'number'
                ? Number(e.target.value)
                : e.target.value;
        });
    });
}

// ==========================
// ATAQUES
// ==========================
let attacks = [];
let tempDice = [];

function initAttacks() {
    const addBtn = document.getElementById('add-attack-btn');
    const modal = document.getElementById('attack-modal');
    const closeBtn = document.getElementById('close-attack-modal');
    const saveBtn = document.getElementById('save-attack');
    const addDiceBtn = document.getElementById('add-dice');

    if (!addBtn || !modal) return;

    addBtn.onclick = () => modal.classList.add('show');
    closeBtn.onclick = () => modal.classList.remove('show');

    addDiceBtn.onclick = addTempDice;
    saveBtn.onclick = saveAttack;
}

function addTempDice() {
    const qty = Number(document.getElementById('dice-qty').value);
    const sides = Number(document.getElementById('dice-sides').value);

    if (!qty || !sides) return alert('Preencha quantidade e lados');

    tempDice.push({ qty, sides });
    renderTempDice();
}

function showDamageResult(name, rolls, total, guaranteed) {
    const grouped = {};

    rolls.forEach(r => {
        if (!grouped[r.sides]) grouped[r.sides] = [];
        grouped[r.sides].push(r.value);
    });
    let summaryHTML = "";
    let detailsHTML = "";

    for (const sides in grouped) {
        summaryHTML += `<div>• ${grouped[sides].length}d${sides}</div>`;
        detailsHTML += `
            <div class="damage-details">
                <strong>D${sides}</strong>: ${grouped[sides].join(", ")}
            </div>
        `;
    }
    const modal = document.getElementById("damage-result-modal");
    const content = document.getElementById("damage-result-content");

    let diceHTML = "";

    rolls.forEach(r => {
        diceHTML += `
            <div class="attack-die">
                D${r.sides}<br>${r.value}
            </div>
        `;
    });

    content.innerHTML = `
    <div class="attack-title">${name}</div>

    <div class="damage-summary">
        <h4>🎲 Dados</h4>
        ${summaryHTML}
    </div>

    <div class="attack-flat">
        💠 Dano Garantido: +${guaranteed}
    </div>

    <div class="attack-total">
        💥 TOTAL: ${total}
    </div>

    <button class="btn btn-secondary" id="toggle-details">
        Ver detalhes dos dados
    </button>

    <div id="damage-details-box" style="display:none;">
        ${detailsHTML}
    </div>
    `;
    document.getElementById("toggle-details").onclick = () => {
        const box = document.getElementById("damage-details-box");
        box.style.display = box.style.display === "none" ? "block" : "none";
    };


    modal.classList.add("show");
}



function renderTempDice() {
    const list = document.getElementById('dice-list');
    list.innerHTML = '';

    tempDice.forEach((d, i) => {
        const div = document.createElement('div');
        div.className = 'skill-item';
        div.innerHTML = `
            ${d.qty}d${d.sides}
            <button onclick="removeTempDice(${i})">✖</button>
        `;
        list.appendChild(div);
    });
}

function removeTempDice(i) {
    tempDice.splice(i, 1);
    renderTempDice();
}

function saveAttack() {
    const name = document.getElementById('attack-name').value;
    const desc = document.getElementById('attack-desc').value;
    const flat = Number(document.getElementById('attack-flat').value);

    if (!name || tempDice.length === 0) {
        return alert('Nome e dados são obrigatórios');
    }

    attacks.push({ name, desc, flat, dice: [...tempDice] });
    tempDice = [];

    document.getElementById('attack-modal').classList.remove('show');
    renderAttacks();
}

function renderAttacks() {
    const list = document.getElementById('attack-list');
    list.innerHTML = '';

    attacks.forEach((atk, i) => {
        const diceText = atk.dice.map(d => `${d.qty}d${d.sides}`).join(' + ');
        const div = document.createElement('div');
        div.className = 'card';

        div.innerHTML = `
            <h4>${atk.name}</h4>
            <p>${atk.desc || ''}</p>
            <p><strong>${diceText} + ${atk.flat}</strong></p>
            <button onclick="rollAttack(${i})">🎲 Rolar</button>
        `;

        list.appendChild(div);
    });
}

function rollAttack(index) {
    const attack = attacks[index];

    let totalDamage = attack.flat;
    let rollsArray = [];

    attack.dice.forEach(d => {
        for (let i = 0; i < d.qty; i++) {
            const roll = Math.floor(Math.random() * d.sides) + 1;
            totalDamage += roll;

            rollsArray.push({
                sides: d.sides,
                value: roll
            });
        }
    });

    showDamageResult(
        attack.name,
        rollsArray,
        totalDamage,
        attack.flat
    );
}


function closeDamageModal() {
    document.getElementById('damage-modal').classList.remove('show');
}

const API_URL = "https://ficha-insana.vercel.app";

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("save-character")
    .addEventListener("click", salvarPersonagem);
});

async function salvarPersonagem() {
  const personagem = {
    name: character.name,
    hpCurrent: character.hpCurrent,
    hpMax: character.hpMax,
    sanityCurrent: character.sanityCurrent,
    sanityMax: character.sanityMax,
    manaBlocks: character.manaBlocks,
    skills: character.skills,
    attacks: attacks
  };

  try {
    const res = await fetch(`${API_URL}/personagens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(personagem)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.erro || "Erro ao salvar personagem");
      return;
    }

    alert("✅ Personagem salvo com sucesso!");
  } catch (e) {
    console.error(e);
    alert("❌ Erro ao conectar com o backend");
  }
}
