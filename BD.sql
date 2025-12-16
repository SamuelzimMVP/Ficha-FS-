INSERT INTO skills (name) VALUES
('Destreza'),
('Agilidade'),
('Luta'),
('Contra-ataque'),
('Inteligência'),
('Psicologia'),
('Vigor'),
('Percepção'),
('Intimidar'),
('Poder'),
('Sorte'),
('Sentido'),
('Medicina'),
('Primeiro Socorros'),
('Pontaria'),
('Furtividade'),
('Lábia'),
('Carisma'),
('Correr'),
('Força')
ON CONFLICT (name) DO NOTHING;
CREATE TABLE attack_dice (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attack_id INTEGER NOT NULL,

    quantity INT NOT NULL,
    sides INT NOT NULL,

    CONSTRAINT fk_attack
      FOREIGN KEY (attack_id)
      REFERENCES attacks(id)
      ON DELETE CASCADE
);
CREATE TABLE attacks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    character_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    flat_damage INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_attack_character
      FOREIGN KEY (character_id)
      REFERENCES characters(id)
      ON DELETE CASCADE
);
CREATE TABLE character_skills (
    character_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    value INT NOT NULL DEFAULT 40,

    PRIMARY KEY (character_id, skill_id),

    CONSTRAINT fk_character
      FOREIGN KEY (character_id)
      REFERENCES characters(id)
      ON DELETE CASCADE,

    CONSTRAINT fk_skill
      FOREIGN KEY (skill_id)
      REFERENCES skills(id)
      ON DELETE CASCADE
);
CREATE TABLE skills (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE characters (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,

    hp_current INT NOT NULL DEFAULT 100,
    hp_max INT NOT NULL DEFAULT 100,

    sanity_current INT NOT NULL DEFAULT 100,
    sanity_max INT NOT NULL DEFAULT 100,

    mana_blocks INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
