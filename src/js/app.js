import { LitElement, html, css } from 'lit-element'
const { RPN } = require('./revpol.js');

class App extends LitElement {
  static get styles() {
    return css`
      :host {
        font-size: 24px;
      }

      ::-webkit-scrollbar {
          width: 6px;
          background-color: #000;
      }
       
      ::-webkit-scrollbar-track {
          background-color: #4e4e4e;
      }
       
      ::-webkit-scrollbar-thumb {
          border-radius: 10px;
          background-color: #707070;
      }

      .expr-input {
        background-color: #343434;
        color: #eee;
        border-radius: 5px;
        border: none;
        font-size: 24px;
        width: 100%;
      }

      .wrap {
        max-height: 600px;
        overflow-y: auto;
        overflow-x: hidden;
        border-radius: 5px;
      }

      .table {
        background-color: #343434;
        padding: 5px;
        border-collapse: collapse;
      }

      .line.top {
        background-color: #444;
      }

      .line.top.fixed {
        position: fixed;
        width: auto;
        top: 77px;
        padding: 0 !important;
        opacity: .3;
        border: none !important;
      }

      .line {
        padding: 10px 0;
        width: 100%;
      }

      .line:not(.top):hover {
        background-color: #444;
      }

      .line:not(:last-child) {
        border-bottom: 2px solid #232323;
      }

      .line .value {
        text-align: center;
        padding: 10px;
        height: 100%;
        min-width: 20px;
      }

      .line:not(.top) .value.result {
        border-left: 2px solid #232323;
      }

      .right-side {
        margin-left: auto;
      }

      .classes {
        background-color: #343434;
        padding: 5px;
        border-radius: 5px;
        display: flex;
        width: 300px;
        height: 50px;
      }

      .classes .item {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1 1 0;
        border-right: 2px solid #282828;
      }

      .classes .item:last-child {
        border-right: none;
      }

      .classes .name {
        width: 100%;
        text-align: center;
        border-bottom: 2px solid #282828;
      }

      .classes .value.true {
        border-bottom: 3px solid #126433;
      }

      .classes .value.false {
        border-bottom: 3px solid #642433;
      }

      .container {
        display: flex;
        margin-top: 15px;
      }

      .howtouse {
        margin-top: 15px;
        background-color: #343434;
        border-radius: 5px;
        padding: 5px;
        font-size: 10px;
        width: fit-content;
        margin-left: auto;
        text-align: center;
        transition: .3s;
        transform-origin: right top;
        display: none;
      }

      .howtouse:hover {
        transform: scale(2);
      }

      .error {
        padding: 5px;
        margin: 15px 0;
        background-color: #c43636f9;
        border-radius: 5px;
        transition: .3s;
        position: absolute;
      }

      .error.empty {
        top: -30px;
        right: 0;
      }
      .error.fill {
        top: -10px;
        right: 0;
      }

      .parsed {
        background-color: #343434;
        height: 20px;
        font-size: 14px;
        color: #888;
        border-radius: 5px;
        margin-top: 5px;
        width: fit-content;
        padding: 0 5px;
      }

      .parsed:empty {
        opacity: 0;
      }

      .tooltip {
        font-size: 14px;
        padding: 5px;
        border-radius: 5px;
        box-shadow: 0 0 2px 2px #000000a0;
        background-color: #242424;
        position: absolute;
        top: attr('x');
        right: attr('y');
      }

      .tooltip[hidden] {
        display: none;
      }
    `;
  }

  constructor() {
    super();
    this.rpn = new RPN('');
    this.error = '';
    this.rpn.onerror = (msg) => {
      setTimeout(() => {
        if (this.rpn.err) this.error = msg;
      }, 500);
      setTimeout(() => this.error = '', 3000);
    }
    this.timeout = 200;
    this.expl = { T0: '', T1: '', L: '', S: '', M: '' }
  }

  firstUpdated() {
    this.input = this.shadowRoot.querySelector('input');
    this.tooltip = this.shadowRoot.querySelector('.tooltip');

    this.tooltip.hidden = true;
    this.input.value = 'a + b';
    this.parse();
  }

  render() {
    return html`
      <input class='expr-input' @input=${this.parse}>
      <div class='parsed'>${this.makeCool()}</div>
      <div class='error ${this.error === '' ? 'empty' : 'fill'}'>${this.error}</div>
      <div class='container'>
        <div class='wrap table-wrap'><table class='table'>
          ${!this.rpn.str.length ? html`
            <span class='item'>empty</span>
          ` : html`
            <tr class='line top fixed'>
              ${this.rpn.vars.map(v => html`
                <td class='value'>${v}</td>
              `)}
            </tr>
            <tr class='line top'>
              ${this.rpn.vars.map(v => html`
                <td class='value'>${v}</td>
              `)}
              <td class='value result'>result</td>
            </tr>
            ${this.rpn.table.map(res => html`
              <tr class='line'>
                ${res.map((el, i) => html`
                  <td class='value ${i === res.length - 1 ? 'result' : ''} ${!!el}'
                  >${el}</td>
                `)}
              </tr>
            `)}
          `}
        </table></div>

        <div class='right-side'>
          <div class='classes'>
            ${!this.rpn.str.length ? html`
              <span class='item'>empty</span>
            ` : html`
              ${Object.entries(this.classes).map(cls => html`
                <span class='item ${cls[1]}'>
                  <span class='name ${cls[0]}'>${cls[0]}</span>
                  <span class='value ${cls[1]}' 
                  @mouseover=${(e) => this.showtip(cls[0], e)}
                  @mouseout=${this.hidetip}
                  >${cls[1]}</span>
                </span>
              `)}
            `}
            </div>

            <div class='howtouse'>
              <span class='title'>How to Use</span>
              <span class='text'>
                <div>Just enter an expressin.</div>
                <div>Enter function as</div>
                <div>and * &</div>
                <div>or + ||</div>
                <div>xor ^</div>
                <div>imp -></div>
                <div>eq ~ ==</div>
                <div>shf | #</div>
                <div>pir \/ $</div>
                <div>not !</div>
                <div>Example: 'a or !b'</div>
              </span>
            </div>
          </div>
      </div>
      <div class='tooltip'>${this.tip}</div>
    `;
  }

  makeCool() {
    if (!this.rpn.parsedStr) return;
    let res = this.rpn.parsedStr.map(word => {
      switch (word) {
        case 'and': word = '&&'; break;
        case 'or' : word = '||'; break;
        case 'xor': word = '⊕';  break;
        case 'imp': word = '→';  break;
        case 'eq' : word = '≡';  break;
        case 'shf': word = '↓'; break;
        case 'pir': word = '│'; break;
        case 'not': word = '!'; break;
      }
      return word;
    }).join(' ');
    res = res.replace(/! /g, '!');
    return res;
  }

  compareSet(a, b, len = a.length) {
    let res = 0;
    for (let i = 0; i < len; i++)
      if (a[i] <= b[i])
        if (res === 1) return 0;
        else res = -1;
      else 
        if (res === -1) return 0;
        else res = 1;

    return res;
  }

  countBits(number) {
    let bits = 0;
    while (number) {
      bits += number & 1;
      number >>= 1;
    }
    return bits;
  }

  isLinear() {
    const jeg = this.rpn.vector.slice();
    let half = jeg.length / 2;

    for (let i = 0; i < this.rpn.varCount; i++) {
      for (let j = 0; j < jeg.length; j += 2 * half)
        for (let i = j; i < half + j; i++)
          jeg[i + half] ^= jeg[i];

      half /= 2;
    }

    for (let i = 0; i < jeg.length; i++) {
      if (jeg[i] && this.countBits(i) > 1) {
        this.expl.L = `Because of set number ${i}: ${jeg[i]}`;
        return false;
      }
    }
    this.expl.L = 'this function is linear';
    return true;
  }

  isMonotone() {
    const { table } = this.rpn;
    let mon = 0;

    for (let i = 0; i < table.length; i++) {
      for (let j = 0; j < table.length; j++) {
        if (i === j) continue;
        const len = table[i].length - 1;
        const comp = this.compareSet(table[i], table[j], len);
        if (comp > 0) {
          if (table[i][len] < table[j][len]) {
            this.expl.M = `Set ${i} > set ${j} but res of ${i} < ${j}`;
            return false;
          }
        }
        else if (comp < 0) {
          if (table[i][len] > table[j][len]) {
            this.expl.M = `Set ${i} < set ${j} but res of ${i} > ${j}`;
            return false;
          }
        }
      }
    }
    this.expl.M = 'This function is monotone';
    return true;
  }

  isS() {
    const { vector } = this.rpn;
    const len = vector.length;
    for (let i = 0; i < len / 2; i++)
      if (vector[i] === vector[len - i - 1]) {
        this.expl.S = `result of set ${i} == ${len - i - 1}`;
        return false;
      }
    
    this.expl.S = 'This is self-dual function';
    return true;
  }

  isT0() {
    const res = this.rpn.table[0].every(el => el === 0);
    this.expl.T0 = `Result of the first set is equals ${!res | 0}`;
    return res;
  }

  isT1() {
    const res = 
      this.rpn.table[this.rpn.table.length - 1].every(el => el === 1);
    this.expl.T1 = `Result of the last set is equals ${res | 0}`;
    return res; 
  }

  fillClasses() {
    this.classes = {
      T0: this.isT0(),
      T1: this.isT1(),
      L: this.isLinear(),
      S: this.isS(),
      M: this.isMonotone(),
    }
  }

  parse(event) {
    clearTimeout(this.parseto);
    this.parseto = setTimeout(() => {
      this.rpn.calculate(this.input.value);
      this.fillClasses();
      this.requestUpdate();
    }, this.timeout);
  }

  showtip(whatClass, e) {
    this.tooltip.style = `top: ${e.y + 20}px; left: ${e.x - 150}px`;
    this.tooltip.hidden = false;
    this.tip = this.expl[whatClass];
  }

  hidetip() {
    this.tooltip.hidden = true;
  }

  static get properties() {
    return {
      error: { type: String },
      tip: { type: String },
    }
  }
}

customElements.define('my-app', App); 
