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
      eq:  ['eq',  '~',  '==', '≡'],
      shf: ['shf', '|',  '#' ],
      pir: ['pir', '\\|/', '$' ],
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
        return 4;
      case 'pir':
      case 'shf':
        return 3;
      case 'and':
      case 'imp':
        return 2;
      case 'eq':
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
    const res = /^[a-zA-Z]$/.test(str);
    return res;
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
      if (oper) {
        if (oper === 'not' && this.isVariable(last))
          res.push('and');
        res.push(oper);
        last = oper;
      }
      else {
        for (const ch of word) {
          const oper = this.isOperation(ch);

          const lastWasVar      = this.isVariable(last);
          const curIsVar        = this.isVariable(ch);
          const curIsLit        = this.isLiteral(ch);
          const curIsBr         = (ch === '(' || ch === ')');
          const curIsNotOper    = oper === 'not';
          const varBeforeOpenBr = (lastWasVar && ch === '(');
          const varAfterClsdBr  = (last === ')' && curIsVar);
          const varNearBracket  = (varBeforeOpenBr || varAfterClsdBr);
          const bracketsMult    = (last === ')' && ch === '(');
          const varsMult        = lastWasVar && curIsVar;
          const notMult         = lastWasVar && curIsNotOper;

          if (!curIsVar && !oper && !curIsBr && !curIsLit) {
            this.error(`unknown symbol '${word}'`);
            break;
          }

          if (varNearBracket || bracketsMult || varsMult || notMult)
            res.push('and');

          res.push(oper ? oper : ch);
          last = ch;
        }
      }
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
            if (!this.isVariable(word)) {
              this.error(`Unknown symbol: '${word}'`);
              break
            }

            que.push(word);
            if (this.vars.includes(word) === false) {
              this.varCount++;
              if (this.varCount > this.maxVarCount)
                return this.error('too much variables!');
              this.vars.push(word);
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

      const lastWasVar  = this.isVariable(last) || this.isLiteral(last);
      const lastWasOper = (this.isOperation(last));
      const lastWasBiOp = (lastWasOper && lastWasOper !== 'not');
      const lastWasUnOp = (lastWasOper === 'not');
      const curIsBr     = (word === '(' || word === ')');
      const curIsOper   = (this.isOperation(word));
      const curIsVar    = this.isVariable(word) || this.isLiteral(word);
      const curIsUnOp   = (curIsOper === 'not');
      const curIsBiOp   = (curIsOper && curIsOper !== 'not');

      if (requireBiOper && (curIsBiOp || curIsBr))
        requireBiOper = false;

      if (requireSecondVar && lastWasBiOp &&
         (curIsVar || curIsBr || curIsUnOp))
        requireSecondVar = false;

      if (requireVar && (curIsVar || curIsBr))
        requireVar = false;

      if (last === '(' && word === ')')
        this.error('empty brackets');

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

      if (!curIsVar && !curIsOper && !curIsBr)
        this.error(`unknown symbol '${word}'`);

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
    if (this.err) return this.parsedStr = [ 'error' ];
    this.checkForErrors();
    if (this.err) return this.parsedStr = [ 'error' ];
    this.makeRPN();
    if (this.err) return this.parsedStr = [ 'error' ];
    this.calculateAll();
    if (this.err) return this.parsedStr = [ 'error' ];
    return this.table;
  }
}

module.exports = { RPN }
