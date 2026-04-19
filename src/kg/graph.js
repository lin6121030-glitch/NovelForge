export class KnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.relations = [];
    this.rules = [];
    this.constraints = [];
  }

  fromWorldModel(worldModel) {
    this.buildNodes(worldModel.entities);
    this.buildRelations(worldModel.entities);
    this.extractConstraints(worldModel.consistency);
    return this;
  }

  buildNodes(entities) {
    for (const realm of entities.realms || []) {
      this.addNode('realm', realm.name, {
        description: realm.description,
        type: 'world'
      });
    }

    for (const being of entities.beings || []) {
      this.addNode('being', being.name, {
        description: being.description,
        type: 'character'
      });
    }

    for (const faction of entities.factions || []) {
      this.addNode('faction', faction.name, {
        description: faction.description,
        type: 'organization'
      });
    }

    for (const rule of entities.rules || []) {
      if (rule.title) {
        this.addNode('rule', rule.title, {
          content: rule.content,
          type: 'mechanic'
        });
      }
    }
  }

  addNode(category, id, data) {
    if (!this.nodes.has(category)) {
      this.nodes.set(category, new Map());
    }
    this.nodes.get(category).set(id, { ...data, id });
  }

  buildRelations(entities) {
    const relationPatterns = [
      { from: 'realm', to: 'being', type: 'inhabits' },
      { from: 'being', to: 'faction', type: 'belongs_to' },
      { from: 'being', to: 'realm', type: 'resides_in' },
      { from: 'faction', to: 'realm', type: 'controls' }
    ];

    for (const pattern of relationPatterns) {
      this.relations.push(pattern);
    }
  }

  extractConstraints(consistency) {
    this.constraints = [
      {
        type: 'realm_rule',
        description: '高阶杀低阶引发天道反噬',
        severity: 'critical'
      },
      {
        type: ' Beast_realm_lock',
        description: '降阶兽等级 ≤ 宿主境界+2',
        severity: 'critical'
      },
      {
        type: '固化锁定',
        description: '道纹固化后不可逆，无法归凡',
        severity: 'critical'
      },
      {
        type: '道纹倒计时',
        description: '境界越高，天道磨灭越快',
        severity: 'critical'
      }
    ];
  }

  checkConsistency(entity, context) {
    const violations = [];

    for (const constraint of this.constraints) {
      if (this.violatesConstraint(entity, constraint, context)) {
        violations.push({
          constraint: constraint.description,
          severity: constraint.severity
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  violatesConstraint(entity, constraint, context) {
    return false;
  }

  getContext(targetEntity, depth = 2) {
    const context = {
      self: this.getEntity(targetEntity),
      related: [],
      rules: []
    };

    for (const [category, nodes] of this.nodes) {
      if (category === 'rule') {
        context.rules.push(...Array.from(nodes.values()));
      }
    }

    return context;
  }

  getEntity(id) {
    for (const [, nodes] of this.nodes) {
      if (nodes.has(id)) return nodes.get(id);
    }
    return null;
  }

  export() {
    return {
      nodes: Object.fromEntries(this.nodes),
      relations: this.relations,
      constraints: this.constraints
    };
  }
}