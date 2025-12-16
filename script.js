console.log("SCRIPT CARREGOU");

// ==========================
// DADOS DO SISTEMA
// ==========================
// Nome da chave no localStorage
const STORAGE_KEY = "ficha_fs_loaded_characters";

// Salva os personagens carregados no localStorage
function saveLoadedCharactersToStorage() {
    const serializable = Array.from(loadedCharacters.entries()).map(([id, p]) => {
        // Remove funções ou dados complexos; mantém só o necessário
        return {
            id: Number(id),
            name: p.name || '',
            hp_current: p.hp_current || 100,
            hp_max: p.hp_max || 100,
            sanity_current: p.sanity_current || 100,
            sanity_max: p.sanity_max || 100,
            mana_blocks: p.mana_blocks || 0,
            skills: Array.isArray(p.skills) ? p.skills : [],
            attacks: Array.isArray(p.attacks) ? p.attacks : []
        };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

// Carrega os personagens do localStorage ao iniciar
function loadLoadedCharactersFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const list = JSON.parse(saved);
            list.forEach(item => {
                loadedCharacters.set(item.id, item);
            });
        }
    } catch (e) {
        console.warn("Não foi possível carregar personagens salvos localmente.", e);
    }
}
const skills = [
    'Destreza', 'Agilidade', 'Luta', 'Contra-ataque',
    'Inteligência', 'Psicologia', 'Vigor', 'Percepção',
    'Intimidar', 'Poder', 'Sorte', 'Sentido',
    'Medicina', 'Primeiro Socorros', 'Pontaria', 'Furtividade',
    'Lábia', 'Carisma', 'Correr', 'Força'
];

let character = {
    id: null, // ← adicionado
    name: '',
    hpCurrent: 100,
    hpMax: 100,
    sanityCurrent: 100,
    sanityMax: 100,
    manaBlocks: 0,
    skills: {}
};

let attacks = [];
let tempDice = [];
let selectedCharacterId = null;

skills.forEach(s => character.skills[s] = 40);

// ==========================
// INICIALIZAÇÃO
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initCharacterTabs();
    renderSkills();
    initCharacterInputs();
    initAttacks();
    initSaveLoadButtons();

    loadLoadedCharactersFromStorage();
    renderLoadedCharacters();
});

function initSaveLoadButtons() {
    const saveBtn = document.getElementById("save-character");
    const loadBtn = document.getElementById("load-character");
    document.getElementById("load-character")?.addEventListener("click", carregarPersonagem);
    if (saveBtn) saveBtn.addEventListener("click", salvarPersonagem);
    if (loadBtn) loadBtn.addEventListener("click", carregarPersonagem);
}

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
            <input type="number" min="0" max="100" value="${character.skills[skill] ?? 40}" data-skill="${skill}">
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
function rollDice(sides = 100) {
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
    if (skillValue <= 0) return { success: false, good: false, extreme: false, crit: false, critThreshold: 0 };

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
    const skillValue = character.skills[skill] ?? 40;
    const modInput = document.getElementById('advantage-mod');
    const mod = modInput ? Number(modInput.value) || 0 : 0;

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

// Fechar modais
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
    }
});
function updateBars() {
    const hpCurrent = character.hpCurrent || 0;
    const hpMax = character.hpMax || 100;
    const sanityCurrent = character.sanityCurrent || 0;
    const sanityMax = character.sanityMax || 100;

    const hpPercent = hpMax > 0 ? Math.min(100, Math.max(0, (hpCurrent / hpMax) * 100)) : 0;
    const sanityPercent = sanityMax > 0 ? Math.min(100, Math.max(0, (sanityCurrent / sanityMax) * 100)) : 0;

    // Só atualiza se os elementos existirem
    const hpFill = document.getElementById("hp-fill");
    const sanityFill = document.getElementById("sanity-fill");

    if (hpFill) hpFill.style.width = `${hpPercent}%`;
    if (sanityFill) sanityFill.style.width = `${sanityPercent}%`;
}

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

    Object.entries(map).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.value = character[key] ?? (typeof character[key] === 'number' ? 0 : '');
        el.addEventListener('input', e => {
            character[key] = e.target.type === 'number'
                ? Number(e.target.value) || 0
                : e.target.value;

            // ✅ Atualiza as barras SEMPRE que HP ou Sanidade mudar
            if (['hpCurrent', 'hpMax', 'sanityCurrent', 'sanityMax'].includes(key)) {
                updateBars();
            }
        });
    });

    // Atualiza as barras ao carregar
    updateBars();
}

// ==========================
// ATAQUES
// ==========================
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
    const qtyEl = document.getElementById('dice-qty');
    const sidesEl = document.getElementById('dice-sides');
    const qty = Number(qtyEl?.value) || 0;
    const sides = Number(sidesEl?.value) || 0;

    if (!qty || !sides || qty <= 0 || sides < 2) {
        alert('Preencha quantidade (≥1) e lados (≥2)');
        return;
    }

    tempDice.push({ qty, sides });
    renderTempDice();
}

function renderTempDice() {
    const list = document.getElementById('dice-list');
    if (!list) return;
    list.innerHTML = '';

    tempDice.forEach((d, i) => {
        const div = document.createElement('div');
        div.className = 'skill-item';
        div.innerHTML = `
            ${d.qty}d${d.sides}
            <button class="remove-dice" data-index="${i}">✖</button>
        `;
        list.appendChild(div);
    });

    list.querySelectorAll('.remove-dice').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.index);
            tempDice.splice(idx, 1);
            renderTempDice();
        });
    });
}

function saveAttack() {
    const nameEl = document.getElementById('attack-name');
    const descEl = document.getElementById('attack-desc');
    const flatEl = document.getElementById('attack-flat');

    const name = nameEl?.value?.trim();
    const desc = descEl?.value?.trim() || '';
    const flat = Number(flatEl?.value) || 0;

    if (!name || tempDice.length === 0) {
        alert('Nome e pelo menos um dado são obrigatórios');
        return;
    }

    attacks.push({ name, desc, flat, dice: [...tempDice] });
    tempDice = [];
    nameEl.value = '';
    descEl.value = '';
    flatEl.value = '0';
    document.getElementById('dice-list').innerHTML = '';

    document.getElementById('attack-modal').classList.remove('show');
    renderAttacks();
}

function renderAttacks() {
    const list = document.getElementById('attack-list');
    if (!list) return;
    list.innerHTML = '';

    attacks.forEach((atk, i) => {
        const diceText = atk.dice.map(d => `${d.qty}d${d.sides}`).join(' + ');
        const div = document.createElement('div');
        div.className = 'card';

        div.innerHTML = `
            <h4>${atk.name}</h4>
            <p>${atk.desc || ''}</p>
            <p><strong>${diceText} + ${atk.flat}</strong></p>
            <button class="btn btn-secondary" onclick="rollAttack(${i})">🎲 Rolar</button>
        `;

        list.appendChild(div);
    });
}

window.rollAttack = function(index) {
    const attack = attacks[index];
    let totalDamage = attack.flat;
    let rollsArray = [];

    attack.dice.forEach(d => {
        for (let i = 0; i < d.qty; i++) {
            const roll = rollDice(d.sides);
            totalDamage += roll;
            rollsArray.push({ sides: d.sides, value: roll });
        }
    });

    showDamageResult(attack.name, rollsArray, totalDamage, attack.flat);
};

function showDamageResult(name, rolls, total, guaranteed) {
    const grouped = {};
    rolls.forEach(r => {
        if (!grouped[r.sides]) grouped[r.sides] = [];
        grouped[r.sides].push(r.value);
    });

    let detailsHTML = "";
    for (const sides in grouped) {
        detailsHTML += `<div><strong>D${sides}</strong>: ${grouped[sides].join(", ")}</div>`;
    }

    const modal = document.getElementById("damage-result-modal");
    const content = document.getElementById("damage-result-content");

    content.innerHTML = `
        <div class="attack-title">${name}</div>
        <div class="attack-total">💥 TOTAL: ${total}</div>
        <div class="attack-flat">💠 Dano Garantido: +${guaranteed}</div>
        <button class="btn btn-secondary" id="toggle-details">Ver detalhes dos dados</button>
        <div id="damage-details-box" style="display:none;">${detailsHTML}</div>
    `;

    document.getElementById("toggle-details").onclick = () => {
        const box = document.getElementById("damage-details-box");
        box.style.display = box.style.display === "none" ? "block" : "none";
    };

    modal.classList.add("show");
}

// ==========================
// SALVAR E CARREGAR
// ==========================
const API_URL = "https://ficha-insana.vercel.app";

// Armazena os personagens já carregados (para evitar duplicatas)
const loadedCharacters = new Map();

// Substitua sua função carregarPersonagem() por esta:
async function carregarPersonagem() {
    const idInput = document.getElementById("character-id");
    const id = Number(idInput?.value);

    if (!id || id <= 0 || !Number.isInteger(id)) {
        alert("Por favor, digite um ID válido (número inteiro positivo).");
        return;
    }

    // Evita duplicatas (mesmo com localStorage)
    if (loadedCharacters.has(id)) {
        alert("Este personagem já está na lista.");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/personagens/${id}`);
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.erro || "Personagem não encontrado");
        }

        const p = await res.json();

        // Salva no Map local
        loadedCharacters.set(id, p);

        // ✅ SALVA NO localStorage (só os dados essenciais)
        saveLoadedCharactersToStorage();

        // Atualiza a lista
        renderLoadedCharacters();

        // Limpa o campo
        idInput.value = "";
    } catch (err) {
        console.error("Erro ao carregar personagem:", err);
        alert("❌ " + (err.message || "Erro ao carregar personagem."));
    }
}

function renderLoadedCharacters() {
    const list = document.getElementById("saved-character-list");
    if (!list) return;

    if (loadedCharacters.size === 0) {
        list.innerHTML = "<p style='color:#666;'>Digite um ID acima para carregar um personagem.</p>";
        return;
    }

    list.innerHTML = "";

    loadedCharacters.forEach((p, id) => {
        const item = document.createElement("div");
        item.className = "character-item";
        item.style.cssText = `
            background-color: #000;
            color: #ccc;
            border: none;
            border-radius: 8px;
            padding: 14px;
            margin-bottom: 14px;
            box-shadow: 0 0 0 2px #ff3333, 0 4px 8px rgba(0,0,0,0.5);
            position: relative;
        `;

        const name = p.name || "Sem nome";
        const hp = `${p.hp_current || 100} / ${p.hp_max || 100}`;
        const sanity = `${p.sanity_current || 100} / ${p.sanity_max || 100}`;
        const mana = p.mana_blocks || 0;

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <strong style="color: #fff; font-size: 1.15em;">${name}</strong>
                <span style="background: #333; color: #ff6666; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; border: 1px solid #555;">
                    ID: ${id}
                </span>
            </div>
            <div style="color: #bbb; font-size: 0.95em; margin: 8px 0; line-height: 1.4;">
                ❤️ Vida: ${hp} | 🧠 Sanidade: ${sanity} | 🔮 Mana: ${mana}
            </div>
            <div style="margin: 10px 0; color: #aaa; font-size: 0.9em;">
                <strong>Perícias:</strong> 
                <span>${Array.isArray(p.skills) ? p.skills.slice(0, 3).map(s => s.name).join(', ') + (p.skills.length > 3 ? '...' : '') : 'Nenhuma'}</span>
            </div>

            <!-- ✅ BARRA DE AÇÕES -->
            <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn btn-primary" style="flex:1; background-color: #c00; border: none; color: white; padding: 6px; border-radius: 4px; font-weight: bold;" data-id="${id}">
                    📥 Usar
                </button>
                <button class="btn btn-secondary delete-char" style="flex:1; background-color: #555; border: none; color: #ff6666; padding: 6px; border-radius: 4px;" data-id="${id}">
                    🗑️ Deletar
                </button>
                <button class="btn btn-secondary refresh-char" style="flex:1; background-color: #444; border: none; color: #4ade80; padding: 6px; border-radius: 4px;" data-id="${id}">
                    🔄 Atualizar
                </button>
            </div>
        `;

        // Botão "Usar"
        item.querySelector('button[data-id]').addEventListener('click', () => {
            applyCharacterToSheet(p);
        });

        // Botão "Deletar"
        item.querySelector('.delete-char').addEventListener('click', () => {
            if (confirm(`Remover "${name}" da sua lista local?`)) {
                loadedCharacters.delete(id);
                saveLoadedCharactersToStorage();
                renderLoadedCharacters();
            }
        });

        // Botão "Atualizar"
        item.querySelector('.refresh-char').addEventListener('click', async () => {
            try {
                const res = await fetch(`${API_URL}/personagens/${id}`);
                if (!res.ok) throw new Error("Não encontrado");
                const freshData = await res.json();

                // Atualiza no Map
                loadedCharacters.set(id, freshData);
                saveLoadedCharactersToStorage();
                renderLoadedCharacters();

                alert("✅ Personagem atualizado!");
            } catch (err) {
                alert("❌ Falha ao atualizar personagem.");
                console.error(err);
            }
        });

        list.appendChild(item);
    });
}
document.getElementById("refresh-all")?.addEventListener("click", async () => {
    if (loadedCharacters.size === 0) {
        alert("Nenhum personagem para atualizar.");
        return;
    }

    const ids = Array.from(loadedCharacters.keys());
    let successCount = 0;

    for (const id of ids) {
        try {
            const res = await fetch(`${API_URL}/personagens/${id}`);
            if (res.ok) {
                const fresh = await res.json();
                loadedCharacters.set(id, fresh);
                successCount++;
            }
        } catch (e) {
            console.warn(`Falha ao atualizar ID ${id}`, e);
        }
    }

    saveLoadedCharactersToStorage();
    renderLoadedCharacters();
    alert(`✅ ${successCount} personagem(s) atualizado(s)!`);
});

// Aplica o personagem à ficha ativa
function applyCharacterToSheet(p) {
    try {
        character = {
            id: p.id || null,
            name: p.name || '',
            hpCurrent: p.hp_current || 100,
            hpMax: p.hp_max || 100,
            sanityCurrent: p.sanity_current || 100,
            sanityMax: p.sanity_max || 100,
            manaBlocks: p.mana_blocks || 0,
            skills: {}
        };

        // Reseta perícias
        skills.forEach(s => character.skills[s] = 40);
        if (Array.isArray(p.skills)) {
            p.skills.forEach(s => {
                if (s.name && character.skills.hasOwnProperty(s.name)) {
                    character.skills[s.name] = s.value ?? 40;
                }
            });
        }

        // Ataques
        attacks = [];
        if (Array.isArray(p.attacks)) {
            attacks = p.attacks.map(atk => ({
                name: atk.name || 'Ataque sem nome',
                desc: atk.description || '',
                flat: atk.flat_damage || 0,
                dice: (atk.dice || []).map(d => ({
                    qty: d.quantity || 1,
                    sides: d.sides || 6
                }))
            }));
        }

        // Atualiza a UI
        document.getElementById("char-name").value = character.name;
        document.getElementById("hp-current").value = character.hpCurrent;
        document.getElementById("hp-max").value = character.hpMax;
        document.getElementById("sanity-current").value = character.sanityCurrent;
        document.getElementById("sanity-max").value = character.sanityMax;
        document.getElementById("mana-blocks").value = character.manaBlocks;

        renderSkills();
        renderAttacks();
        updateBars(); // se você tiver as barras de vida/sanidade

        // ✅ MUDA O TEXTO DO BOTÃO PARA "ATUALIZAR"
        const saveBtn = document.getElementById("save-character");
        if (saveBtn && character.id) {
            saveBtn.textContent = "🔄 Atualizar Ficha";
            saveBtn.title = "Atualizar personagem no banco de dados";
        }

        // Vai para a aba de criação
        document.querySelector('.nav-btn[data-page="character"]').click();
        alert("✅ Personagem carregado!");
    } catch (err) {
        console.error(err);
        alert("❌ Erro ao carregar personagem.");
    }
}

// Nova função auxiliar para carregar diretamente pelo ID
async function carregarPersonagemPeloId(id) {
    try {
        const res = await fetch(`${API_URL}/personagens/${id}`);
        if (!res.ok) throw new Error("Personagem não encontrado");
        const p = await res.json();

        // Atualiza o objeto character global
        character = {
            name: p.name || '',
            hpCurrent: p.hp_current || 100,
            hpMax: p.hp_max || 100,
            sanityCurrent: p.sanity_current || 100,
            sanityMax: p.sanity_max || 100,
            manaBlocks: p.mana_blocks || 0,
            skills: {}
        };

        skills.forEach(s => character.skills[s] = 40);
        if (Array.isArray(p.skills)) {
            p.skills.forEach(s => {
                if (s.name && character.skills.hasOwnProperty(s.name)) {
                    character.skills[s.name] = s.value ?? 40;
                }
            });
        }

        attacks = [];
        if (Array.isArray(p.attacks)) {
            attacks = p.attacks.map(atk => ({
                name: atk.name || 'Ataque sem nome',
                desc: atk.description || '',
                flat: atk.flat_damage || 0,
                dice: (atk.dice || []).map(d => ({
                    qty: d.quantity || 1,
                    sides: d.sides || 6
                }))
            }));
        }

        // Atualiza a UI
        document.getElementById("char-name").value = character.name;
        document.getElementById("hp-current").value = character.hpCurrent;
        document.getElementById("hp-max").value = character.hpMax;
        document.getElementById("sanity-current").value = character.sanityCurrent;
        document.getElementById("sanity-max").value = character.sanityMax;
        document.getElementById("mana-blocks").value = character.manaBlocks;

        renderSkills();
        renderAttacks();

        // Vai para a aba de personagem
        document.querySelector('.nav-btn[data-page="character"]').click();
        alert("✅ Personagem carregado com sucesso!");
    } catch (err) {
        console.error("Erro ao carregar personagem:", err);
        alert("❌ Erro ao carregar personagem.");
    }
}

async function salvarPersonagem() {
    // Validação mínima
    if (!character.name?.trim()) {
        alert("❌ Nome é obrigatório.");
        return;
    }

    // ✅ Formato MÍNIMO que o backend geralmente aceita
    const personagem = {
        name: character.name.trim(),
        hp_current: Math.max(0, Number(character.hpCurrent) || 0),
        hp_max: Math.max(1, Number(character.hpMax) || 100),
        sanity_current: Math.max(0, Number(character.sanityCurrent) || 0),
        sanity_max: Math.max(1, Number(character.sanityMax) || 100),
        mana_blocks: Math.max(0, Number(character.manaBlocks) || 0),
        skills: [], // ←←← ENVIAR VAZIO PRIMEIRO PARA TESTAR
        attacks: [] // ←←← ENVIAR VAZIO PRIMEIRO PARA TESTAR
    };

    try {
        const res = await fetch(`${API_URL}/personagens`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(personagem)
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Resposta do backend:", data);
            alert("❌ Erro: " + (data.erro || data.message || "Dados inválidos"));
            return;
        }

        character.id = data.id;
        alert("✅ Salvo com sucesso!");
    } catch (e) {
        console.error("Erro de rede:", e);
        alert("❌ Sem conexão com o servidor.");
    }
}
// ==========================
// LISTA DE PERSONAGENS SALVOS
// ==========================
async function carregarPersonagensSalvos() {
    const list = document.getElementById("saved-character-list");
    const detailPanel = document.getElementById("character-detail");
    if (!list) return;

    try {
        const res = await fetch(`${API_URL}/personagens`);
        if (!res.ok) throw new Error("Falha ao buscar personagens");

        const personagens = await res.json();
        list.innerHTML = "";

        if (!Array.isArray(personagens) || personagens.length === 0) {
            list.innerHTML = "<p>Nenhum personagem salvo.</p>";
            detailPanel.style.display = "none";
            return;
        }

        personagens.forEach(p => {
            const item = document.createElement("div");
            item.className = "character-item";
            item.style.cursor = "pointer";
            item.style.padding = "0.5rem";
            item.style.borderBottom = "1px solid #eee";

            item.innerHTML = `
                <strong>${p.name || "Sem nome"}</strong>
                <div class="character-id">ID: ${p.id}</div>
            `;

            item.addEventListener("click", () => {
                detailPanel.style.display = "block";

                document.getElementById("detail-name").textContent = p.name || "Sem nome";
                document.getElementById("detail-hp").textContent = `${p.hp_current || 100} / ${p.hp_max || 100}`;
                document.getElementById("detail-sanity").textContent = `${p.sanity_current || 100} / ${p.sanity_max || 100}`;
                document.getElementById("detail-mana").textContent = p.mana_blocks || 0;

                const skillsDiv = document.getElementById("detail-skills");
                skillsDiv.innerHTML = "";
                if (Array.isArray(p.skills)) {
                    p.skills.forEach(s => {
                        const el = document.createElement("div");
                        el.className = "preview-skill";
                        el.textContent = `${s.name}: ${s.value}`;
                        skillsDiv.appendChild(el);
                    });
                }

                const attacksDiv = document.getElementById("detail-attacks");
                attacksDiv.innerHTML = "";
                if (Array.isArray(p.attacks) && p.attacks.length > 0) {
                    p.attacks.forEach(atk => {
                        const el = document.createElement("div");
                        el.className = "preview-attack";
                        const diceText = atk.dice?.map(d => `${d.quantity}d${d.sides}`).join(" + ") || "";
                        el.innerHTML = `<strong>${atk.name}</strong>: ${diceText} + ${atk.flat_damage || 0}`;
                        attacksDiv.appendChild(el);
                    });
                } else {
                    attacksDiv.innerHTML = "<p>Nenhum ataque</p>";
                }

                selectedCharacterId = p.id;

                const loadBtn = document.getElementById("load-saved-character");
                if (loadBtn) {
                    const newBtn = loadBtn.cloneNode(true);
                    loadBtn.parentNode.replaceChild(newBtn, loadBtn);
                    newBtn.addEventListener("click", () => {
                        if (selectedCharacterId) {
                            const idField = document.getElementById("character-id");
                            if (idField) idField.value = selectedCharacterId;
                            carregarPersonagem();
                        }
                    });
                }
            });

            list.appendChild(item);
        });
    } catch (err) {
        console.error(err);
        list.innerHTML = "<p>❌ Erro ao carregar personagens.</p>";
        detailPanel.style.display = "none";
    }
}

// Atualizar lista ao clicar em "Atualizar"
document.getElementById("refresh-characters")?.addEventListener("click", carregarPersonagensSalvos);

document.getElementById("clear-character")?.addEventListener("click", () => {
    character = {
        id: null,
        name: '',
        hpCurrent: 100,
        hpMax: 100,
        sanityCurrent: 100,
        sanityMax: 100,
        manaBlocks: 0,
        skills: {}
    };
    skills.forEach(s => character.skills[s] = 40);
    attacks = [];
    
    // Atualiza UI
    initCharacterInputs();
    renderSkills();
    renderAttacks();
    updateBars();

    // ✅ Volta o botão ao modo "Salvar Novo"
    const saveBtn = document.getElementById("save-character");
    if (saveBtn) {
        saveBtn.textContent = "💾 Salvar Novo Personagem";
    }

    alert("Ficha limpa.");
});