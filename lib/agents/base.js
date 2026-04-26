export class Agent {
  constructor(name) {
    this.name = name;
  }
  
  async run(input) {
    throw new Error(`${this.name}.run() must be implemented`);
  }
  
  log(msg) {
    console.log(`${this.name}：${msg}`);
  }
}