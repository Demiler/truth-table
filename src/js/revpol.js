class Stack {
  constructor(data = []) { this.data = data.slice(); this.topi = data.length; }
  push(element) { this.data[this.topi++] = element; }
  length()      { return this.topi; }
  top()         { return this.data[this.topi - 1]; }
  empty()       { return this.topi === 0; }
  pop() {
    if (this.empty()) return;
    this.topi--;
    return this.data.pop();
  }
}

class RPN {
  constructor(str) {
    this.opearions = {
      and: ['and', '*',  '&' ],
      or:  ['or',  '+',  '||'],
      xor: ['xor', '⊕',  '^' ],
      imp: ['imp', '->',     ],
      eq:  ['eq',  '~',  '=='],
      shf: ['shf', '|',  '#' ],
      pir: ['pir', '\/', '$' ],
      not: ['not', '!',      ],
    }
    this.str = str;
    this.maxVarCount = 6;
    this.table = [];
    this.vector = [];
  }

  error(msg) {
    this.err = msg;
    //console.log('Error: ' + msg);
    if (this.onerror) this.onerror(msg);
    return msg;
  }


  getPrior(operation) {
    switch (operation) {
      case 'not':
      case 'pir':
      case 'shf':
      case 'eq':
        return 3;
      case 'and':
      case 'imp':
        return 2;
      case 'xor':
      case 'or':
        return 1;
    }
    return -1; //not an operatio
  }

  isOperation(str) {
    for (const name in this.opearions) {
      const op = this.opearions[name];
      if (op.includes(str)) return name;
    }
    return undefined;
  }

  isVariable(str) {
    return /[a-zA-Z]/.test(str);
  }

  isLiteral(str) {
    return str === '0' || str === '1';
  }

  fixString(str = this.str) {
    str = str.replace(/\(/g, ' ( ');
    str = str.replace(/\)/g, ' ) ');
    this.str = str;
    const expr = str.split(' ').filter(word => word !== '');
    let res = [];
    let last;

    for (const word of expr) {
      const oper = this.isOperation(word);
      if (oper) res.push(oper);
      else {
        for (const ch of word) {
          const oper = this.isOperation(ch);
          if (oper) res.push(oper);
          else {
            const lastWasBr       = (last === '(' || last === ')');
            const lastWasOper     = this.isOperation(last);
            const lastWasVar      = (last && !lastWasBr && !lastWasOper);
            const curIsVar        = (ch !== '(' && ch !== ')');
            const varBeforeOpenBr = (lastWasVar && ch === '(');
            const varAfterClsdBr  = (last === ')' && curIsVar);
            const varNearBracket  = (varBeforeOpenBr || varAfterClsdBr);
            const bracketsMult    = (last === ')' && ch === '(');
            const varsMult        = lastWasVar && curIsVar;

            if (varNearBracket || bracketsMult || varsMult)
              res.push('and');

            res.push(ch);
          }
          last = ch;
        }
      }
      last = word;
    }

    this.parsedStr = res;
    return res;
  }

  makeRPN(expr = this.parsedStr) {
    let que = [];
    let stack = new Stack();
    this.vars = [];
    this.varCount = 0;

    for (const word of expr) {
      const oper = this.isOperation(word);
      if (oper) {
        const curPrior = this.getPrior(oper);
        while (this.getPrior(stack.top()) > curPrior)
          que.push(stack.pop());
        stack.push(oper);
      }
      else if (this.isLiteral(word)) {
        que.push(word);
      }
      else {
        switch (word) {
          case '(':
            stack.push('('); break;
          case ')':
            while (!stack.empty() && stack.top() !== '(')
              que.push(stack.pop());
            stack.pop();
            break;
          default:
            que.push(word);
            if (this.vars.includes(word) === false) {
              this.vars.push(word);
              this.varCount++;
              if (this.varCount > this.maxVarCount)
                return this.error('too much variables!');
            }
        }
      }
    }

    while (stack.top())
      que.push(stack.pop());

    this.parsedRPN = que.reverse();
    return this.parsedRPN;
  }

  calculateStep(vars, expr = this.parsedRPN) {
    let stack = new Stack(expr);
    let que = [];

    while (!stack.empty()) {
      const top = stack.pop();
      const oper = this.isOperation(top);
      if (oper === 'not') 
        que.push(!que.pop() | 0); //| 0 to keep 0/1 notation
      else if (oper) {
        const b = que.pop();
        const a = que.pop();
        let res = 0;

        switch (oper) {
          case 'and': res = (a & b); break;
          case 'or' : res = (a | b); break;
          case 'xor': res = ((a & !b) | (!a & b)); break;
          case 'imp': res = (!a | b); break;
          case 'eq' : res = (a === b); break;
          case 'shf': res = (!(a & b)); break;
          case 'pir': res = (!(a | b)); break;
          default: this.error('Error unknown operation!');
        }
        que.push(res | 0);
      }
      else if (this.isLiteral(top)) {
        que.push(Number(top));
      }
      else {
        que.push(vars[top]);
      }
    }

    return que[0];
  }

  calculateAll(parsedRPN = this.parsedRPN) {
    this.table = [];
    this.vector = [];
    const compos = 1 << this.varCount;
    for (let i = 0; i < compos; i++) {
      let pos = this.varCount - 1;
      let arr = [];
      let varsObj = new Object();
      for (const name of this.vars) {
        varsObj[name] = (i >> pos--) & 1;
        arr.push(varsObj[name]);
      }
      const res = this.calculateStep(varsObj, parsedRPN);
      arr.push(res);
      this.table.push(arr);
      this.vector.push(res);
    }
    return this.table;
  }

  checkForErrors(parsedStr = this.parsedStr) {
    let bracketsCounter = 0;
    let requireSecondVar = false;
    let requireBiOper = false;
    let requireVar = false;
    let last;
    for (const word of parsedStr) {
      if (word === '(') bracketsCounter++;
      else if (word === ')') bracketsCounter--;
      
      const lastWasBr   = (last === '(' || last === ')');
      const lastWasVar  = (last && !lastWasBr);
      const lastWasOper = (this.isOperation(last));
      const lastWasBiOp = (lastWasOper && lastWasOper !== 'not');
      const lastWasUnOp = (lastWasOper === 'not');
      const curIsBr     = (word === '(' || word === ')');
      const curIsOper   = (this.isOperation(word));
      const curIsVar    = (!curIsBr && !curIsOper);
      const curIsUnOp   = (curIsOper === 'not');
      const curIsBiOp   = (curIsOper && curIsOper !== 'not');

      if (requireBiOper && (curIsBiOp || curIsBr))
        requireBiOper = false;

      if (requireSecondVar && lastWasBiOp && 
         (curIsVar || curIsBr || curIsUnOp))
        requireSecondVar = false;

      if (requireVar && (curIsVar || curIsBr))
        requireVar = false;

      if (requireBiOper) { 
        requireBiOper = false;
        this.error("missing binary operator for " + last);
      }

      if (requireSecondVar) {
        requireBiOper = false;
        this.error("missing varaible for operator " + last);
      }

      if (requireVar) {
        requireVar = false
        this.error("missing variable for operator " + last);
      }

      if (curIsBiOp && !lastWasVar && last !== ')')
        this.error("missing varaible for operator " + word);

      if (curIsBiOp)
        requireSecondVar = true;

      if (curIsUnOp)
        requireVar = true;

      if (curIsVar && !lastWasUnOp)
        requireBiOper = true;

      last = word;
    }

    if (bracketsCounter !== 0) this.error('missing bracket!');
    if (requireSecondVar) this.error('missing last variable');
    if (requireVar) this.error('missing last variable');
  }

  calculate(str = this.str) {
    this.err = undefined;
    this.str = str;
    this.fixString();
    this.checkForErrors();
    if (this.err) return;
    this.makeRPN();
    if (this.err) return;
    this.calculateAll();
    if (this.err) return;
    return this.table;
  }
}

module.exports = { RPN };
