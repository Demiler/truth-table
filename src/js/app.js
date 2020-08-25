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

      .table {
        margin-top: 15px;
        background-color: #343434;
        padding: 5px;
        width: fit-content;
        border-radius: 5px;
        position: relative;
        overflow-y: auto;
        max-height: 600px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .line.top {
        background-color: #444;
      }

      .line.top.fixed {
        position: fixed;
        width: auto;
        top: 82px;
      }

      .line {
        padding: 10px 0;
        width: 100%;
      }

      .line:not(:last-child) {
        border-bottom: 2px solid #232323;
      }

      .line .value {
        text-align: center;
        padding: 10px;
        height: 100%;
      }

      .line:not(.top) .value.result {
        border-left: 2px solid #232323;
      }

      .right-side {
        margin-left: auto;
      }

      .classes {
        margin-top: 15px;
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
      }

      .tooltip {
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
      }

      .tooltip:hover {
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
  }

  firstUpdated() {
    this.input = this.shadowRoot.querySelector('input');
    this.input.value = 'a + b';
    this.parse();
  }

  render() {
    return html`
      <input class='expr-input' @input=${this.parse}>
      <div class='parsed'>${this.rpn.parsedStr && this.rpn.parsedStr.join(' ')}</div>
      <div class='error ${this.error === '' ? 'empty' : 'fill'}'>${this.error}</div>
      <div class='container'>
        <div class='table'>
          ${!this.rpn.str.length ? html`
            <span class='item'>empty</span>
          ` : html`
            <div class='line top fixed'>
              ${this.rpn.vars.map(v => html`
                <span class='value'>${v}</span>
              `)}
              <span class='value result'>result</span>
            </div>
            <div class='line top'>
              ${this.rpn.vars.map(v => html`
                <span class='value'>${v}</span>
              `)}
              <span class='value result'>result</span>
            </div>
            ${this.rpn.table.map(res => html`
              <div class='line'>
                ${res.map((el, i) => html`
                  <span class='value ${i === res.length - 1 ? 'result' : ''} ${!!el}'
                  >${el}</span>
                `)}
              </div>
            `)}
          `}
        </div>

        <div class='right-side'>
          <div class='classes'>
            ${!this.rpn.str.length ? html`
              <span class='item'>empty</span>
            ` : html`
              ${Object.entries(this.classes).map(cls => html`
                <span class='item ${cls[1]}'>
                  <span class='name ${cls[0]}'>${cls[0]}</span>
                  <span class='value ${cls[1]}'>${cls[1]}</span>
                </span>
              `)}
            `}
            </div>

            <div class='tooltip'>
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
    `;
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

  makeThing() {
    const jeg = this.rpn.vector.slice();
    let half = jeg.length / 2;

    for (let i = 0; i < this.rpn.varCount; i++) {
      for (let j = 0; j < jeg.length; j += 2 * half)
        for (let i = j; i < half + j; i++)
          jeg[i + half] ^= jeg[i];

      half /= 2;
    }

    for (let i = 0; i < jeg.length; i++) {
      if (jeg[i] && this.countBits(i) > 1)
        return false;
    }
    return true;
  }

  makeAnotherThing() {
    const { table } = this.rpn;
    let mon = 0;

    for (let i = 0; i < table.length; i++) {
      for (let j = 0; j < table.length; j++) {
        if (i === j) continue;
        const len = table[i].length - 1;
        const comp = this.compareSet(table[i], table[j], len);
        if (comp > 0) {
          if (table[i][len] < table[j][len]) return false;
        }
        else if (comp < 0) {
          if (table[i][len] > table[j][len]) return false;
        }
      }
    }
    return true;
  }

  anotherThing() {
    const { vector } = this.rpn;
    const len = vector.length;
    for (let i = 0; i < len / 2; i++)
      if (vector[i] === vector[len - i - 1])
        return false;
    return true;
  }

  fillClasses() {
    this.classes = {
      T0: this.rpn.table[0].every(el => el === 0),
      T1: this.rpn.table[this.rpn.table.length - 1].every(el => el === 1),
      L: this.makeThing(),
      S: this.anotherThing(),
      M: this.makeAnotherThing(),
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

  static get properties() {
    return {
      error: { type: String },
    }
  }
}

customElements.define('my-app', App); 
