/**
 * ============================================================================
 * C Syntax Highlighter & Lexical Analyzer
 * Compiler Design Academic Project
 * 
 * Demonstrates:
 * 1. Lexical Analysis (Scanning & Tokenization)
 * 2. Deterministic Character-by-Character Scanning
 * 3. Principle of Longest Match (Maximal Munch)
 * 4. Regular Grammar Patterns for C Tokens
 * 5. Symbol / Token Classification & Highlighting
 * ============================================================================
 */

// ============================================================================
// 1. C LANGUAGE LEXICAL SPECIFICATIONS
// ============================================================================

/**
 * Standard C reserved keywords (ANSI C89, C99, C11)
 */
const C_KEYWORDS = new Set([
  "auto", "break", "case", "char", "const", "continue", "default", "do",
  "double", "else", "enum", "extern", "float", "for", "goto", "if",
  "inline", "int", "long", "register", "restrict", "return", "short",
  "signed", "sizeof", "static", "struct", "switch", "typedef", "union",
  "unsigned", "void", "volatile", "while", "_Bool", "_Complex", "_Imaginary"
]);

/**
 * Standard C Operators sorted by length in descending order.
 * This guarantees the LONGEST MATCH rule (e.g. '==' matches before '=', '->' before '-')
 */
const C_OPERATORS = [
  // 3-character operators
  "...", "<<=", ">>=",
  // 2-character operators
  "==", "!=", "<=", ">=", "&&", "||", "++", "--",
  "->", "<<", ">>", "+=", "-=", "*=", "/=", "%=",
  "&=", "|=", "^=",
  // 1-character operators
  "+", "-", "*", "/", "%", "=", "<", ">", "!",
  "&", "|", "^", "~", "?", ":", "."
];

/**
 * C Delimiters / Punctuators (excluding operators)
 */
const C_DELIMITERS = new Set([
  "(", ")", "{", "}", "[", "]", ";", ","
]);

// ============================================================================
// 2. CUSTOM LEXICAL ANALYZER (LEXER)
// ============================================================================

class CLexer {
  /**
   * @param {string} source - The raw C source code
   */
  constructor(source) {
    this.source = source || "";
    this.length = this.source.length;
    this.cursor = 0;       // Current character index in source string
    this.line = 1;         // 1-based line number
    this.col = 1;          // 1-based column number
    this.tokens = [];      // Sequence of identified tokens
  }

  /**
   * Peeks at character at offset relative to current cursor without advancing
   */
  peek(offset = 0) {
    const idx = this.cursor + offset;
    return idx < this.length ? this.source[idx] : "";
  }

  /**
   * Returns current character and advances the cursor
   */
  advance() {
    if (this.cursor >= this.length) return "";
    const ch = this.source[this.cursor++];
    if (ch === "\n") {
      this.line++;
      this.col = 1;
    } else if (ch !== "\r") {
      this.col++;
    }
    return ch;
  }

  /**
   * Helper: checks if character is an ASCII letter or underscore
   */
  isAlphaOrUnderscore(ch) {
    return (ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_";
  }

  /**
   * Helper: checks if character is a decimal digit
   */
  isDigit(ch) {
    return ch >= "0" && ch <= "9";
  }

  /**
   * Helper: checks if character is alphanumeric or underscore
   */
  isAlnum(ch) {
    return this.isAlphaOrUnderscore(ch) || this.isDigit(ch);
  }

  /**
   * Helper: checks if character is a hex digit
   */
  isHexDigit(ch) {
    return this.isDigit(ch) || (ch >= "a" && ch <= "f") || (ch >= "A" && ch <= "F");
  }

  /**
   * Scans the entire source code into tokens
   * @returns {Array<Object>} List of tokens
   */
  tokenize() {
    this.tokens = [];
    this.cursor = 0;
    this.line = 1;
    this.col = 1;

    while (this.cursor < this.length) {
      const startLine = this.line;
      const startCol = this.col;
      const ch = this.peek();

      // 1. Whitespace & Newlines (Preserved to maintain exact layout)
      if (ch === " " || ch === "\t" || ch === "\r" || ch === "\n") {
        let ws = "";
        while (this.cursor < this.length) {
          const c = this.peek();
          if (c === " " || c === "\t" || c === "\r" || c === "\n") {
            ws += this.advance();
          } else {
            break;
          }
        }
        this.tokens.push({
          type: "WHITESPACE",
          value: ws,
          line: startLine,
          col: startCol
        });
        continue;
      }

      // 2. Single-line and Multi-line Comments
      if (ch === "/" && (this.peek(1) === "/" || this.peek(1) === "*")) {
        this.tokens.push(this.scanComment(startLine, startCol));
        continue;
      }

      // 3. Preprocessor Directives (#include, #define, etc.)
      if (ch === "#") {
        this.tokens.push(this.scanPreprocessor(startLine, startCol));
        continue;
      }

      // 4. String Literals ("...")
      if (ch === '"') {
        this.tokens.push(this.scanString(startLine, startCol));
        continue;
      }

      // 5. Character Literals ('.')
      if (ch === "'") {
        this.tokens.push(this.scanCharLiteral(startLine, startCol));
        continue;
      }

      // 6. Numeric Constants (Integers and Floating Points)
      if (this.isDigit(ch) || (ch === "." && this.isDigit(this.peek(1)))) {
        this.tokens.push(this.scanNumber(startLine, startCol));
        continue;
      }

      // 7. Keywords and Identifiers ([a-zA-Z_][a-zA-Z0-9_]*)
      if (this.isAlphaOrUnderscore(ch)) {
        this.tokens.push(this.scanIdentifierOrKeyword(startLine, startCol));
        continue;
      }

      // 8. Multi-character and Single-character Operators (Longest Match)
      const opToken = this.matchOperator(startLine, startCol);
      if (opToken) {
        this.tokens.push(opToken);
        continue;
      }

      // 9. Delimiters / Punctuators
      if (C_DELIMITERS.has(ch)) {
        const val = this.advance();
        this.tokens.push({
          type: "DELIMITER",
          value: val,
          line: startLine,
          col: startCol
        });
        continue;
      }

      // 10. Unknown / Unrecognized Character (Fallback to prevent hanging)
      const unknownChar = this.advance();
      this.tokens.push({
        type: "UNKNOWN",
        value: unknownChar,
        line: startLine,
        col: startCol
      });
    }

    return this.tokens;
  }

  /**
   * Scans single-line (//...) and multi-line (/*...*\/) comments
   */
  scanComment(startLine, startCol) {
    let comment = this.advance() + this.advance(); // consume '/' and ('/' or '*')
    const isMultiLine = comment[1] === "*";

    if (isMultiLine) {
      while (this.cursor < this.length) {
        if (this.peek() === "*" && this.peek(1) === "/") {
          comment += this.advance(); // '*'
          comment += this.advance(); // '/'
          break;
        }
        comment += this.advance();
      }
    } else {
      while (this.cursor < this.length && this.peek() !== "\n") {
        comment += this.advance();
      }
    }

    return {
      type: "COMMENT",
      value: comment,
      line: startLine,
      col: startCol
    };
  }

  /**
   * Scans preprocessor directives like #include <stdio.h> or #define MAX 100
   */
  scanPreprocessor(startLine, startCol) {
    let prep = this.advance(); // consume '#'

    // Consume until newline, but respect line continuations via backslash '\'
    // Stop before inline comments so they are classified as COMMENT tokens
    while (this.cursor < this.length) {
      if (this.peek() === "\n" || this.peek() === "\r") {
        break;
      }
      if (this.peek() === "\\") {
        if (this.peek(1) === "\r" && this.peek(2) === "\n") {
          prep += this.advance(); // '\'
          prep += this.advance(); // '\r'
          prep += this.advance(); // '\n'
          continue;
        } else if (this.peek(1) === "\n") {
          prep += this.advance(); // '\'
          prep += this.advance(); // '\n'
          continue;
        }
      }
      // Stop before inline comment
      if (this.peek() === "/" && (this.peek(1) === "/" || this.peek(1) === "*")) {
        break;
      }
      prep += this.advance();
    }

    return {
      type: "PREPROCESSOR",
      value: prep,
      line: startLine,
      col: startCol
    };
  }

  /**
   * Scans string literals with escape sequence support
   */
  scanString(startLine, startCol) {
    let str = this.advance(); // consume opening quote '"'

    while (this.cursor < this.length) {
      const ch = this.peek();
      if (ch === "\\") {
        // Escape sequence: consume backslash and next char
        str += this.advance();
        if (this.cursor < this.length) {
          str += this.advance();
        }
      } else if (ch === '"') {
        str += this.advance(); // consume closing quote
        break;
      } else if (ch === "\n") {
        // Unterminated string on current line
        break;
      } else {
        str += this.advance();
      }
    }

    return {
      type: "STRING",
      value: str,
      line: startLine,
      col: startCol
    };
  }

  /**
   * Scans character literals ('a', '\n')
   */
  scanCharLiteral(startLine, startCol) {
    let charLit = this.advance(); // consume opening single quote '\''

    while (this.cursor < this.length) {
      const ch = this.peek();
      if (ch === "\\") {
        charLit += this.advance();
        if (this.cursor < this.length) {
          charLit += this.advance();
        }
      } else if (ch === "'") {
        charLit += this.advance(); // closing quote
        break;
      } else if (ch === "\n") {
        break;
      } else {
        charLit += this.advance();
      }
    }

    return {
      type: "CONSTANT_CHAR",
      value: charLit,
      line: startLine,
      col: startCol
    };
  }

  /**
   * Scans numeric constants (Integers, Decimals, Hex, Octal, Floats, Scientific Notation)
   */
  scanNumber(startLine, startCol) {
    let num = "";
    let isFloat = false;

    // Check Hexadecimal (0x... or 0X...)
    if (this.peek() === "0" && (this.peek(1) === "x" || this.peek(1) === "X")) {
      num += this.advance(); // '0'
      num += this.advance(); // 'x' or 'X'
      while (this.isHexDigit(this.peek())) {
        num += this.advance();
      }
    }
    // Check Binary extension (0b... or 0B...)
    else if (this.peek() === "0" && (this.peek(1) === "b" || this.peek(1) === "B")) {
      num += this.advance();
      num += this.advance();
      while (this.peek() === "0" || this.peek() === "1") {
        num += this.advance();
      }
    }
    // Decimal / Octal / Float
    else {
      while (this.isDigit(this.peek())) {
        num += this.advance();
      }

      // Fractional part (e.g. 3.14, 10.5, 10.f, .5)
      // Check that '.' is not the start of the '...' operator
      if (this.peek() === "." && this.peek(1) !== ".") {
        isFloat = true;
        num += this.advance(); // '.'
        while (this.isDigit(this.peek())) {
          num += this.advance();
        }
      }

      // Exponent part (e.g. 1e-5, 2.5E+3)
      if (this.peek() === "e" || this.peek() === "E") {
        isFloat = true;
        num += this.advance(); // 'e'
        if (this.peek() === "+" || this.peek() === "-") {
          num += this.advance();
        }
        while (this.isDigit(this.peek())) {
          num += this.advance();
        }
      }
    }

    // Number type suffixes: U, L, LL, F, etc. (e.g., 100UL, 3.14f)
    while (true) {
      const s = this.peek();
      if (s === "u" || s === "U" || s === "l" || s === "L" || s === "f" || s === "F") {
        if (s === "f" || s === "F") isFloat = true;
        num += this.advance();
      } else {
        break;
      }
    }

    return {
      type: isFloat ? "CONSTANT_FLOAT" : "CONSTANT_INT",
      value: num,
      line: startLine,
      col: startCol
    };
  }

  /**
   * Scans words and differentiates Keywords from Identifiers using lookup table
   */
  scanIdentifierOrKeyword(startLine, startCol) {
    let word = "";
    while (this.cursor < this.length && this.isAlnum(this.peek())) {
      word += this.advance();
    }

    // Lookup table check: Is it in the standard C keyword set?
    const isKeyword = C_KEYWORDS.has(word);

    return {
      type: isKeyword ? "KEYWORD" : "IDENTIFIER",
      value: word,
      line: startLine,
      col: startCol
    };
  }

  /**
   * Matches operators using the Longest Match rule
   */
  matchOperator(startLine, startCol) {
    for (const op of C_OPERATORS) {
      let match = true;
      for (let i = 0; i < op.length; i++) {
        if (this.peek(i) !== op[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        // Advance cursor by the length of the matched operator
        for (let i = 0; i < op.length; i++) {
          this.advance();
        }
        return {
          type: "OPERATOR",
          value: op,
          line: startLine,
          col: startCol
        };
      }
    }
    return null;
  }
}

// ============================================================================
// 3. SAMPLE C PROGRAMS FOR DEMONSTRATION & VIVA
// ============================================================================

const SAMPLE_PROGRAMS = {
  hello: `// Sample 1: Preprocessor, Keywords & String Output
#include <stdio.h>

#define GREETING "Hello, Compiler Design!"

int main() {
    // Print a welcoming message to console
    printf("%s\\n", GREETING);
    
    int studentId = 101;
    float score = 98.5f;

    printf("ID: %d, Score: %.1f\\n", studentId, score);
    return 0;
}`,

  factorial: `// Sample 2: Recursion, Pointers & Conditional Statements
#include <stdio.h>

/*
 * Computes the factorial of a positive integer
 * using recursive function calls.
 */
long factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}

void computeWithPointer(int *valPtr) {
    if (valPtr != NULL) {
        *valPtr = *valPtr + 5;
    }
}

int main() {
    int num = 5;
    computeWithPointer(&num);
    long result = factorial(num);

    printf("Factorial of %d is %ld\\n", num, result);
    return 0;
}`,

  bubbleSort: `// Sample 3: Arrays, Nested Loops & Arithmetic Operators
#include <stdio.h>

void bubbleSort(int arr[], int n) {
    int i, j, temp;
    for (i = 0; i < n - 1; i++) {
        for (j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap adjacent elements
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main() {
    int data[] = {64, 34, 25, 12, 22, 11, 90};
    int size = sizeof(data) / sizeof(data[0]);

    bubbleSort(data, size);

    printf("Sorted array: ");
    for (int k = 0; k < size; k++) {
        printf("%d ", data[k]);
    }
    printf("\\n");
    return 0;
}`,

  complex: `/*
 * Sample 4: Advanced C Constructs
 * Structs, Hex Numbers, Bitwise & Pointer Operators
 */
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int id;
    double weight;
    struct Node *next;
};

#define BIT_MASK 0x0F
#define PI 3.1415926535

int main() {
    struct Node first;
    first.id = 0x1A;        // Hexadecimal constant
    first.weight = 42.75e-2; // Floating constant with exponent
    first.next = NULL;

    // Bitwise and shift operations
    int flags = 0b1011;      // Binary constant
    int masked = (flags & BIT_MASK) << 2;

    printf("Node id: %d, masked: %d\\n", first.id, masked);
    return 0;
}`
};

// ============================================================================
// 4. UI CONTROLLER & EVENT COORDINATOR
// ============================================================================

class AppController {
  constructor() {
    // DOM Element References
    this.codeEditor = document.getElementById("codeEditor");
    this.highlightCode = document.getElementById("highlightCode");
    this.highlightDisplay = document.getElementById("highlightDisplay");
    this.lineNumbers = document.getElementById("lineNumbers");
    this.lineColCounter = document.getElementById("lineColCounter");
    this.charCount = document.getElementById("charCount");

    // Action Buttons
    this.btnHighlight = document.getElementById("btnHighlight");
    this.btnClear = document.getElementById("btnClear");
    this.btnCopy = document.getElementById("btnCopy");
    this.btnLoadSample = document.getElementById("btnLoadSample");
    this.sampleSelect = document.getElementById("sampleSelect");
    this.btnExportCSV = document.getElementById("btnExportCSV");
    this.btnExportJSON = document.getElementById("btnExportJSON");

    // Stats Counters
    this.statTotal = document.getElementById("statTotal");
    this.statKeywords = document.getElementById("statKeywords");
    this.statIdentifiers = document.getElementById("statIdentifiers");
    this.statConstants = document.getElementById("statConstants");
    this.statOperators = document.getElementById("statOperators");
    this.statStrings = document.getElementById("statStrings");
    this.statComments = document.getElementById("statComments");
    this.statPreprocessor = document.getElementById("statPreprocessor");

    // Table & Filters
    this.tokenTableBody = document.getElementById("tokenTableBody");
    this.filterType = document.getElementById("filterType");
    this.tokenSearch = document.getElementById("tokenSearch");
    this.toast = document.getElementById("toast");

    // State
    this.latestTokens = [];

    this.bindEvents();
    this.loadSampleProgram("hello");
  }

  /**
   * Attach all DOM event listeners
   */
  bindEvents() {
    // Real-time synchronization when typing in textarea
    this.codeEditor.addEventListener("input", () => {
      this.analyzeAndRender();
      this.updateCursorStats();
    });

    // Synchronize scroll position between textarea, pre display, and line numbers gutter
    this.codeEditor.addEventListener("scroll", () => {
      this.syncScroll();
    });

    // Cursor position tracking
    this.codeEditor.addEventListener("keyup", () => this.updateCursorStats());
    this.codeEditor.addEventListener("click", () => this.updateCursorStats());

    // Tab key support: indent with 4 spaces instead of losing focus
    this.codeEditor.addEventListener("keydown", (e) => this.handleKeyDown(e));

    // Header Action Buttons
    this.btnHighlight.addEventListener("click", () => {
      this.analyzeAndRender();
      this.showToast("Code highlighted!");
    });

    this.btnClear.addEventListener("click", () => this.clearAll());
    this.btnCopy.addEventListener("click", () => this.copyToClipboard());
    this.btnLoadSample.addEventListener("click", () => {
      this.loadSampleProgram(this.sampleSelect.value);
    });
    this.sampleSelect.addEventListener("change", (e) => {
      this.loadSampleProgram(e.target.value);
    });

    // Export Buttons
    this.btnExportCSV.addEventListener("click", () => this.exportCSV());
    this.btnExportJSON.addEventListener("click", () => this.exportJSON());

    // Table Search and Filter
    this.filterType.addEventListener("change", () => this.renderTokenTable());
    this.tokenSearch.addEventListener("input", () => this.renderTokenTable());

    // Window resize adjustment
    window.addEventListener("resize", () => this.syncScroll());
  }

  /**
   * Intercept Tab key in editor to insert 4 spaces
   */
  handleKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = this.codeEditor.selectionStart;
      const end = this.codeEditor.selectionEnd;
      const spaces = "    "; // 4 spaces for standard C indentation

      // Insert 4 spaces at cursor
      this.codeEditor.value =
        this.codeEditor.value.substring(0, start) +
        spaces +
        this.codeEditor.value.substring(end);

      // Move cursor right after the inserted spaces
      this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + spaces.length;

      this.analyzeAndRender();
      this.updateCursorStats();
    }
  }

  /**
   * Synchronizes vertical and horizontal scroll between layers
   */
  syncScroll() {
    this.highlightDisplay.scrollTop = this.codeEditor.scrollTop;
    this.highlightDisplay.scrollLeft = this.codeEditor.scrollLeft;
    this.lineNumbers.scrollTop = this.codeEditor.scrollTop;
  }

  /**
   * Updates line numbers gutter and cursor metadata
   */
  updateCursorStats() {
    const text = this.codeEditor.value;
    const cursorPos = this.codeEditor.selectionStart;

    // Calculate line and column
    const linesUpToCursor = text.substring(0, cursorPos).split("\n");
    const currentLine = linesUpToCursor.length;
    const currentCol = linesUpToCursor[linesUpToCursor.length - 1].length + 1;

    this.lineColCounter.textContent = `Line: ${currentLine}, Col: ${currentCol}`;
    this.charCount.textContent = `${text.length} characters`;

    // Update Line Numbers Gutter
    const totalLines = text.split("\n").length;
    const lineNumbersStr = Array.from({ length: totalLines }, (_, i) => i + 1).join("\n");
    this.lineNumbers.textContent = lineNumbersStr;
  }

  /**
   * Runs the Lexical Analyzer, updates highlighted HTML and statistics
   */
  analyzeAndRender() {
    const code = this.codeEditor.value;
    const lexer = new CLexer(code);
    this.latestTokens = lexer.tokenize();

    this.renderHighlightedCode(this.latestTokens);
    this.updateStatistics(this.latestTokens);
    this.renderTokenTable();
    this.syncScroll();
  }

  /**
   * Escapes HTML entities to prevent code injection & render correctly
   */
  escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Maps token type to CSS styling class name
   */
  getCssClassForToken(type) {
    switch (type) {
      case "KEYWORD": return "tok-keyword";
      case "IDENTIFIER": return "tok-identifier";
      case "OPERATOR": return "tok-operator";
      case "CONSTANT_INT": return "tok-constant-int";
      case "CONSTANT_FLOAT": return "tok-constant-float";
      case "CONSTANT_CHAR": return "tok-constant-char";
      case "STRING": return "tok-string";
      case "COMMENT": return "tok-comment";
      case "PREPROCESSOR": return "tok-preprocessor";
      case "DELIMITER": return "tok-delimiter";
      case "UNKNOWN": return "tok-unknown";
      default: return "";
    }
  }

  /**
   * Converts tokens to HTML spans and injects into highlight layer
   */
  renderHighlightedCode(tokens) {
    let html = "";

    for (const token of tokens) {
      const escaped = this.escapeHTML(token.value);
      if (token.type === "WHITESPACE") {
        html += escaped;
      } else {
        const cssClass = this.getCssClassForToken(token.type);
        html += `<span class="${cssClass}">${escaped}</span>`;
      }
    }

    // Appending a trailing newline if code ends with newline ensures editor alignment
    if (this.codeEditor.value.endsWith("\n")) {
      html += "\n";
    }

    this.highlightCode.innerHTML = html;
  }

  /**
   * Computes category-wise counts and updates top dashboard cards
   */
  updateStatistics(tokens) {
    let total = 0;
    let keywords = 0;
    let identifiers = 0;
    let constants = 0;
    let operators = 0;
    let strings = 0;
    let comments = 0;
    let preprocessor = 0;

    for (const tok of tokens) {
      if (tok.type === "WHITESPACE") continue; // Exclude whitespace from token count

      total++;
      switch (tok.type) {
        case "KEYWORD":
          keywords++;
          break;
        case "IDENTIFIER":
          identifiers++;
          break;
        case "CONSTANT_INT":
        case "CONSTANT_FLOAT":
          constants++;
          break;
        case "CONSTANT_CHAR":
        case "STRING":
          strings++;
          break;
        case "OPERATOR":
          operators++;
          break;
        case "COMMENT":
          comments++;
          break;
        case "PREPROCESSOR":
          preprocessor++;
          break;
      }
    }

    this.statTotal.textContent = total;
    this.statKeywords.textContent = keywords;
    this.statIdentifiers.textContent = identifiers;
    this.statConstants.textContent = constants;
    this.statOperators.textContent = operators;
    this.statStrings.textContent = strings;
    this.statComments.textContent = comments;
    this.statPreprocessor.textContent = preprocessor;
  }

  /**
   * Filters and renders the interactive Token Analysis Table
   */
  renderTokenTable() {
    const selectedFilter = this.filterType.value;
    const query = this.tokenSearch.value.trim().toLowerCase();

    // Filter out whitespace for the table view
    const meaningfulTokens = this.latestTokens.filter(t => t.type !== "WHITESPACE");

    const filtered = meaningfulTokens.filter(tok => {
      // 1. Category Filter Match
      let matchesFilter = true;
      if (selectedFilter !== "ALL") {
        if (selectedFilter === "CONSTANT") {
          matchesFilter = tok.type === "CONSTANT_INT" || tok.type === "CONSTANT_FLOAT";
        } else if (selectedFilter === "STRING") {
          matchesFilter = tok.type === "STRING" || tok.type === "CONSTANT_CHAR";
        } else {
          matchesFilter = tok.type === selectedFilter;
        }
      }

      // 2. Search Query Match
      let matchesSearch = true;
      if (query.length > 0) {
        matchesSearch =
          tok.value.toLowerCase().includes(query) ||
          tok.type.toLowerCase().includes(query);
      }

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      const msg = this.codeEditor.value.trim().length === 0
        ? "No tokens to display. Type C code or load a sample."
        : "No matching tokens found for the current filter/search.";
      this.tokenTableBody.innerHTML = `
        <tr class="empty-row">
          <td colspan="4">${msg}</td>
        </tr>
      `;
      return;
    }

    let rowsHtml = "";
    filtered.forEach((tok, idx) => {
      const badgeClass = `badge-${this.getBaseBadgeCategory(tok.type)}`;
      const escapedLexeme = this.escapeHTML(tok.value);
      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td><code class="token-code" title="${escapedLexeme}">${escapedLexeme}</code></td>
          <td><span class="badge ${badgeClass}">${tok.type}</span></td>
          <td>Line ${tok.line} : Col ${tok.col}</td>
        </tr>
      `;
    });

    this.tokenTableBody.innerHTML = rowsHtml;
  }

  /**
   * Maps detailed token type to simplified badge category
   */
  getBaseBadgeCategory(type) {
    if (type.startsWith("CONSTANT")) return "CONSTANT";
    return type;
  }

  /**
   * Loads a sample program into the editor
   */
  loadSampleProgram(sampleKey) {
    const code = SAMPLE_PROGRAMS[sampleKey];
    if (code) {
      this.codeEditor.value = code;
      this.sampleSelect.value = sampleKey;
      this.analyzeAndRender();
      this.updateCursorStats();
      this.codeEditor.scrollTop = 0;
      this.codeEditor.scrollLeft = 0;
      this.syncScroll();
    }
  }

  /**
   * Clears the editor, stats, and token table
   */
  clearAll() {
    this.codeEditor.value = "";
    this.analyzeAndRender();
    this.updateCursorStats();
    this.showToast("Editor cleared!");
  }

  /**
   * Copies current code to clipboard
   */
  copyToClipboard() {
    const text = this.codeEditor.value;
    if (!text) {
      this.showToast("Nothing to copy!");
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      this.showToast("Code copied to clipboard!");
    }).catch(() => {
      // Fallback for older browsers
      this.codeEditor.select();
      document.execCommand("copy");
      this.showToast("Code copied to clipboard!");
    });
  }

  /**
   * Displays a temporary notification toast
   */
  showToast(msg) {
    this.toast.textContent = msg;
    this.toast.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.add("hidden");
    }, 2200);
  }

  /**
   * Exports the token analysis table as CSV
   */
  exportCSV() {
    const meaningfulTokens = this.latestTokens.filter(t => t.type !== "WHITESPACE");
    if (meaningfulTokens.length === 0) {
      this.showToast("No tokens to export!");
      return;
    }

    let csv = "Token_Number,Lexeme,Token_Type,Line,Column\n";
    meaningfulTokens.forEach((tok, idx) => {
      const cleanVal = tok.value.replace(/"/g, '""');
      csv += `${idx + 1},"${cleanVal}",${tok.type},${tok.line},${tok.col}\n`;
    });

    this.downloadFile(csv, "c_tokens_analysis.csv", "text/csv;charset=utf-8;");
    this.showToast("Tokens exported as CSV!");
  }

  /**
   * Exports the token stream as JSON
   */
  exportJSON() {
    const meaningfulTokens = this.latestTokens.filter(t => t.type !== "WHITESPACE");
    if (meaningfulTokens.length === 0) {
      this.showToast("No tokens to export!");
      return;
    }

    const exportData = {
      project: "C Syntax Highlighter & Lexical Analyzer",
      timestamp: new Date().toISOString(),
      totalTokens: meaningfulTokens.length,
      tokens: meaningfulTokens.map((t, idx) => ({
        index: idx + 1,
        lexeme: t.value,
        type: t.type,
        line: t.line,
        column: t.col
      }))
    };

    const json = JSON.stringify(exportData, null, 2);
    this.downloadFile(json, "c_tokens_analysis.json", "application/json");
    this.showToast("Tokens exported as JSON!");
  }

  /**
   * Triggers browser download for generated data
   */
  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize Application once DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  new AppController();
});
